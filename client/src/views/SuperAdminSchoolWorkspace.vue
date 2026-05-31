<template>
  <AppLayout>
    <section class="school-workspace">
      <router-link to="/super-admin/schools" class="back-link">Back to Schools Dashboard</router-link>

      <header class="workspace-hero">
        <div class="school-title">
          <div class="avatar">{{ initials(school.school_name) }}</div>
          <div>
            <span class="eyebrow">School dashboard</span>
            <h1>{{ school.school_name || 'School workspace' }}</h1>
            <p>{{ school.school_email || 'Loading school details...' }}</p>
          </div>
        </div>
        <div class="hero-actions" v-if="school.school_id">
          <span class="status" :class="school.status">{{ statusLabel(school.status) }}</span>
          <button v-if="school.status === 'active'" type="button" class="warn" @click="runStatusAction('suspend')">Suspend</button>
          <button v-if="['suspended', 'deactivated'].includes(school.status)" type="button" class="approve" @click="runStatusAction('activate')">Reactivate</button>
        </div>
      </header>

      <div v-if="loading" class="workspace-skeleton" role="status">
        <article>
          <strong>School details</strong>
          <span></span>
          <span class="short"></span>
        </article>
        <article>
          <strong>DOS information</strong>
          <span></span>
          <span class="short"></span>
        </article>
        <article>
          <strong>Statistics</strong>
          <span></span>
          <span class="short"></span>
        </article>
        <article>
          <strong>Teachers</strong>
          <span></span>
          <span class="short"></span>
        </article>
        <article>
          <strong>Students</strong>
          <span></span>
          <span class="short"></span>
        </article>
      </div>
      <template v-else>
        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">Overview</span>
              <h2>School health</h2>
            </div>
            <small>{{ school.registration_number || 'No registration number' }}</small>
          </div>
          <div class="metric-grid">
            <article v-for="card in metricCards" :key="card.label">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <small>{{ card.caption }}</small>
            </article>
          </div>
        </section>

        <section class="section-block">
          <div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
          </div>

          <div v-if="activeTab === 'overview'" class="tab-panel">
            <div class="detail-grid">
              <span><small>School Code</small><strong>{{ school.school_code || 'Not set' }}</strong></span>
              <span><small>Registration</small><strong>{{ school.registration_number || 'Not set' }}</strong></span>
              <span><small>Plan</small><strong>{{ school.subscription_plan || 'Starter' }}</strong></span>
              <span><small>Subscription</small><strong>{{ statusLabel(school.subscription_status) }}</strong></span>
              <span><small>District</small><strong>{{ school.district || 'Not set' }}</strong></span>
              <span><small>Created</small><strong>{{ formatDate(school.created_at) }}</strong></span>
            </div>
          </div>

          <div v-else-if="activeTab === 'subscription'" class="tab-panel split-panel">
            <article>
              <h3>Subscription</h3>
              <div class="detail-grid compact">
                <span><small>Plan</small><strong>{{ school.subscription_plan || 'Starter' }}</strong></span>
                <span><small>Status</small><strong>{{ statusLabel(school.subscription_status) }}</strong></span>
                <span><small>Expires</small><strong>{{ formatDate(school.subscription_expires_at) }}</strong></span>
                <span><small>Auto Renewal</small><strong>{{ school.auto_renewal ? 'Enabled' : 'Disabled' }}</strong></span>
              </div>
            </article>
            <article>
              <h3>Billing Activity</h3>
              <div v-if="!billingEvents.length" class="empty-state">No billing events yet.</div>
              <div v-else class="mini-list">
                <span v-for="event in billingEvents" :key="event.billing_event_id || event.created_at">
                  <strong>{{ event.event_type || 'Billing event' }}</strong>
                  <small>{{ formatDateTime(event.created_at) }}</small>
                </span>
              </div>
            </article>
          </div>

          <div v-else-if="activeTab === 'dos'" class="tab-panel split-panel">
            <article>
              <h3>DOS Account</h3>
              <div class="dos-card">
                <div>
                  <strong>{{ school.dos_name || 'No DOS assigned' }}</strong>
                  <small>{{ school.dos_email || 'No DOS email' }}</small>
                </div>
                <span class="status" :class="school.dos_status">{{ statusLabel(school.dos_status) }}</span>
              </div>
            </article>
            <article>
              <h3>Login History</h3>
              <div v-if="!dosLoginHistory.length" class="empty-state">No DOS login history yet.</div>
              <div v-else class="mini-list">
                <span v-for="login in dosLoginHistory" :key="login.login_id || login.created_at">
                  <strong>{{ login.device || login.browser || 'DOS login' }}</strong>
                  <small>{{ login.ip_address || 'Unknown IP' }} - {{ formatDateTime(login.created_at) }}</small>
                </span>
              </div>
            </article>
          </div>

          <div v-else-if="activeTab === 'activity'" class="tab-panel">
            <div v-if="!activities.length" class="empty-state">No activity recorded for this school.</div>
            <div v-else class="activity-list">
              <article v-for="activity in activities" :key="activity.activity_id || activity.created_at">
                <strong>{{ activityLabel(activity.action) }}</strong>
                <span>{{ activity.message || school.school_name }}</span>
                <time>{{ formatDateTime(activity.created_at) }}</time>
              </article>
            </div>
          </div>

          <div v-else-if="activeTab === 'audit'" class="tab-panel">
            <div class="audit-tools">
              <input v-model.trim="auditSearch" type="search" placeholder="Search audit logs" autocomplete="off">
              <select v-model="auditCategory">
                <option value="">All Categories</option>
                <option value="school">School</option>
                <option value="subscription">Subscription</option>
                <option value="dos">DOS</option>
                <option value="security">Security</option>
              </select>
              <input v-model="auditFrom" type="date">
              <input v-model="auditTo" type="date">
              <button type="button" @click="exportAudit('csv')">Export CSV</button>
              <button type="button" @click="exportAudit('pdf')">Print Report</button>
            </div>
            <div v-if="!filteredAuditLogs.length" class="empty-state">No audit events recorded.</div>
            <div v-else class="activity-list">
              <article v-for="log in filteredAuditLogs" :key="log.audit_id || log.created_at">
                <strong>{{ log.actor_role || 'system' }}</strong>
                <span>{{ activityLabel(log.action) }}</span>
                <time>{{ formatDateTime(log.created_at) }}</time>
              </article>
            </div>
          </div>

          <div v-else class="tab-panel split-panel">
            <article>
              <div class="panel-title-row">
                <h3>Support Notes</h3>
                <button type="button" @click="startNewNote">Add Support Note</button>
              </div>
              <form v-if="noteEditorOpen" class="support-editor" @submit.prevent="saveSupportNote">
                <label>
                  <span>Title</span>
                  <input v-model.trim="noteForm.title" type="text" autocomplete="off" required>
                </label>
                <label>
                  <span>Priority</span>
                  <select v-model="noteForm.priority">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
                <label class="full">
                  <span>Internal Comment</span>
                  <textarea v-model.trim="noteForm.note" rows="5" placeholder="Write internal support details..." required></textarea>
                </label>
                <label class="full">
                  <span>Attachment Reference</span>
                  <input v-model.trim="noteForm.attachment" type="text" autocomplete="off" placeholder="Paste attachment link or reference">
                </label>
                <div class="editor-actions">
                  <button type="submit" :disabled="savingNote">{{ savingNote ? 'Saving...' : 'Save Note' }}</button>
                  <button type="button" class="secondary" @click="cancelNoteEdit">Cancel</button>
                </div>
              </form>
              <div v-if="!supportNotes.length" class="empty-state">No support notes yet.</div>
              <div v-else class="mini-list">
                <span v-for="note in supportNotes" :key="note.note_id || note.created_at">
                  <strong>{{ note.title || 'Support note' }}</strong>
                  <small>{{ note.priority || 'Medium' }} priority - {{ note.note || note.body || 'No details' }}</small>
                  <em v-if="note.attachment">{{ note.attachment }}</em>
                  <span class="note-actions">
                    <button type="button" @click="editSupportNote(note)">Edit</button>
                    <button type="button" class="danger" @click="deleteSupportNote(note)">Delete</button>
                  </span>
                </span>
              </div>
            </article>
            <article>
              <h3>School Boundaries</h3>
              <p>Super Admin manages access, subscription, DOS ownership, billing, and audit. Teachers, classes, subjects, and timetables remain school operations.</p>
            </article>
          </div>
        </section>
      </template>

      <div v-if="unsavedModalOpen" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
        <div class="modal-card">
          <h2 id="unsaved-title">You have unsaved changes</h2>
          <p>Do you want to save before leaving this support note?</p>
          <div class="modal-actions">
            <button type="button" @click="saveAndContinue">Save & Continue</button>
            <button type="button" class="secondary" @click="discardNoteChanges">Discard Changes</button>
            <button type="button" class="secondary" @click="unsavedModalOpen = false">Cancel</button>
          </div>
        </div>
      </div>

      <div v-if="deleteModalOpen" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="modal-card">
          <h2 id="delete-title">Delete support note?</h2>
          <p>This removes the note from the current workspace view.</p>
          <div class="modal-actions">
            <button type="button" class="danger" @click="confirmDeleteSupportNote">Delete</button>
            <button type="button" class="secondary" @click="deleteModalOpen = false">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const route = useRoute()
const loading = ref(false)
const school = ref({})
const activities = ref([])
const auditLogs = ref([])
const supportNotes = ref([])
const billingEvents = ref([])
const dosLoginHistory = ref([])
const activeTab = ref('overview')
const auditSearch = ref('')
const auditCategory = ref('')
const auditFrom = ref('')
const auditTo = ref('')
const noteEditorOpen = ref(false)
const savingNote = ref(false)
const editingNoteId = ref(null)
const hasUnsavedNoteChanges = ref(false)
const unsavedModalOpen = ref(false)
const deleteModalOpen = ref(false)
const pendingDeleteNote = ref(null)
const noteForm = reactive({ title: '', priority: 'Medium', note: '', attachment: '' })

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'dos', label: 'DOS' },
  { id: 'activity', label: 'Activity' },
  { id: 'audit', label: 'Audit' },
  { id: 'support', label: 'Support' }
]

const metricCards = computed(() => [
  { label: 'Teachers', value: school.value.teacher_count || 0, caption: 'school managed' },
  { label: 'Students', value: school.value.student_count || 0, caption: 'school managed' },
  { label: 'Classes', value: school.value.class_count || 0, caption: 'school managed' },
  { label: 'Subjects', value: school.value.subject_count || 0, caption: 'school managed' },
  { label: 'Combinations', value: school.value.combination_count || 0, caption: 'setup links' }
])

const filteredAuditLogs = computed(() => auditLogs.value.filter((log) => {
  const haystack = [log.actor_role, log.action, log.target, log.ip_address, log.location].filter(Boolean).join(' ').toLowerCase()
  const matchesSearch = !auditSearch.value || haystack.includes(auditSearch.value.toLowerCase())
  const matchesCategory = !auditCategory.value || String(log.action || '').toLowerCase().includes(auditCategory.value)
  const created = log.created_at ? new Date(log.created_at) : null
  const matchesFrom = !auditFrom.value || (created && created >= new Date(auditFrom.value))
  const matchesTo = !auditTo.value || (created && created <= new Date(`${auditTo.value}T23:59:59`))
  return matchesSearch && matchesCategory && matchesFrom && matchesTo
}))

const loadWorkspace = async () => {
  loading.value = true
  try {
    const response = await api.get(`/schools/${route.params.id}/workspace`)
    school.value = response.data.school || {}
    activities.value = response.data.activities || []
    auditLogs.value = response.data.audit_logs || []
    supportNotes.value = response.data.support_notes || []
    billingEvents.value = response.data.billing_events || []
    dosLoginHistory.value = response.data.dos_login_history || []
  } finally {
    loading.value = false
  }
}

const runStatusAction = async (action) => {
  await api.put(`/schools/${route.params.id}/${action}`)
  await loadWorkspace()
}

const resetNoteForm = () => {
  noteForm.title = ''
  noteForm.priority = 'Medium'
  noteForm.note = ''
  noteForm.attachment = ''
  editingNoteId.value = null
  hasUnsavedNoteChanges.value = false
}

const startNewNote = () => {
  resetNoteForm()
  noteEditorOpen.value = true
}

const editSupportNote = (note) => {
  editingNoteId.value = note.note_id || note.created_at
  noteForm.title = note.title || ''
  noteForm.priority = note.priority || 'Medium'
  noteForm.note = note.note || note.body || ''
  noteForm.attachment = note.attachment || ''
  noteEditorOpen.value = true
  hasUnsavedNoteChanges.value = false
}

const cancelNoteEdit = () => {
  if (hasUnsavedNoteChanges.value) {
    unsavedModalOpen.value = true
    return
  }
  noteEditorOpen.value = false
  resetNoteForm()
}

const saveAndContinue = async () => {
  await saveSupportNote()
  unsavedModalOpen.value = false
}

const discardNoteChanges = () => {
  noteEditorOpen.value = false
  unsavedModalOpen.value = false
  resetNoteForm()
}

const saveSupportNote = async () => {
  savingNote.value = true
  try {
    if (editingNoteId.value) {
      supportNotes.value = supportNotes.value.map((note) => (
        (note.note_id || note.created_at) === editingNoteId.value
          ? { ...note, ...noteForm, updated_at: new Date().toISOString() }
          : note
      ))
    } else {
      const response = await api.post(`/schools/${route.params.id}/support-notes`, noteForm)
      supportNotes.value = [response.data.note || { ...noteForm, created_at: new Date().toISOString() }, ...supportNotes.value]
    }
    noteEditorOpen.value = false
    resetNoteForm()
  } finally {
    savingNote.value = false
  }
}

const deleteSupportNote = (note) => {
  pendingDeleteNote.value = note
  deleteModalOpen.value = true
}

const confirmDeleteSupportNote = () => {
  const note = pendingDeleteNote.value
  if (!note) return
  const id = note.note_id || note.created_at
  supportNotes.value = supportNotes.value.filter((item) => (item.note_id || item.created_at) !== id)
  pendingDeleteNote.value = null
  deleteModalOpen.value = false
}

const exportAudit = (type) => {
  if (type === 'pdf') {
    window.print()
    return
  }
  const rows = [['Actor', 'Action', 'Target', 'Time'], ...filteredAuditLogs.value.map((log) => [log.actor_role || 'system', activityLabel(log.action), log.target || school.value.school_name || '', formatDateTime(log.created_at)])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${school.value.school_name || 'school'}-audit.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const handleBeforeUnload = (event) => {
  if (!hasUnsavedNoteChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

const statusLabel = (value) => {
  if (value === 'active') return 'Active'
  if (value === 'pending' || value === 'pending_approval') return 'Pending Approval'
  if (value === 'suspended') return 'Suspended'
  if (value === 'rejected') return 'Rejected'
  if (value === 'inactive' || value === 'deactivated') return 'Deactivated'
  if (value === 'trial') return 'Trial'
  if (value === 'past_due') return 'Past Due'
  return value || 'Unknown'
}

const initials = (name) => String(name || 'SC').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const activityLabel = (value) => String(value || 'activity').replace(/_/g, ' ')
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
const formatDateTime = (value) => value ? new Date(value).toLocaleString() : 'N/A'

watch(noteForm, () => {
  if (noteEditorOpen.value) hasUnsavedNoteChanges.value = true
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  loadWorkspace()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.school-workspace {
  display: grid;
  gap: 1rem;
  max-width: 1440px;
  margin: 0 auto;
}

.back-link {
  width: fit-content;
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

.workspace-hero,
.section-block {
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.workspace-hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1.3rem;
}

.school-title,
.hero-actions,
.section-head,
.tabs {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.school-title {
  min-width: 0;
}

.hero-actions,
.section-head {
  justify-content: space-between;
}

.avatar {
  width: 58px;
  height: 58px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 950;
}

.eyebrow {
  display: block;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: #0f172a;
}

p,
small,
.section-head small {
  color: #64748b;
}

.section-block {
  padding: 1rem;
}

.metric-grid,
.detail-grid,
.split-panel {
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
}

.metric-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-grid article,
.detail-grid span,
.split-panel article,
.dos-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  padding: 1rem;
}

.metric-grid span,
.detail-grid small {
  display: block;
  color: #64748b;
  font-weight: 850;
}

.metric-grid strong,
.detail-grid strong {
  display: block;
  color: #0f172a;
  font-size: 1.45rem;
}

.tabs {
  flex-wrap: wrap;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.tabs button,
.hero-actions button,
.audit-tools button,
.panel-title-row button,
.editor-actions button,
.note-actions button {
  border: 0;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  font-weight: 900;
  padding: 0.6rem 0.85rem;
}

.tabs button.active {
  background: #2563eb;
  color: #fff;
}

.warn {
  background: #f97316 !important;
  color: #fff !important;
}

.approve {
  background: #16a34a !important;
  color: #fff !important;
}

.status {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 900;
}

.status.active {
  background: #dcfce7;
  color: #166534;
}

.status.suspended,
.status.deactivated,
.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.tab-panel {
  padding-top: 1rem;
}

.audit-tools,
.panel-title-row,
.editor-actions,
.note-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
}

.audit-tools {
  margin-bottom: 1rem;
}

.audit-tools input,
.audit-tools select,
.support-editor input,
.support-editor select,
.support-editor textarea {
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  padding: 0.6rem 0.75rem;
}

.panel-title-row {
  justify-content: space-between;
}

.support-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
  padding: 0.85rem;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: #eff6ff;
}

.support-editor label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-weight: 850;
}

.support-editor .full {
  grid-column: 1 / -1;
}

.support-editor textarea {
  resize: vertical;
}

.editor-actions .secondary,
.note-actions button {
  background: #fff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.note-actions .danger {
  color: #991b1b;
}

.detail-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.detail-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.split-panel {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.dos-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.mini-list,
.activity-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.mini-list span,
.activity-list article {
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem;
}

.mini-list em {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-style: normal;
  margin-top: 0.35rem;
}

.activity-list article {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.activity-list strong {
  text-transform: capitalize;
}

.activity-list time {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}

.state,
.empty-state {
  padding: 1rem;
  color: #64748b;
  text-align: center;
}

.workspace-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.85rem;
}

.workspace-skeleton article {
  display: grid;
  gap: 0.65rem;
  min-height: 128px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
}

.workspace-skeleton strong {
  color: #2563eb;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.workspace-skeleton span {
  width: 84%;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

.workspace-skeleton span.short {
  width: 56%;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.42);
}

.modal-card {
  width: min(440px, 100%);
  display: grid;
  gap: 0.75rem;
  border-radius: 16px;
  background: #fff;
  padding: 1.1rem;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.modal-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.modal-actions button {
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-weight: 900;
  padding: 0.6rem 0.8rem;
}

.modal-actions .secondary {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.modal-actions .danger {
  background: #dc2626;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

@media (max-width: 900px) {
  .workspace-hero,
  .section-head,
  .split-panel {
    align-items: flex-start;
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .activity-list article {
    grid-template-columns: 1fr;
  }

  .support-editor {
    grid-template-columns: 1fr;
  }
}
</style>

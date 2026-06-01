<template>
  <AppLayout>
    <section class="dos-dashboard">
      <header class="page-header">
        <div>
          <h1>Directors of Studies</h1>
          <p>Manage DOS accounts across all schools.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="primary-action" @click="createDosOpen = true">+ Create DOS</button>
          <button type="button" class="ghost-button" @click="exportRows">Export</button>
          <button type="button" class="ghost-button" @click="loadDosAccounts">Refresh</button>
        </div>
      </header>

      <form v-if="createDosOpen" class="create-dos-panel" @submit.prevent="createDosAccount">
        <div class="section-head">
          <div>
            <span class="eyebrow">DOS account</span>
            <h2>Create DOS for an existing school</h2>
            <p>Use this for Super Admin-created schools. Public school registrations stay separate.</p>
          </div>
          <button type="button" class="ghost-button" @click="createDosOpen = false">Cancel</button>
        </div>
        <fieldset :disabled="creatingDos">
          <div class="create-dos-grid">
            <label>
              <span>School</span>
              <select v-model="newDos.school_id" required>
                <option value="">Choose school</option>
                <option v-for="school in schools" :key="school.school_id" :value="school.school_id">
                  {{ school.school_name }}{{ school.dos_name ? ' - replacing current DOS' : '' }}
                </option>
              </select>
            </label>
            <label><span>Full Name</span><input v-model.trim="newDos.full_name" type="text" autocomplete="off" required></label>
            <label><span>Email</span><input v-model.trim="newDos.email" type="email" autocomplete="off" required></label>
            <label><span>Phone</span><input v-model.trim="newDos.phone" type="tel" autocomplete="off"></label>
            <label><span>National ID</span><input v-model.trim="newDos.national_id" type="text" autocomplete="off"></label>
            <label><span>Temporary Password</span><input v-model="newDos.password" type="password" autocomplete="new-password" required></label>
          </div>
        </fieldset>
        <div class="form-actions">
          <span v-if="createDosMessage" :class="createDosMessageType">{{ createDosMessage }}</span>
          <button type="submit" class="primary-action inline-loading" :disabled="creatingDos">
            <i v-if="creatingDos" aria-hidden="true"></i>
            {{ creatingDos ? 'Assigning Director of Studies...' : 'Create DOS' }}
          </button>
        </div>
      </form>

      <section class="metric-row" aria-label="DOS account metrics">
        <article v-for="card in metricCards" :key="card.label" :class="card.tone" @click="applyStatus(card.status)">
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </article>
      </section>

      <section class="section-block">
        <div class="filters">
          <input v-model.trim="search" type="search" autocomplete="off" placeholder="Search DOS, school, email...">
          <select v-model="status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="missing">Missing DOS</option>
            <option value="transfer_pending">Transfer Pending</option>
          </select>
          <select v-model="schoolFilter">
            <option value="">All schools</option>
            <option v-for="school in schoolOptions" :key="school" :value="school">{{ school }}</option>
          </select>
          <select v-model="regionFilter">
            <option value="">All regions</option>
            <option v-for="region in regionOptions" :key="region" :value="region">{{ region }}</option>
          </select>
          <select v-model="createdFilter">
            <option value="">Any created date</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button type="button" class="ghost-button" @click="resetFilters">Reset Filters</button>
        </div>

        <div v-if="selectedIds.length" class="bulk-toolbar">
          <strong>{{ selectedIds.length }} selected</strong>
          <select v-model="bulkChoice" aria-label="Bulk action">
            <option value="">Bulk Actions</option>
            <option value="Export">Export</option>
          </select>
          <button type="button" class="primary-action" :disabled="!bulkChoice" @click="runBulkAction">Apply</button>
          <button type="button" class="ghost-button" @click="selectedIds = []">Clear</button>
        </div>

        <div v-if="loading" class="skeleton-stack">
          <span v-for="item in 6" :key="item"></span>
        </div>

        <div v-else-if="!filteredDos.length" class="empty-state">
          <strong>No Directors of Studies found</strong>
          <span>Create your first DOS account or reset your filters.</span>
          <button type="button" class="primary-action" @click="createDosOpen = true">Create DOS</button>
        </div>

        <div v-else class="table-card">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" :checked="allSelected" aria-label="Select all DOS accounts" @change="toggleSelectAll"></th>
                <th>DOS</th>
                <th>School</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>School Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dos in filteredDos" :key="dos.row_id">
                <td><input v-model="selectedIds" type="checkbox" :value="dos.row_id" :aria-label="`Select ${dos.dos_name || dos.school_name}`"></td>
                <td>
                  <button type="button" class="link-button" @click="selectedDos = dos">{{ dos.dos_name || 'No DOS assigned' }}</button>
                  <small>{{ dos.ownership_status }}</small>
                </td>
                <td>
                  <strong>{{ dos.school_name }}</strong>
                  <small>{{ dos.school_code || 'No code' }}</small>
                </td>
                <td>{{ dos.dos_email || 'No email recorded' }}</td>
                <td><span class="status-pill" :class="dos.dos_status">{{ statusLabel(dos.dos_status) }}</span></td>
                <td>{{ dos.last_login_label }}</td>
                <td>{{ formatDate(dos.created_at) }}</td>
                <td>
                  <span class="health-chip" :class="dos.school_health_tone">{{ dos.school_health }}</span>
                  <small>{{ dos.teacher_count || 0 }} staff - {{ dos.student_count || 0 }} students</small>
                </td>
                <td class="actions-cell">
                  <button type="button" class="menu-button" @click="activeMenu = activeMenu === dos.row_id ? '' : dos.row_id">...</button>
                  <div v-if="activeMenu === dos.row_id" class="action-menu">
                    <button type="button" @click="selectedDos = dos; activeMenu = ''">View Profile</button>
                    <button type="button" @click="openSchool(dos)">Open School</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside v-if="selectedDos" class="profile-drawer" aria-label="DOS profile">
        <button type="button" class="close-button" @click="selectedDos = null">x</button>
        <div class="drawer-head">
          <span class="avatar">{{ initials(selectedDos.dos_name || selectedDos.school_name) }}</span>
          <div>
            <h2>{{ selectedDos.dos_name || 'No DOS assigned' }}</h2>
            <p>{{ selectedDos.dos_email || 'No email recorded' }}</p>
          </div>
        </div>
        <dl>
          <div><dt>School</dt><dd>{{ selectedDos.school_name }}</dd></div>
          <div><dt>Status</dt><dd><span class="status-pill" :class="selectedDos.dos_status">{{ statusLabel(selectedDos.dos_status) }}</span></dd></div>
          <div><dt>Last Login</dt><dd>{{ selectedDos.last_login_label }}</dd></div>
          <div><dt>Created</dt><dd>{{ formatDate(selectedDos.created_at) }}</dd></div>
          <div><dt>Permissions</dt><dd>Manage Timetable, Staff, Exams</dd></div>
        </dl>
        <div class="drawer-actions">
          <button type="button" class="primary-action" @click="openSchool(selectedDos)">Open School</button>
        </div>
      </aside>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const router = useRouter()
const schools = ref([])
const search = ref('')
const status = ref('')
const schoolFilter = ref('')
const regionFilter = ref('')
const createdFilter = ref('')
const selectedIds = ref([])
const bulkChoice = ref('')
const activeMenu = ref('')
const selectedDos = ref(null)
const loading = ref(false)
const createDosOpen = ref(false)
const creatingDos = ref(false)
const createDosMessage = ref('')
const createDosMessageType = ref('success')
const emptyNewDos = () => ({
  school_id: '',
  full_name: '',
  email: '',
  phone: '',
  national_id: '',
  password: 'School123'
})
const newDos = ref(emptyNewDos())

const dosAccounts = computed(() => schools.value.map((school) => {
  const missing = !school.dos_name && !school.dos_email
  const rawStatus = missing ? 'missing' : (school.dos_status || school.status || 'inactive')
  const normalizedStatus = rawStatus === 'deactivated' || rawStatus === 'suspended' ? 'inactive' : rawStatus
  const lastLogin = school.last_login_at || school.dos_last_login_at || school.last_activity_at
  const healthTone = school.status === 'active' && !missing ? 'good' : missing ? 'danger' : 'warning'
  return {
    ...school,
    row_id: school.director_id || school.user_id || `school-${school.school_id}`,
    dos_status: normalizedStatus,
    ownership_status: missing ? 'Ownership missing' : 'Primary owner',
    region: school.province || school.district || 'Unassigned',
    last_login_label: formatRelative(lastLogin),
    school_health: healthTone === 'good' ? 'Healthy' : healthTone === 'danger' ? 'Needs DOS' : 'Review',
    school_health_tone: healthTone
  }
}))

const filteredDos = computed(() => dosAccounts.value.filter((dos) => {
  const haystack = [dos.dos_name, dos.dos_email, dos.school_name, dos.school_code, dos.region].filter(Boolean).join(' ').toLowerCase()
  const matchesSearch = !search.value || haystack.includes(search.value.toLowerCase())
  const matchesStatus = !status.value || dos.dos_status === status.value
  const matchesSchool = !schoolFilter.value || dos.school_name === schoolFilter.value
  const matchesRegion = !regionFilter.value || dos.region === regionFilter.value
  const matchesCreated = !createdFilter.value || daysSince(dos.created_at) <= Number(createdFilter.value)
  return matchesSearch && matchesStatus && matchesSchool && matchesRegion && matchesCreated
}))

const metricCards = computed(() => [
  { label: 'Total DOS', value: dosAccounts.value.filter((dos) => dos.dos_status !== 'missing').length, tone: 'blue', status: '' },
  { label: 'Active', value: dosAccounts.value.filter((dos) => dos.dos_status === 'active').length, tone: 'green', status: 'active' },
  { label: 'Inactive', value: dosAccounts.value.filter((dos) => dos.dos_status === 'inactive').length, tone: 'rose', status: 'inactive' },
  { label: 'Missing DOS', value: dosAccounts.value.filter((dos) => dos.dos_status === 'missing').length, tone: 'amber', status: 'missing' },
  { label: 'Pending Invitations', value: dosAccounts.value.filter((dos) => ['pending', 'pending_approval'].includes(dos.dos_status)).length, tone: 'amber', status: 'pending' },
  { label: 'Transfers Pending', value: dosAccounts.value.filter((dos) => dos.dos_status === 'transfer_pending').length, tone: 'blue', status: 'transfer_pending' }
])

const schoolOptions = computed(() => [...new Set(dosAccounts.value.map((dos) => dos.school_name).filter(Boolean))])
const regionOptions = computed(() => [...new Set(dosAccounts.value.map((dos) => dos.region).filter(Boolean))])
const allSelected = computed(() => filteredDos.value.length > 0 && filteredDos.value.every((dos) => selectedIds.value.includes(dos.row_id)))

const loadDosAccounts = async () => {
  loading.value = true
  try {
    const response = await api.get('/schools')
    schools.value = response.data.schools || []
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  search.value = ''
  status.value = ''
  schoolFilter.value = ''
  regionFilter.value = ''
  createdFilter.value = ''
}

const applyStatus = (nextStatus) => {
  status.value = nextStatus || ''
}

const toggleSelectAll = () => {
  selectedIds.value = allSelected.value ? [] : filteredDos.value.map((dos) => dos.row_id)
}

const runBulkAction = () => {
  if (bulkChoice.value === 'Export') exportRows()
  bulkChoice.value = ''
}

const exportRows = () => {
  const rows = [['DOS', 'School', 'Email', 'Status', 'Last Login', 'Created'], ...filteredDos.value.map((dos) => [
    dos.dos_name || 'No DOS assigned',
    dos.school_name,
    dos.dos_email || '',
    statusLabel(dos.dos_status),
    dos.last_login_label,
    formatDate(dos.created_at)
  ])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'dos-accounts.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const openSchool = (dos) => {
  router.push(`/super-admin/schools/${dos.school_id}`)
}

const createDosAccount = async () => {
  creatingDos.value = true
  createDosMessage.value = ''
  try {
    await api.post(`/schools/${newDos.value.school_id}/dos`, {
      full_name: newDos.value.full_name,
      email: newDos.value.email,
      phone: newDos.value.phone,
      national_id: newDos.value.national_id,
      password: newDos.value.password
    })
    createDosMessage.value = 'DOS assigned successfully.'
    createDosMessageType.value = 'success'
    newDos.value = emptyNewDos()
    createDosOpen.value = false
    await loadDosAccounts()
  } catch (error) {
    createDosMessage.value = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Could not create DOS account.'
    createDosMessageType.value = 'error'
  } finally {
    creatingDos.value = false
  }
}

const statusLabel = (value) => {
  if (value === 'active') return 'Active'
  if (value === 'pending' || value === 'pending_approval') return 'Pending'
  if (value === 'inactive') return 'Inactive'
  if (value === 'missing') return 'Missing DOS'
  if (value === 'transfer_pending') return 'Transfer Pending'
  return value || 'Unknown'
}

const initials = (name) => String(name || 'DS').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
const daysSince = (value) => value ? (Date.now() - new Date(value).getTime()) / 86400000 : Infinity
const formatRelative = (value) => {
  if (!value) return 'Never'
  const days = Math.floor(daysSince(value))
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

onMounted(loadDosAccounts)
</script>

<style scoped>
.dos-dashboard {
  display: grid;
  gap: 0.8rem;
  width: 100%;
  margin: 0 auto;
}

.page-header,
.section-block,
.create-dos-panel,
.metric-row article {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
}

h1,
h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

h1 {
  font-size: clamp(1.45rem, 2vw, 1.9rem);
}

p,
small,
.empty-state span {
  color: #64748b;
}

.header-actions,
.section-head,
.filters,
.bulk-toolbar,
.drawer-actions,
.form-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.section-head {
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.section-head p {
  margin: 0.2rem 0 0;
}

.eyebrow {
  display: block;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.primary-action,
.ghost-button,
.danger-button,
button {
  border: 0;
  border-radius: 9px;
  padding: 0.55rem 0.75rem;
  font-weight: 900;
  cursor: pointer;
}

.primary-action {
  background: #2563eb;
  color: #fff;
}

.ghost-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.danger-button,
.danger {
  background: #fee2e2;
  color: #991b1b;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.7rem;
}

.metric-row article {
  display: grid;
  gap: 0.15rem;
  padding: 0.8rem 0.9rem;
  cursor: pointer;
}

.metric-row strong {
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1;
}

.metric-row span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
}

.blue { color: #2563eb; }
.green { color: #16a34a; }
.amber { color: #d97706; }
.rose { color: #e11d48; }

.section-block {
  padding: 0.9rem;
}

.create-dos-panel {
  padding: 0.9rem;
}

.create-dos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.create-dos-grid label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 900;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 0.85rem;
}

.form-actions span {
  margin-right: auto;
  color: #16a34a;
  font-weight: 900;
}

.form-actions span.error {
  color: #dc2626;
}

.filters {
  margin-bottom: 0.75rem;
}

input,
select {
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  padding: 0 0.7rem;
}

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

.inline-loading {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.inline-loading i {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: spin 0.65s linear infinite;
}

.filters input {
  flex: 1 1 280px;
}

.bulk-toolbar {
  margin-bottom: 0.75rem;
  padding: 0.65rem;
  border-radius: 12px;
  background: #eff6ff;
}

.table-card {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

th,
td {
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

td strong,
td small {
  display: block;
}

.link-button {
  padding: 0;
  background: transparent;
  color: #0f172a;
  font-weight: 950;
  text-align: left;
}

.status-pill,
.health-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  font-size: 0.76rem;
  font-weight: 950;
}

.status-pill.active,
.health-chip.good {
  background: #dcfce7;
  color: #166534;
}

.status-pill.pending,
.status-pill.pending_approval,
.health-chip.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.inactive,
.status-pill.missing,
.health-chip.danger {
  background: #fee2e2;
  color: #991b1b;
}

.status-pill.transfer_pending {
  background: #dbeafe;
  color: #1d4ed8;
}

.actions-cell {
  position: relative;
}

.menu-button {
  background: #f1f5f9;
  color: #334155;
}

.action-menu {
  position: absolute;
  right: 0.6rem;
  top: 2.4rem;
  z-index: 20;
  display: grid;
  min-width: 190px;
  padding: 0.35rem;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
}

.action-menu button {
  background: transparent;
  color: #334155;
  text-align: left;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  padding: 2rem;
  color: #0f172a;
}

.skeleton-stack {
  display: grid;
  gap: 0.55rem;
}

.skeleton-stack span {
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

.profile-drawer {
  position: fixed;
  inset: 62px 0 0 auto;
  z-index: 800;
  display: grid;
  align-content: start;
  gap: 1rem;
  width: min(420px, 100vw);
  padding: 1rem;
  border-left: 1px solid #dbeafe;
  background: #fff;
  box-shadow: -18px 0 42px rgba(15, 23, 42, 0.16);
}

.close-button {
  justify-self: end;
  background: #f1f5f9;
  color: #334155;
}

.drawer-head {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 950;
}

dl,
dl div {
  display: grid;
  gap: 0.4rem;
}

dl div {
  grid-template-columns: 120px 1fr;
  padding: 0.6rem 0;
  border-bottom: 1px solid #e2e8f0;
}

dt {
  color: #64748b;
  font-weight: 900;
}

dd {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .metric-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .create-dos-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .create-dos-grid {
    grid-template-columns: 1fr;
  }

  .table-card table,
  .table-card thead,
  .table-card tbody,
  .table-card tr,
  .table-card td {
    display: block;
  }

  .table-card thead {
    display: none;
  }

  .table-card tr {
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .table-card td {
    border: 0;
    padding: 0.35rem 0;
  }
}
</style>

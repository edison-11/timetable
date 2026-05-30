<template>
  <AppLayout>
    <div class="schools-dashboard">
      <header class="schools-header">
        <div>
          <h1>Schools Management</h1>
          <p>Manage and monitor all schools.</p>
        </div>
          <button type="button" class="primary-action" @click="addSchoolOpen = true">+ Add School</button>
      </header>

      <form v-if="addSchoolOpen" class="add-school-panel" @submit.prevent="createSchool">
        <div class="section-head">
          <div>
            <span class="eyebrow">School record</span>
            <h2>Add school only</h2>
            <p>Create the school workspace first. Add or transfer the DOS from the DOS section.</p>
          </div>
          <button type="button" class="ghost-button" @click="addSchoolOpen = false">Cancel</button>
        </div>
        <div class="add-school-grid">
          <label><span>School Name</span><input v-model.trim="newSchool.school_name" type="text" autocomplete="off" required></label>
          <label><span>School Email</span><input v-model.trim="newSchool.school_email" type="email" autocomplete="off" required></label>
          <label><span>School Code</span><input v-model.trim="newSchool.school_code" type="text" autocomplete="off"></label>
          <label><span>Phone</span><input v-model.trim="newSchool.phone" type="tel" autocomplete="off"></label>
          <label><span>Registration Number</span><input v-model.trim="newSchool.registration_number" type="text" autocomplete="off" required></label>
          <label><span>School Type</span>
            <select v-model="newSchool.school_type">
              <option value="">Select type</option>
              <option>Public</option>
              <option>Private</option>
              <option>Government Aided</option>
              <option>International</option>
            </select>
          </label>
          <label><span>Province</span><input v-model.trim="newSchool.province" type="text" autocomplete="off"></label>
          <label><span>District</span><input v-model.trim="newSchool.district" type="text" autocomplete="off"></label>
          <label class="span-2"><span>School Address</span><input v-model.trim="newSchool.school_address" type="text" autocomplete="off"></label>
        </div>
        <div class="form-actions">
          <span v-if="addSchoolMessage" :class="addSchoolMessageType">{{ addSchoolMessage }}</span>
          <button type="submit" class="primary-action" :disabled="creatingSchool">{{ creatingSchool ? 'Creating...' : 'Create School' }}</button>
        </div>
      </form>

      <section class="metric-row" aria-label="School metrics">
        <article v-for="card in metricCards" :key="card.label" :class="card.tone" @click="status = card.status">
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </article>
      </section>

      <section v-if="pendingSchools.length" class="section-block approval-alert">
        <div class="section-head">
          <div>
            <span class="eyebrow">Approvals</span>
            <h2>{{ pendingSchools.length }} Schools Awaiting Approval</h2>
          </div>
          <button type="button" class="ghost-button" @click="status = 'pending_approval'">Review</button>
        </div>
      </section>

      <section class="section-block">
        <div class="filters">
          <input v-model.trim="search" class="search-input" type="search" placeholder="Search schools, DOS, code..." autocomplete="off">
          <select v-model="status">
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="deactivated">Inactive</option>
          </select>
          <select v-model="region">
            <option value="">All Regions</option>
            <option v-for="item in regionOptions" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="subscription">
            <option value="">All Subscriptions</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
          <select v-model="dosFilter">
            <option value="">All DOS</option>
            <option value="assigned">DOS Assigned</option>
            <option value="missing">Missing DOS</option>
          </select>
          <button type="button" class="ghost-button" @click="resetFilters">Reset Filters</button>
        </div>

        <div v-if="selectedIds.length" class="bulk-toolbar">
          <strong>{{ selectedIds.length }} schools selected</strong>
          <button type="button" class="warn" @click="bulkAction('suspend')">Suspend</button>
          <button type="button" class="approve" @click="bulkAction('activate')">Activate</button>
          <button type="button" class="ghost-button" @click="queueAction('Announcement queued for selected schools')">Send Announcement</button>
          <button type="button" class="ghost-button" @click="exportSelected">Export</button>
          <button type="button" class="reject" @click="bulkAction('deactivate')">Delete</button>
          <button type="button" class="ghost-button" @click="selectedIds = []">Clear</button>
        </div>

        <div v-if="queuedMessage" class="compact-announcement">
          <strong>Recent Announcement Sent:</strong>
          <span>{{ queuedMessage }}</span>
          <button type="button" class="ghost-button" @click="router.push('/super-admin/administration')">Create Announcement</button>
        </div>

        <div v-if="loading" class="skeleton-stack">
          <span v-for="item in 6" :key="item"></span>
        </div>
        <div v-else-if="!filteredSchools.length" class="empty-state">
          <strong>No schools found</strong>
          <span>Start by creating your first school or reset your filters.</span>
          <button type="button" class="primary-action" @click="addSchoolOpen = true">Add School</button>
        </div>

        <div v-else class="table-card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" :checked="allPageSelected" aria-label="Select all schools on page" @change="toggleSelectPage"></th>
                  <th><button type="button" class="sort-button" @click="setSort('school_name')">School {{ sortIcon('school_name') }}</button></th>
                  <th><button type="button" class="sort-button" @click="setSort('dos_name')">DOS {{ sortIcon('dos_name') }}</button></th>
                  <th>Health</th>
                  <th>Setup Progress</th>
                  <th><button type="button" class="sort-button" @click="setSort('status')">Status {{ sortIcon('status') }}</button></th>
                  <th>Last Activity</th>
                  <th><button type="button" class="sort-button" @click="setSort('created_at')">Created {{ sortIcon('created_at') }}</button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="school in paginatedSchools" :key="school.school_id" @click="selectedSchool = school">
                  <td @click.stop><input v-model="selectedIds" type="checkbox" :value="school.school_id" :aria-label="`Select ${school.school_name}`"></td>
                  <td>
                    <strong>{{ school.school_name }}</strong>
                    <small>{{ school.school_code || 'No code' }} - {{ school.school_type || 'School' }} - {{ school.subscription_plan || 'Starter' }}</small>
                  </td>
                  <td>
                    <strong>{{ school.dos_name || 'Not assigned' }}</strong>
                    <small>{{ school.dos_email || 'No DOS email' }}</small>
                  </td>
                  <td><span class="health-chip" :class="school.healthTone">{{ school.healthLabel }}</span></td>
                  <td>
                    <button type="button" class="progress-cell" @click.stop="selectedSchool = school">
                      <span><i :style="{ width: `${school.setupProgress}%` }"></i></span>
                      <b>{{ school.setupProgress }}%</b>
                    </button>
                  </td>
                  <td><span class="status" :class="school.status">{{ statusLabel(school.status) }}</span></td>
                  <td>{{ school.lastActivityLabel }}</td>
                  <td>{{ formatDate(school.created_at) }}</td>
                  <td class="actions-cell" @click.stop>
                    <button type="button" class="primary-action small" @click="openSchool(school)">Dashboard</button>
                    <button type="button" class="menu-button" @click="activeMenu = activeMenu === school.school_id ? null : school.school_id">...</button>
                    <div v-if="activeMenu === school.school_id" class="action-menu">
                      <button type="button" @click="selectedSchool = school; activeMenu = null">View School</button>
                      <button v-if="school.status === 'active'" type="button" @click="suspendSchool(school)">Suspend</button>
                      <button v-if="['suspended', 'deactivated'].includes(school.status)" type="button" @click="activateSchool(school)">Reactivate</button>
                      <button type="button" @click="queueAction('Edit queued')">Edit</button>
                      <button type="button" @click="queueAction('Transfer ownership queued')">Transfer Ownership</button>
                      <button type="button" class="danger" @click="deactivateSchool(school)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination-bar">
          <div>
            <span>Rows per page</span>
            <select v-model.number="pageSize">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
          <strong>Page {{ currentPage }} of {{ totalPages }}</strong>
          <div class="pager-actions">
            <button type="button" class="ghost-button" :disabled="currentPage === 1" @click="currentPage = 1">First</button>
            <button type="button" class="ghost-button" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
            <button type="button" class="ghost-button" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
            <button type="button" class="ghost-button" :disabled="currentPage === totalPages" @click="currentPage = totalPages">Last</button>
          </div>
        </div>
      </section>

      <aside v-if="selectedSchool" class="school-drawer" aria-label="School details">
        <button type="button" class="close-button" @click="selectedSchool = null">x</button>
        <div>
          <h2>{{ selectedSchool.school_name }}</h2>
          <p>{{ selectedSchool.school_email }}</p>
        </div>
        <dl>
          <div><dt>DOS</dt><dd>{{ selectedSchool.dos_name || 'Not assigned' }}</dd></div>
          <div><dt>Teachers</dt><dd>{{ selectedSchool.teacher_count || 0 }}</dd></div>
          <div><dt>Students</dt><dd>{{ selectedSchool.student_count || 0 }}</dd></div>
          <div><dt>Subjects</dt><dd>{{ selectedSchool.subject_count || 0 }}</dd></div>
          <div><dt>Subscription</dt><dd>{{ selectedSchool.subscription_plan || 'Starter' }} / {{ selectedSchool.subscription_status || 'trial' }}</dd></div>
          <div><dt>Last Activity</dt><dd>{{ selectedSchool.lastActivityLabel }}</dd></div>
          <div><dt>Setup</dt><dd>{{ selectedSchool.setupProgress }}%</dd></div>
        </dl>
        <div class="drawer-actions">
          <button type="button" class="primary-action" @click="openSchool(selectedSchool)">Open Dashboard</button>
          <button type="button" class="ghost-button" @click="queueAction('Transfer ownership queued')">Transfer Ownership</button>
          <button type="button" class="danger-button" @click="deactivateSchool(selectedSchool)">Deactivate</button>
        </div>
      </aside>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const router = useRouter()
const route = useRoute()
const schools = ref([])
const search = ref('')
const status = ref('')
const region = ref('')
const subscription = ref('')
const dosFilter = ref('')
const loading = ref(false)
const selectedIds = ref([])
const addSchoolOpen = ref(false)
const creatingSchool = ref(false)
const addSchoolMessage = ref('')
const addSchoolMessageType = ref('success')
const currentPage = ref(1)
const pageSize = ref(Number(localStorage.getItem('superAdminSchoolsPageSize') || 10))
const sortKey = ref('created_at')
const sortDirection = ref('desc')
const activeMenu = ref(null)
const selectedSchool = ref(null)
const queuedMessage = ref('')

const emptyNewSchool = () => ({
  school_name: '',
  school_email: '',
  school_code: '',
  phone: '',
  registration_number: '',
  school_type: '',
  province: '',
  district: '',
  school_address: '',
  status: 'active',
  subscription_status: 'trial',
  subscription_plan: 'Starter'
})
const newSchool = ref(emptyNewSchool())

const enrichedSchools = computed(() => schools.value.map((school) => {
  const hasDos = Boolean(school.dos_name || school.dos_email)
  const setupItems = [
    Number(school.teacher_count || 0) > 0,
    Number(school.student_count || 0) > 0,
    Number(school.class_count || 0) > 0,
    Number(school.subject_count || 0) > 0,
    Number(school.combination_count || 0) > 0
  ]
  const setupProgress = Math.round((setupItems.filter(Boolean).length / setupItems.length) * 100)
  const lastActivity = school.last_activity_at || school.updated_at || school.created_at
  let healthLabel = 'Complete'
  let healthTone = 'good'
  if (!hasDos) {
    healthLabel = 'No DOS Assigned'
    healthTone = 'danger'
  } else if (setupProgress < 80) {
    healthLabel = 'Setup Incomplete'
    healthTone = 'warning'
  }
  return {
    ...school,
    setupProgress,
    healthLabel,
    healthTone,
    region: school.province || school.district || 'Unassigned',
    lastActivityLabel: formatRelative(lastActivity)
  }
}))

const filteredSchools = computed(() => {
  const direction = sortDirection.value === 'asc' ? 1 : -1
  return enrichedSchools.value.filter((school) => {
    const haystack = [school.school_name, school.school_email, school.dos_name, school.dos_email, school.school_code, school.registration_number].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = !search.value || haystack.includes(search.value.toLowerCase())
    const matchesStatus = !status.value || school.status === status.value
    const matchesRegion = !region.value || school.region === region.value
    const matchesSubscription = !subscription.value || school.subscription_status === subscription.value
    const matchesDos = !dosFilter.value || (dosFilter.value === 'assigned' ? Boolean(school.dos_name || school.dos_email) : !school.dos_name && !school.dos_email)
    return matchesSearch && matchesStatus && matchesRegion && matchesSubscription && matchesDos
  }).sort((a, b) => {
    const left = String(a[sortKey.value] || '').toLowerCase()
    const right = String(b[sortKey.value] || '').toLowerCase()
    if (left < right) return -1 * direction
    if (left > right) return 1 * direction
    return 0
  })
})

const pendingSchools = computed(() => schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status) || school.dos_status === 'pending'))
const missingDosSchools = computed(() => schools.value.filter((school) => !school.dos_name && !school.dos_email))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredSchools.value.length / pageSize.value)))
const paginatedSchools = computed(() => filteredSchools.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const allPageSelected = computed(() => paginatedSchools.value.length > 0 && paginatedSchools.value.every((school) => selectedIds.value.includes(school.school_id)))
const regionOptions = computed(() => [...new Set(enrichedSchools.value.map((school) => school.region).filter(Boolean))])

const metricCards = computed(() => [
  { label: 'Total Schools', value: schools.value.length, tone: 'blue', status: '' },
  { label: 'Active Schools', value: schools.value.filter((school) => school.status === 'active').length, tone: 'green', status: 'active' },
  { label: 'Pending Approval', value: pendingSchools.value.length, tone: 'amber', status: 'pending_approval' },
  { label: 'Suspended Schools', value: schools.value.filter((school) => school.status === 'suspended').length, tone: 'rose', status: 'suspended' },
  { label: 'Schools Missing DOS', value: missingDosSchools.value.length, tone: 'amber', status: '' }
])

const resetFilters = () => {
  search.value = ''
  status.value = ''
  region.value = ''
  subscription.value = ''
  dosFilter.value = ''
}

const statusLabel = (value) => {
  if (value === 'active') return 'Active'
  if (value === 'pending' || value === 'pending_approval') return 'Pending'
  if (value === 'suspended') return 'Suspended'
  if (value === 'rejected') return 'Rejected'
  if (value === 'inactive' || value === 'deactivated') return 'Inactive'
  return value || 'Unknown'
}

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

const openSchool = (school) => {
  router.push(`/super-admin/schools/${school.school_id}`)
}

const setSort = (key) => {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

const sortIcon = (key) => sortKey.value === key ? (sortDirection.value === 'asc' ? 'ASC' : 'DESC') : ''

const toggleSelectPage = () => {
  if (allPageSelected.value) {
    selectedIds.value = selectedIds.value.filter((id) => !paginatedSchools.value.some((school) => school.school_id === id))
    return
  }
  selectedIds.value = [...new Set([...selectedIds.value, ...paginatedSchools.value.map((school) => school.school_id)])]
}

const bulkAction = async (action) => {
  await Promise.all(selectedIds.value.map((id) => api.put(`/schools/${id}/${action}`)))
  selectedIds.value = []
  await loadSchools()
}

const queueAction = (message) => {
  queuedMessage.value = message
  activeMenu.value = null
}

const exportSelected = () => {
  const selected = selectedIds.value.length ? schools.value.filter((school) => selectedIds.value.includes(school.school_id)) : filteredSchools.value
  const rows = [['School', 'Email', 'DOS', 'Code', 'Status'], ...selected.map((school) => [school.school_name, school.school_email, school.dos_name || '', school.school_code || '', school.status])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'schools.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const createSchool = async () => {
  creatingSchool.value = true
  addSchoolMessage.value = ''
  try {
    await api.post('/schools', newSchool.value)
    addSchoolMessage.value = 'School workspace created. Add a DOS from the DOS section.'
    addSchoolMessageType.value = 'success'
    newSchool.value = emptyNewSchool()
    addSchoolOpen.value = false
    await loadSchools()
  } catch (error) {
    addSchoolMessage.value = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Could not create school.'
    addSchoolMessageType.value = 'error'
  } finally {
    creatingSchool.value = false
  }
}

const loadSchools = async () => {
  loading.value = true
  try {
    const response = await api.get('/schools')
    schools.value = response.data.schools || []
  } finally {
    loading.value = false
  }
}

const suspendSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/suspend`)
  await loadSchools()
}

const deactivateSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/deactivate`)
  await loadSchools()
}

const activateSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/activate`)
  await loadSchools()
}

watch(pageSize, () => {
  localStorage.setItem('superAdminSchoolsPageSize', String(pageSize.value))
})
watch([filteredSchools, pageSize], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})
watch([search, status, region, subscription, dosFilter], () => {
  currentPage.value = 1
  selectedIds.value = []
})
onMounted(() => {
  status.value = String(route.query.status || '')
  loadSchools()
})
</script>

<style scoped>
.schools-dashboard {
  display: grid;
  gap: 0.8rem;
  width: 100%;
}

.schools-header,
.add-school-panel,
.section-block,
.metric-row article {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.schools-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem;
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

.section-head,
.filters,
.bulk-toolbar,
.pager-actions,
.drawer-actions,
.form-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
}

.section-head {
  justify-content: space-between;
}

.section-block,
.add-school-panel {
  padding: 0.9rem;
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
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.primary-action {
  background: #2563eb;
}

.primary-action.small {
  padding: 0.42rem 0.6rem;
}

.ghost-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.danger-button,
.danger,
.reject {
  background: #fee2e2;
  color: #991b1b;
}

.approve {
  background: #16a34a;
}

.warn {
  background: #f97316;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  font-size: 1.5rem;
  line-height: 1;
}

.metric-row span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
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

.search-input {
  flex: 1 1 360px;
}

.add-school-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.add-school-grid label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 900;
}

.add-school-grid .span-2 {
  grid-column: span 2;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 0.9rem;
}

.form-actions span {
  margin-right: auto;
  color: #16a34a;
  font-weight: 900;
}

.form-actions span.error {
  color: #dc2626;
}

.bulk-toolbar,
.compact-announcement {
  margin-bottom: 0.75rem;
  padding: 0.65rem;
  border-radius: 12px;
  background: #eff6ff;
}

.bulk-toolbar strong {
  color: #1e3a8a;
  margin-right: auto;
}

.compact-announcement {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  color: #334155;
}

.table-card {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.table-wrap {
  overflow-x: auto;
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

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: #f8fafc;
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

td small {
  margin-top: 0.15rem;
  color: #64748b;
}

.sort-button {
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  text-transform: uppercase;
}

.status,
.health-chip {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.3rem 0.62rem;
  font-size: 0.76rem;
  font-weight: 950;
}

.status.active,
.health-chip.good {
  background: #dcfce7;
  color: #166534;
}

.status.pending,
.status.pending_approval,
.health-chip.warning {
  background: #fef3c7;
  color: #92400e;
}

.status.suspended {
  background: #ffedd5;
  color: #9a3412;
}

.status.rejected,
.status.deactivated,
.health-chip.danger {
  background: #fee2e2;
  color: #991b1b;
}

.progress-cell {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  min-width: 120px;
  padding: 0;
  background: transparent;
  color: #0f172a;
}

.progress-cell span {
  position: relative;
  flex: 1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-cell i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: #2563eb;
}

.actions-cell {
  position: relative;
  white-space: nowrap;
}

.menu-button {
  margin-left: 0.35rem;
  background: #f1f5f9;
  color: #334155;
}

.action-menu {
  position: absolute;
  right: 0.6rem;
  top: 2.5rem;
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

.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1rem;
  color: #64748b;
  font-weight: 850;
}

.school-drawer {
  position: fixed;
  inset: 62px 0 0 auto;
  z-index: 800;
  display: grid;
  align-content: start;
  gap: 1rem;
  width: min(430px, 100vw);
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

dl,
dl div {
  display: grid;
  gap: 0.4rem;
}

dl div {
  grid-template-columns: 120px 1fr;
  padding: 0.55rem 0;
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

@media (max-width: 1100px) {
  .metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .add-school-grid {
    grid-template-columns: 1fr;
  }

  .add-school-grid .span-2 {
    grid-column: auto;
  }
}

@media (max-width: 760px) {
  .schools-header,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

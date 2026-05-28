<template>
  <AppLayout>
    <div class="schools-page">
      <header class="page-header">
        <div>
          <h1>School Approvals</h1>
          <p>Review Director of Studies registrations and control school activation.</p>
        </div>
        <div class="filters">
          <input v-model.trim="search" type="search" placeholder="Search schools">
          <select v-model="status">
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="deactivated">Inactive</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="button" :disabled="loading || hasPendingAction" @click="loadSchools">
            <span v-if="loading" class="button-spinner" aria-hidden="true"></span>
            Refresh
          </button>
        </div>
      </header>

      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.label">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="table-card">
        <div v-if="loading" class="state">Loading schools...</div>
        <div v-else-if="!filteredSchools.length" class="state">No schools found.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>School</th>
                <th>DOS</th>
                <th>Registration</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="school in filteredSchools" :key="school.school_id">
                <td>
                  <strong>{{ school.school_name }}</strong>
                  <small>{{ school.school_email }}</small>
                </td>
                <td>
                  <strong>{{ school.dos_name || 'Not assigned' }}</strong>
                  <small>{{ school.dos_phone || school.dos_email || 'No contact' }}</small>
                </td>
                <td>{{ school.registration_number }}</td>
                <td><span class="status" :class="statusClass(school.status)">{{ statusLabel(school.status) }}</span></td>
                <td>{{ formatDate(school.created_at) }}</td>
                <td>
                  <div class="actions">
                    <button
                      v-if="['pending', 'pending_approval'].includes(school.status)"
                      class="approve"
                      :disabled="isActionLoading(school)"
                      @click="approveSchool(school)"
                    >
                      <span v-if="isActionLoading(school, 'approve')" class="button-spinner" aria-hidden="true"></span>
                      Approve
                    </button>
                    <button
                      v-if="['pending', 'pending_approval'].includes(school.status)"
                      class="reject"
                      :disabled="isActionLoading(school)"
                      @click="rejectSchool(school)"
                    >
                      <span v-if="isActionLoading(school, 'reject')" class="button-spinner" aria-hidden="true"></span>
                      Reject
                    </button>
                    <button
                      v-if="school.status === 'active'"
                      class="reject"
                      :disabled="isActionLoading(school)"
                      @click="deactivateSchool(school)"
                    >
                      <span v-if="isActionLoading(school, 'deactivate')" class="button-spinner" aria-hidden="true"></span>
                      Deactivate
                    </button>
                    <button
                      v-if="canActivateSchool(school)"
                      class="approve"
                      :disabled="isActionLoading(school)"
                      @click="activateSchool(school)"
                    >
                      <span v-if="isActionLoading(school, 'activate')" class="button-spinner" aria-hidden="true"></span>
                      Activate
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'
import { useNotificationStore } from '@/stores/notifications'

const schools = ref([])
const search = ref('')
const status = ref('')
const loading = ref(false)
const actionLoading = ref({})
const notifications = useNotificationStore()

const filteredSchools = computed(() => schools.value)
const hasPendingAction = computed(() => Object.keys(actionLoading.value).length > 0)

const summaryCards = computed(() => [
  { label: 'Total Registered Schools', value: schools.value.length },
  { label: 'Pending School Approvals', value: schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status)).length },
  { label: 'Active Schools', value: schools.value.filter((school) => school.status === 'active').length },
  { label: 'Inactive Schools', value: schools.value.filter((school) => ['suspended', 'deactivated', 'inactive', 'rejected'].includes(school.status)).length }
])

const statusLabel = (value) => {
  if (value === 'active') return 'Active'
  if (value === 'pending' || value === 'pending_approval') return 'Pending Approval'
  if (value === 'suspended') return 'Inactive'
  if (value === 'rejected') return 'Rejected'
  if (value === 'inactive' || value === 'deactivated') return 'Inactive'
  return value || 'Unknown'
}

const statusClass = (value) => {
  if (value === 'active') return 'active'
  if (['inactive', 'deactivated', 'suspended', 'rejected'].includes(value)) return 'inactive'
  return value || 'unknown'
}

const canActivateSchool = (school) => {
  return !['active', 'pending', 'pending_approval'].includes(school.status)
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString()
}

const loadSchools = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await api.get('/schools', {
      params: {
        search: search.value || undefined,
        status: status.value || undefined
      }
    })
    schools.value = response.data.schools || []
  } finally {
    loading.value = false
  }
}

const setActionLoading = (school, action) => {
  actionLoading.value = {
    ...actionLoading.value,
    [school.school_id]: action
  }
}

const clearActionLoading = (school) => {
  const next = { ...actionLoading.value }
  delete next[school.school_id]
  actionLoading.value = next
}

const isActionLoading = (school, action = null) => {
  const currentAction = actionLoading.value[school.school_id]
  return action ? currentAction === action : Boolean(currentAction)
}

const updateSchoolInList = (updatedSchool) => {
  if (!updatedSchool?.school_id) return
  schools.value = schools.value.map((school) =>
    Number(school.school_id) === Number(updatedSchool.school_id)
      ? { ...school, ...updatedSchool }
      : school
  )
}

const runSchoolAction = async (school, action, endpoint) => {
  if (isActionLoading(school)) return
  setActionLoading(school, action)

  try {
    const response = await api.put(endpoint, null, { showGlobalNotification: false })
    updateSchoolInList(response.data.school)
    notifications.success(response.data.message || `${school.school_name} updated successfully.`)
  } catch (error) {
    notifications.error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      `Could not update ${school.school_name}.`
    )
  } finally {
    clearActionLoading(school)
  }
}

const approveSchool = (school) => runSchoolAction(school, 'approve', `/schools/${school.school_id}/approve`)

const rejectSchool = (school) => runSchoolAction(school, 'reject', `/schools/${school.school_id}/reject`)

const deactivateSchool = (school) => runSchoolAction(school, 'deactivate', `/schools/${school.school_id}/deactivate`)

const activateSchool = (school) => runSchoolAction(school, 'activate', `/schools/${school.school_id}/activate`)

watch([search, status], () => {
  loadSchools()
})

onMounted(loadSchools)
</script>

<style scoped>
.schools-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.page-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.filters {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.button-spinner {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.summary-grid article,
.table-card {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
}

.summary-grid article {
  padding: 1rem;
}

.summary-grid span {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
}

.summary-grid strong {
  display: block;
  margin-top: 0.35rem;
  color: #0f172a;
  font-size: 1.55rem;
}

.table-card {
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.8rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
}

td strong,
td small {
  display: block;
}

td small {
  color: #64748b;
  margin-top: 0.15rem;
}

.status {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 850;
}

.status.active {
  background: #dcfce7;
  color: #166534;
}

.status.rejected,
.status.inactive,
.status.deactivated {
  background: #fee2e2;
  color: #991b1b;
}

.status.suspended {
  background: #ffedd5;
  color: #9a3412;
}

.actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.approve {
  background: #16a34a;
}

.reject {
  background: #dc2626;
}

.warn {
  background: #f97316;
}

.state {
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

:global(body.admin-dark-mode) .page-header h1,
:global(body.admin-dark-mode) .summary-grid strong {
  color: #f8fafc;
}

:global(body.admin-dark-mode) .page-header p,
:global(body.admin-dark-mode) td small,
:global(body.admin-dark-mode) .state {
  color: #cbd5e1;
}

:global(body.admin-dark-mode) input,
:global(body.admin-dark-mode) select,
:global(body.admin-dark-mode) .summary-grid article,
:global(body.admin-dark-mode) .table-card {
  border-color: #334155;
  background: #172033;
  color: #f8fafc;
}

:global(body.admin-dark-mode) th {
  background: #0f172a;
  color: #cbd5e1;
}

:global(body.admin-dark-mode) td {
  border-bottom-color: #334155;
  color: #f8fafc;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
  }

  .filters {
    width: 100%;
  }

  .filters input,
  .filters select,
  .filters button {
    flex: 1 1 180px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

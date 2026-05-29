<template>
  <AppLayout>
    <div class="schools-page">
      <header class="page-header">
        <div>
          <h1>Schools</h1>
          <p>Approve DOS registrations and monitor school setup without exposing teacher records.</p>
        </div>
        <div class="filters">
          <input v-model.trim="search" type="search" placeholder="Search schools">
          <select v-model="status">
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <button type="button" @click="loadSchools">Refresh</button>
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
                <th>Codes</th>
                <th>Setup</th>
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
                  <small>{{ school.dos_status ? statusLabel(school.dos_status) : 'No DOS status' }}</small>
                </td>
                <td>
                  <strong>{{ school.school_code || 'No code' }}</strong>
                  <small>{{ school.registration_number }}</small>
                </td>
                <td>
                  <div class="setup-grid">
                    <span>{{ school.teacher_count || 0 }} teachers</span>
                    <span>{{ school.student_count || 0 }} students</span>
                    <span>{{ school.class_count || 0 }} classes</span>
                    <span>{{ school.timetable_entry_count || 0 }} timetable rows</span>
                  </div>
                </td>
                <td><span class="status" :class="school.status">{{ statusLabel(school.status) }}</span></td>
                <td>{{ formatDate(school.created_at) }}</td>
                <td>
                  <div class="actions">
                    <button v-if="['pending', 'pending_approval'].includes(school.status)" class="approve" @click="approveSchool(school)">Approve</button>
                    <button v-if="['pending', 'pending_approval'].includes(school.status)" class="reject" @click="rejectSchool(school)">Reject</button>
                    <button v-if="school.status === 'active'" class="warn" @click="suspendSchool(school)">Suspend</button>
                    <button v-if="school.status === 'active'" class="reject" @click="deactivateSchool(school)">Deactivate</button>
                    <button v-if="['suspended', 'deactivated'].includes(school.status)" class="approve" @click="activateSchool(school)">Reactivate</button>
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

const schools = ref([])
const search = ref('')
const status = ref('')
const loading = ref(false)

const filteredSchools = computed(() => schools.value)

const summaryCards = computed(() => [
  { label: 'Schools', value: schools.value.length },
  { label: 'Pending DOS', value: schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status)).length },
  { label: 'Active Schools', value: schools.value.filter((school) => school.status === 'active').length },
  { label: 'Teachers Counted', value: schools.value.reduce((sum, school) => sum + Number(school.teacher_count || 0), 0) }
])

const statusLabel = (value) => {
  if (value === 'active') return 'Active'
  if (value === 'pending' || value === 'pending_approval') return 'Pending Approval'
  if (value === 'suspended') return 'Suspended'
  if (value === 'rejected') return 'Rejected'
  if (value === 'inactive' || value === 'deactivated') return 'Deactivated'
  return value || 'Unknown'
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString()
}

const loadSchools = async () => {
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

const approveSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/approve`)
  await loadSchools()
}

const rejectSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/reject`)
  await loadSchools()
}

const deactivateSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/deactivate`)
  await loadSchools()
}

const suspendSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/suspend`)
  await loadSchools()
}

const activateSchool = async (school) => {
  await api.put(`/schools/${school.school_id}/activate`)
  await loadSchools()
}

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
  border: 0;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
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

.setup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
  min-width: 210px;
}

.setup-grid span {
  padding: 0.28rem 0.45rem;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.74rem;
  font-weight: 800;
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

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

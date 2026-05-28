<template>
  <AppLayout>
    <div class="shifts-container">
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="h3 fw-semibold text-dark mb-1">Saved Shifts</h2>
            <p class="text-muted mb-0">Create shifts that appear in the Classes shift dropdown. Each shift can have its own teacher changeover time.</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" type="button" @click="openAddModal">Add New Shift</button>
            <button class="btn-outline-secondary" :disabled="loading" @click="loadShifts">Refresh</button>
            <span class="badge">{{ shifts.length }} shifts</span>
          </div>
        </div>

        <div v-if="formMessage" class="alert alert-danger">
          {{ formMessage }}
        </div>

        <div v-if="loading" class="text-center py-5">
          <span class="spinner"></span> Loading shifts...
        </div>

        <div v-else-if="!shifts.length" class="text-center text-muted py-5">
          No shifts created yet
        </div>

        <div v-else class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Changeover</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shift in shifts" :key="shift.shift_id">
                <td class="fw-medium">{{ shift.shift_name }}</td>
                <td>{{ formatTime(shift.start_time) }}</td>
                <td>{{ formatTime(shift.end_time) }}</td>
                <td>{{ shift.teacher_changeover_minutes }} min</td>
                <td>
                  <button class="btn-edit me-2" @click="openEditModal(shift)">Edit</button>
                  <button class="btn-delete" @click="deleteShift(shift)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Shift Modal -->
      <div class="modal fade" id="shiftModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Shift' : 'Add New Shift' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="modalMessage" class="alert alert-danger">{{ modalMessage }}</div>
              <form @submit.prevent="saveShift">
                <div class="mb-3">
                  <label class="form-label">Shift Name *</label>
                  <input v-model="shiftForm.shift_name" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Start Time *</label>
                  <input v-model="shiftForm.start_time" type="time" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">End Time *</label>
                  <input v-model="shiftForm.end_time" type="time" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Changeover Minutes</label>
                  <input v-model.number="shiftForm.teacher_changeover_minutes" type="number" min="0" class="form-control">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn-primary" @click="saveShift" :disabled="saving">
                {{ saving ? 'Saving...' : (isEditing ? 'Update Shift' : 'Add Shift') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        v-model="deleteDialog.open"
        title="Delete Shift"
        :description="`Delete shift ${deleteDialog.shift?.shift_name || 'this shift'}?`"
        confirm-label="Delete"
        cancel-label="Cancel"
        loading-label="Deleting..."
        :loading="deleteDialog.loading"
        danger
        @confirm="confirmDeleteShift"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Modal } from 'bootstrap'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const shifts = ref([])
const shiftForm = ref({
  shift_name: '',
  start_time: '',
  end_time: '',
  teacher_changeover_minutes: 5
})
const isEditing = ref(false)
const currentShift = ref(null)
const loading = ref(false)
const saving = ref(false)
const deleteDialog = ref({ open: false, shift: null, loading: false })
const formMessage = ref('')
const modalMessage = ref('')

const resetShiftForm = () => {
  shiftForm.value = {
    shift_name: '',
    start_time: '',
    end_time: '',
    teacher_changeover_minutes: 5
  }
  isEditing.value = false
  currentShift.value = null
  modalMessage.value = ''
}

const formatTime = (time) => {
  if (!time) return '-'
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const loadShifts = async () => {
  loading.value = true
  formMessage.value = ''
  try {
    const response = await api.get('/shifts')
    shifts.value = response.data.shifts || []
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to load shifts.'
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  resetShiftForm()
  const modal = Modal.getOrCreateInstance(document.getElementById('shiftModal'))
  modal.show()
}

const openEditModal = (shift) => {
  isEditing.value = true
  currentShift.value = shift
  shiftForm.value = { ...shift }
  modalMessage.value = ''
  const modal = Modal.getOrCreateInstance(document.getElementById('shiftModal'))
  modal.show()
}

const saveShift = async () => {
  saving.value = true
  modalMessage.value = ''
  try {
    const response = isEditing.value
      ? await api.put(`/shifts/${currentShift.value.shift_id}`, shiftForm.value)
      : await api.post('/shifts', shiftForm.value)

    if (isEditing.value) {
      const index = shifts.value.findIndex(s => s.shift_id === currentShift.value.shift_id)
      if (index !== -1) {
        shifts.value[index] = response.data.shift
      }
    } else {
      shifts.value.push(response.data.shift)
    }

    const modal = Modal.getOrCreateInstance(document.getElementById('shiftModal'))
    modal.hide()
    resetShiftForm()
  } catch (error) {
    modalMessage.value = error.response?.data?.message || 'Failed to save shift.'
  } finally {
    saving.value = false
  }
}

const deleteShift = async (shift) => {
  deleteDialog.value = { open: true, shift, loading: false }
}

const confirmDeleteShift = async () => {
  const shift = deleteDialog.value.shift
  if (!shift) return

  deleteDialog.value.loading = true
  try {
    await api.delete(`/shifts/${shift.shift_id}`)
    shifts.value = shifts.value.filter(s => s.shift_id !== shift.shift_id)
    deleteDialog.value = { open: false, shift: null, loading: false }
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to delete shift.'
  } finally {
    deleteDialog.value.loading = false
  }
}

onMounted(() => {
  loadShifts()
})
</script>

<style scoped>
.shifts-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-custom {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid #64748b;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-secondary {
  background: #64748b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  font-size: 0.8rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: -0.5rem;
}

.g-3 {
  gap: 1rem;
}

.col-md-4, .col-md-3, .col-md-2, .col-12 {
  padding: 0.5rem;
}

.col-md-4 { flex: 0 0 calc(33.33% - 1rem); }
.col-md-3 { flex: 0 0 calc(25% - 1rem); }
.col-md-2 { flex: 0 0 calc(16.66% - 1rem); }
.col-12 { flex: 0 0 calc(100% - 1rem); }

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-danger {
  background: #fee2e2;
  color: #dc2626;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.table-responsive {
  overflow-x: auto;
}

.table-custom {
  width: 100%;
  border-collapse: collapse;
}

.table-custom th,
.table-custom td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.table-custom th {
  background: #f8fafc;
  font-weight: 600;
}

.fw-medium {
  font-weight: 500;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #64748b;
}

.py-5 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.mb-1 { margin-bottom: 0.25rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.me-2 { margin-right: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }

@media (max-width: 768px) {
  .col-md-4, .col-md-3, .col-md-2 {
    flex: 0 0 calc(100% - 1rem);
  }
}
</style>

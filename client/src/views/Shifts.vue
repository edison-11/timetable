<template>
  <div class="min-vh-100 admin-page">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">⏰</div>
          <h1 class="h2 mb-0">Shifts</h1>
        </div>
        <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">A</div>
      </div>
    </header>

    <div class="d-flex admin-page-shell">
      <AdminSidebar />

      <main class="flex-grow-1 p-4 admin-main">
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 class="h3 fw-semibold text-dark mb-1">Add New Shift</h2>
              <p class="text-muted mb-0">Create shifts that appear in the Classes shift dropdown. Each shift can have its own teacher changeover time.</p>
            </div>
            <button class="btn btn-outline-secondary" :disabled="loading" @click="loadShifts">Refresh</button>
          </div>

          <div v-if="formMessage" class="alert alert-danger" role="alert">
            {{ formMessage }}
          </div>

          <form class="row g-3" @submit.prevent="addShift">
            <div class="col-md-4">
              <label for="shiftName" class="form-label">Shift Name *</label>
              <input id="shiftName" v-model="shiftForm.shift_name" class="form-control" required placeholder="Example: Morning Shift">
            </div>

            <div class="col-md-3">
              <label for="startTime" class="form-label">Start Time *</label>
              <input id="startTime" v-model="shiftForm.start_time" type="time" class="form-control" required>
            </div>

            <div class="col-md-3">
              <label for="endTime" class="form-label">End Time *</label>
              <input id="endTime" v-model="shiftForm.end_time" type="time" class="form-control" required>
            </div>

            <div class="col-md-3">
              <label for="changeoverMinutes" class="form-label">Changeover Minutes</label>
              <input id="changeoverMinutes" v-model.number="shiftForm.teacher_changeover_minutes" type="number" min="0" class="form-control">
            </div>

            <div class="col-md-2 d-flex align-items-end">
              <button type="submit" class="btn btn-primary-custom w-100" :disabled="saving">
                Add Shift
              </button>
            </div>
          </form>
        </div>

        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark mb-0">Saved Shifts</h2>
            <span class="badge bg-primary fs-6">{{ shifts.length }} shifts</span>
          </div>

          <div v-if="loading" class="text-center text-muted py-5">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading shifts...
          </div>

          <div v-else-if="!shifts.length" class="text-center text-muted py-5">
            No shifts created yet
          </div>

          <div v-else class="table-responsive">
            <table class="table table-custom">
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
                  <td>{{ shift.shift_name }}</td>
                  <td>{{ formatTime(shift.start_time) }}</td>
                  <td>{{ formatTime(shift.end_time) }}</td>
                  <td>{{ shift.teacher_changeover_minutes }} min</td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2" @click="openEditModal(shift)">Edit</button>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteShift(shift)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal fade" id="shiftModal" tabindex="-1" aria-labelledby="shiftModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="shiftModalLabel">{{ isEditing ? 'Edit Shift' : 'Add New Shift' }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div v-if="modalMessage" class="alert alert-danger" role="alert">{{ modalMessage }}</div>
                <form @submit.prevent="saveShift">
                  <div class="mb-3">
                    <label for="modalShiftName" class="form-label">Shift Name *</label>
                    <input id="modalShiftName" v-model="shiftForm.shift_name" class="form-control" required>
                  </div>
                  <div class="mb-3">
                    <label for="modalStartTime" class="form-label">Start Time *</label>
                    <input id="modalStartTime" v-model="shiftForm.start_time" type="time" class="form-control" required>
                  </div>
                  <div class="mb-3">
                    <label for="modalEndTime" class="form-label">End Time *</label>
                    <input id="modalEndTime" v-model="shiftForm.end_time" type="time" class="form-control" required>
                  </div>
                  <div class="mb-3">
                    <label for="modalChangeoverMinutes" class="form-label">Changeover Minutes</label>
                    <input id="modalChangeoverMinutes" v-model.number="shiftForm.teacher_changeover_minutes" type="number" min="0" class="form-control">
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="saveShift" :disabled="saving">
                  <span v-if="saving">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </span>
                  <span v-else>{{ isEditing ? 'Update Shift' : 'Add Shift' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Modal } from 'bootstrap'
import api from '@/stores/api'
import AdminSidebar from '@/components/AdminSidebar.vue'


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
const formMessage = ref('')
const modalMessage = ref('')

const normalizeTime = (time) => {
  return (time || '').toString().slice(0, 5)
}

const formatTime = (time) => {
  const normalized = normalizeTime(time)
  if (!normalized) return '-'

  const [hours, minutes] = normalized.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
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

const addShift = async () => {
  saving.value = true
  formMessage.value = ''
  try {
    const response = await api.post('/shifts', shiftForm.value)
    shifts.value.push(response.data.shift)
    shiftForm.value = {
      shift_name: '',
      start_time: '',
      end_time: '',
      teacher_changeover_minutes: 5
    }
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to add shift.'
  } finally {
    saving.value = false
  }
}

const openEditModal = (shift) => {
  isEditing.value = true
  currentShift.value = shift
  shiftForm.value = { ...shift }
  const modal = new Modal(document.getElementById('shiftModal'))
  modal.show()
}

const saveShift = async () => {
  saving.value = true
  modalMessage.value = ''
  try {
    const response = await api.put(`/shifts/${currentShift.value.shift_id}`, shiftForm.value)
    const index = shifts.value.findIndex(s => s.shift_id === currentShift.value.shift_id)
    if (index !== -1) {
      shifts.value[index] = response.data.shift
    }
    const modal = Modal.getInstance(document.getElementById('shiftModal'))
    modal.hide()
    isEditing.value = false
    currentShift.value = null
    shiftForm.value = {
      shift_name: '',
      start_time: '',
      end_time: '',
      teacher_changeover_minutes: 5
    }
  } catch (error) {
    modalMessage.value = error.response?.data?.message || 'Failed to update shift.'
  } finally {
    saving.value = false
  }
}

const deleteShift = async (shift) => {
  if (!confirm(`Delete shift "${shift.shift_name}"?`)) return
  try {
    await api.delete(`/shifts/${shift.shift_id}`)
    shifts.value = shifts.value.filter(s => s.shift_id !== shift.shift_id)
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to delete shift.'
  }
}

onMounted(() => {
  loadShifts()
})
</script>

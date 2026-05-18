<template>
  <TeacherLayout>
    <div class="requests-container">
      <!-- Header -->
      <div class="page-header">
        <h1>Change Requests</h1>
        <p>Manage your timetable change requests and approvals</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-count">{{ stats.total }}</span>
          <span class="stat-label">Total Requests</span>
        </div>
        <div class="stat-card pending">
          <span class="stat-count">{{ stats.pending }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-card approved">
          <span class="stat-count">{{ stats.approved }}</span>
          <span class="stat-label">Approved</span>
        </div>
        <div class="stat-card rejected">
          <span class="stat-count">{{ stats.rejected }}</span>
          <span class="stat-label">Rejected</span>
        </div>
      </div>

      <!-- New Request Button -->
      <button class="btn-new-request" @click="showNewForm = true">
        <i class="bi bi-plus-circle"></i> New Request
      </button>

      <!-- Filters and Search -->
      <div class="controls-bar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input v-model="searchQuery" type="text" placeholder="Search requests..." />
        </div>

        <div class="filter-buttons">
          <button
            v-for="status in ['All', 'Pending', 'Approved', 'Rejected']"
            :key="status"
            class="filter-btn"
            :class="{ active: filterStatus === status }"
            @click="filterStatus = status"
          >
            {{ status }}
          </button>
        </div>
      </div>

      <!-- Requests List -->
      <div class="requests-list">
        <div v-if="filteredRequests.length === 0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No requests found</p>
          <small>Your change requests will appear here</small>
        </div>

        <div v-for="request in filteredRequests" :key="request.id" class="request-card" :class="`status-${request.status}`">
          <div class="request-header">
            <div class="request-title">
              <h3>{{ request.type }}</h3>
              <p class="request-subtitle">{{ request.currentLesson }}</p>
            </div>
            <span class="request-status" :class="request.status">
              {{ request.status }}
            </span>
          </div>

          <div class="request-details">
            <div class="detail-row">
              <span class="detail-label">Requested Change:</span>
              <span class="detail-value">{{ request.requestedChange }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">{{ request.reason }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span class="detail-value">{{ formatDate(request.date) }}</span>
            </div>
            <div v-if="request.responseDate" class="detail-row">
              <span class="detail-label">Response:</span>
              <span class="detail-value">{{ formatDate(request.responseDate) }}</span>
            </div>
            <div v-if="request.notes" class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value notes">{{ request.notes }}</span>
            </div>
          </div>

          <div class="request-actions">
            <button v-if="request.status === 'pending'" class="btn-action edit" @click="editRequest(request)">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button v-if="request.status === 'pending'" class="btn-action cancel" @click="cancelRequest(request.id)">
              <i class="bi bi-trash"></i> Cancel
            </button>
            <button class="btn-action view" @click="viewRequest(request)">
              <i class="bi bi-eye"></i> View Details
            </button>
          </div>
        </div>
      </div>

      <!-- New/Edit Request Modal -->
      <div v-if="showNewForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editingRequest ? 'Edit Request' : 'New Change Request' }}</h2>
            <button class="modal-close" @click="closeForm">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form @submit.prevent="submitRequest" class="request-form">
            <div class="form-group">
              <label>Request Type <span class="required">*</span></label>
              <select v-model="formData.type" required>
                <option value="">Select type</option>
                <option value="Lesson Swap">Lesson Swap</option>
                <option value="Room Change">Room Change</option>
                <option value="Time Adjustment">Time Adjustment</option>
                <option value="Schedule Change">Schedule Change</option>
              </select>
            </div>

            <div class="form-group">
              <label>Current Lesson <span class="required">*</span></label>
              <input v-model="formData.currentLesson" type="text" placeholder="e.g., Mathematics - Class 10-A" required />
            </div>

            <div class="form-group">
              <label>Requested Change <span class="required">*</span></label>
              <textarea v-model="formData.requestedChange" placeholder="Describe the change you want to make" rows="3" required></textarea>
            </div>

            <div class="form-group">
              <label>Reason <span class="required">*</span></label>
              <textarea v-model="formData.reason" placeholder="Why do you need this change?" rows="3" required></textarea>
            </div>

            <div class="form-group">
              <label>Preferred Date (if applicable)</label>
              <input v-model="formData.preferredDate" type="date" />
            </div>

            <div v-if="formMessage" class="alert" :class="alertClass">
              {{ formMessage }}
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="showDetailView" class="modal-overlay" @click.self="showDetailView = false">
        <div class="modal-content large">
          <div class="modal-header">
            <h2>Request Details</h2>
            <button class="modal-close" @click="showDetailView = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div v-if="selectedRequest" class="detail-content">
            <div class="detail-section">
              <h3>Basic Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">Type:</span>
                  <span class="value">{{ selectedRequest.type }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Status:</span>
                  <span class="value">
                    <span class="status-badge" :class="selectedRequest.status">{{ selectedRequest.status }}</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">Current Lesson:</span>
                  <span class="value">{{ selectedRequest.currentLesson }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Submitted Date:</span>
                  <span class="value">{{ formatDate(selectedRequest.date) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Request Details</h3>
              <div class="detail-box">
                <p><strong>Requested Change:</strong></p>
                <p>{{ selectedRequest.requestedChange }}</p>
              </div>
              <div class="detail-box">
                <p><strong>Reason:</strong></p>
                <p>{{ selectedRequest.reason }}</p>
              </div>
            </div>

            <div v-if="selectedRequest.status !== 'pending'" class="detail-section">
              <h3>Response</h3>
              <div class="detail-box">
                <p><strong>Response Date:</strong> {{ formatDate(selectedRequest.responseDate) }}</p>
                <p><strong>Notes from Admin:</strong></p>
                <p>{{ selectedRequest.notes || 'No additional notes' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const showNewForm = ref(false)
const showDetailView = ref(false)
const editingRequest = ref(null)
const selectedRequest = ref(null)
const searchQuery = ref('')
const filterStatus = ref('All')
const isSubmitting = ref(false)
const formMessage = ref('')
const alertClass = ref('alert-success')

const formData = ref({
  type: '',
  currentLesson: '',
  requestedChange: '',
  reason: '',
  preferredDate: ''
})

const requests = ref([
  {
    id: 1,
    type: 'Lesson Swap',
    currentLesson: 'Mathematics - Class 10-A',
    requestedChange: 'Swap with Physics class on Tuesday',
    reason: 'Attending a professional development workshop',
    date: new Date('2024-05-10'),
    responseDate: new Date('2024-05-12'),
    status: 'approved',
    notes: 'Approved. Swap confirmed with Physics teacher.'
  },
  {
    id: 2,
    type: 'Room Change',
    currentLesson: 'Chemistry Lab - Class 11-B',
    requestedChange: 'Change from Room 301 to Room 302',
    reason: 'Lab Room 301 has equipment issues',
    date: new Date('2024-05-15'),
    responseDate: null,
    status: 'pending',
    notes: ''
  },
  {
    id: 3,
    type: 'Time Adjustment',
    currentLesson: 'English - Class 12-C',
    requestedChange: 'Move from 2:00 PM to 3:00 PM',
    reason: 'Student conflict with another class',
    date: new Date('2024-05-08'),
    responseDate: new Date('2024-05-09'),
    status: 'rejected',
    notes: 'Cannot accommodate time change due to other commitments.'
  },
  {
    id: 4,
    type: 'Schedule Change',
    currentLesson: 'Biology - Class 10-C',
    requestedChange: 'Combine two short sessions into one longer session',
    reason: 'More effective lab work scheduling',
    date: new Date('2024-05-14'),
    responseDate: null,
    status: 'pending',
    notes: ''
  }
])

const stats = computed(() => ({
  total: requests.value.length,
  pending: requests.value.filter(r => r.status === 'pending').length,
  approved: requests.value.filter(r => r.status === 'approved').length,
  rejected: requests.value.filter(r => r.status === 'rejected').length
}))

const filteredRequests = computed(() => {
  let filtered = requests.value

  if (filterStatus.value !== 'All') {
    filtered = filtered.filter(r => r.status === filterStatus.value.toLowerCase())
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      r =>
        r.type.toLowerCase().includes(query) ||
        r.currentLesson.toLowerCase().includes(query) ||
        r.requestedChange.toLowerCase().includes(query)
    )
  }

  return filtered
})

const formatDate = (date) => {
  if (!date) return '-'
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(date).toLocaleDateString('en-US', options)
}

const submitRequest = () => {
  if (!formData.value.type || !formData.value.currentLesson) {
    formMessage.value = 'Please fill in all required fields'
    alertClass.value = 'alert-danger'
    return
  }

  isSubmitting.value = true

  setTimeout(() => {
    if (editingRequest.value) {
      const index = requests.value.findIndex(r => r.id === editingRequest.value.id)
      if (index !== -1) {
        requests.value[index] = {
          ...editingRequest.value,
          ...formData.value,
          date: editingRequest.value.date,
          status: 'pending'
        }
      }
    } else {
      requests.value.unshift({
        id: Math.max(...requests.value.map(r => r.id), 0) + 1,
        ...formData.value,
        date: new Date(),
        responseDate: null,
        status: 'pending',
        notes: ''
      })
    }

    formMessage.value = editingRequest.value ? 'Request updated successfully!' : 'Request submitted successfully!'
    alertClass.value = 'alert-success'
    isSubmitting.value = false

    setTimeout(() => {
      closeForm()
    }, 1500)
  }, 1000)
}

const closeForm = () => {
  showNewForm.value = false
  editingRequest.value = null
  formData.value = { type: '', currentLesson: '', requestedChange: '', reason: '', preferredDate: '' }
  formMessage.value = ''
}

const editRequest = (request) => {
  editingRequest.value = request
  Object.assign(formData.value, request)
  showNewForm.value = true
}

const cancelRequest = (id) => {
  if (confirm('Are you sure you want to cancel this request?')) {
    const index = requests.value.findIndex(r => r.id === id)
    if (index !== -1) {
      requests.value.splice(index, 1)
    }
  }
}

const viewRequest = (request) => {
  selectedRequest.value = request
  showDetailView.value = true
}
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --text-light: #6b7280;
  --border: #e5e7eb;
}

.requests-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: var(--text);
}

.page-header p {
  margin: 0;
  color: var(--text-light);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border-left: 4px solid var(--primary);
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-card.pending {
  border-left-color: var(--warning);
}

.stat-card.approved {
  border-left-color: var(--success);
}

.stat-card.rejected {
  border-left-color: var(--danger);
}

.stat-count {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  color: var(--text-light);
  font-size: 0.9rem;
}

/* Button */
.btn-new-request {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
}

.btn-new-request:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* Controls */
.controls-bar {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

.search-box i {
  color: var(--text-light);
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  color: var(--text);
  font-size: 1rem;
}

.search-box input::placeholder {
  color: var(--text-light);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Requests List */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
  color: var(--text-light);
}

.empty-state i {
  font-size: 3rem;
  color: var(--border);
  display: block;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0.5rem 0 0;
}

/* Request Card */
.request-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  border-left: 4px solid var(--primary);
}

.request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.request-card.status-approved {
  border-left-color: var(--success);
}

.request-card.status-rejected {
  border-left-color: var(--danger);
}

.request-card.status-pending {
  border-left-color: var(--warning);
}

.request-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.request-title h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
}

.request-subtitle {
  margin: 0.5rem 0 0;
  color: var(--text-light);
  font-size: 0.9rem;
}

.request-status {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.request-status.pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.request-status.approved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.request-status.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

/* Request Details */
.request-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
}

.detail-label {
  font-weight: 600;
  color: var(--text);
}

.detail-value {
  color: var(--text-light);
  word-break: break-word;
}

.detail-value.notes {
  font-style: italic;
}

/* Request Actions */
.request-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-action:hover {
  background: var(--bg);
}

.btn-action.edit {
  color: var(--primary);
  border-color: var(--primary);
}

.btn-action.edit:hover {
  background: var(--primary-light);
}

.btn-action.cancel {
  color: var(--danger);
  border-color: var(--danger);
}

.btn-action.cancel:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-action.view {
  color: var(--primary);
  border-color: var(--primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: var(--surface);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.modal-content.large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  color: var(--text);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg);
  color: var(--text);
}

/* Form */
.request-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text);
}

.required {
  color: var(--danger);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-group textarea {
  resize: vertical;
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border-left-color: var(--success);
  color: #047857;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: var(--danger);
  color: #991b1b;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Detail Content */
.detail-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section h3 {
  margin: 0 0 1rem;
  color: var(--text);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item .label {
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
}

.detail-item .value {
  color: var(--text-light);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
  text-transform: capitalize;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.status-badge.approved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.detail-box {
  background: var(--bg);
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary);
}

.detail-box p {
  margin: 0;
  color: var(--text);
  line-height: 1.6;
}

.detail-box p:first-child {
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .controls-bar {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .request-header {
    flex-direction: column;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }

  .detail-label {
    font-weight: 600;
  }

  .modal-content {
    max-width: 100%;
  }

  .request-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .request-card {
    padding: 1rem;
  }

  .request-details {
    gap: 0.75rem;
  }

  .detail-row {
    gap: 0.5rem;
  }

  .form-group {
    gap: 0.25rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

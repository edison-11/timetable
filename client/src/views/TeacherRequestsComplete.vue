<template>
  <TeacherLayout>
    <div class="requests-container">
      <!-- Header Section -->
      <section class="requests-header">
        <div class="header-content">
          <h1><i class="bi bi-chat-dots"></i> Change Requests</h1>
          <p>Request lesson swaps, room changes, or schedule adjustments</p>
        </div>
        <button class="btn-new-request" @click="showNewRequestModal = true">
          <i class="bi bi-plus"></i> New Request
        </button>
      </section>

      <!-- Status Tabs -->
      <section class="status-tabs">
        <button
          v-for="status in ['All', 'Pending', 'Approved', 'Rejected']"
          :key="status"
          class="tab-btn"
          :class="{ active: activeTab === status }"
          @click="activeTab = status"
        >
          <span class="tab-label">{{ status }}</span>
          <span class="tab-count">{{ getStatusCount(status) }}</span>
        </button>
      </section>

      <!-- Requests List -->
      <section v-if="filteredRequests.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <h3>No {{ activeTab.toLowerCase() }} requests</h3>
        <p>
          <template v-if="activeTab === 'All'">
            You haven't created any requests yet. Click "New Request" to get started.
          </template>
          <template v-else>
            You don't have any {{ activeTab.toLowerCase() }} requests.
          </template>
        </p>
        <button v-if="activeTab === 'All'" class="btn-link" @click="showNewRequestModal = true">
          Create your first request
        </button>
      </section>

      <div v-else class="requests-grid">
        <div v-for="request in filteredRequests" :key="request.id" class="request-card" :class="request.status">
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-left">
              <h3 class="request-type">{{ request.type }}</h3>
              <span class="request-date">{{ formatDate(request.created_at) }}</span>
            </div>
            <div class="status-badge" :class="request.status">
              {{ request.status }}
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <div class="request-detail">
              <label>Lesson</label>
              <p>
                <strong>{{ request.lesson.subject }}</strong>
                <small>{{ request.lesson.class }} • {{ request.lesson.time }}</small>
              </p>
            </div>

            <div v-if="request.type !== 'Schedule Adjustment'" class="request-detail">
              <label>Requested Change</label>
              <p>
                <template v-if="request.type === 'Class Swap'">
                  Swap with: <strong>{{ request.swap_with }}</strong>
                </template>
                <template v-else-if="request.type === 'Room Change'">
                  New Room: <strong>{{ request.new_room }}</strong>
                </template>
                <template v-else>
                  {{ request.details }}
                </template>
              </p>
            </div>

            <div class="request-detail">
              <label>Reason</label>
              <p>{{ request.reason }}</p>
            </div>

            <div v-if="request.status === 'approved' || request.status === 'rejected'" class="request-detail">
              <label>Response</label>
              <p class="response-text">{{ request.admin_response || 'No response provided' }}</p>
            </div>

            <div v-if="request.status === 'approved'" class="request-detail success-info">
              <i class="bi bi-check-circle"></i>
              <p>Approved on {{ formatDate(request.updated_at) }}</p>
            </div>

            <div v-if="request.status === 'rejected'" class="request-detail error-info">
              <i class="bi bi-x-circle"></i>
              <p>Rejected on {{ formatDate(request.updated_at) }}</p>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <button v-if="request.status === 'pending'" class="btn-sm-danger" @click="cancelRequest(request.id)">
              <i class="bi bi-trash"></i> Cancel
            </button>
            <button class="btn-sm-secondary" @click="viewRequestDetails(request)">
              <i class="bi bi-eye"></i> View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Request Modal -->
    <div v-if="showNewRequestModal" class="modal-overlay" @click.self="showNewRequestModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showNewRequestModal = false">
          <i class="bi bi-x-lg"></i>
        </button>

        <h2>Create New Request</h2>

        <form @submit.prevent="submitRequest" class="request-form">
          <!-- Request Type Selection -->
          <div class="form-group">
            <label>Request Type *</label>
            <select v-model="newRequest.type" class="form-input" required>
              <option value="">Select a type</option>
              <option value="Class Swap">Class Swap</option>
              <option value="Room Change">Room Change</option>
              <option value="Time Change">Time Change</option>
              <option value="Schedule Adjustment">Schedule Adjustment</option>
            </select>
          </div>

          <!-- Lesson Selection -->
          <div class="form-group">
            <label>Lesson *</label>
            <select v-model="newRequest.lesson_id" class="form-input" required>
              <option value="">Select a lesson</option>
              <option v-for="lesson in availableLessons" :key="lesson.id" :value="lesson.id">
                {{ lesson.subject }} - {{ lesson.class }} ({{ lesson.time }})
              </option>
            </select>
          </div>

          <!-- Request-Specific Fields -->
          <template v-if="newRequest.type === 'Class Swap'">
            <div class="form-group">
              <label>Swap With (Lesson) *</label>
              <select v-model="newRequest.swap_with" class="form-input" required>
                <option value="">Select a lesson</option>
                <option v-for="lesson in availableLessons" :key="lesson.id" :value="lesson.id">
                  {{ lesson.subject }} - {{ lesson.class }} ({{ lesson.time }})
                </option>
              </select>
            </div>
          </template>

          <template v-else-if="newRequest.type === 'Room Change'">
            <div class="form-group">
              <label>Requested Room *</label>
              <select v-model="newRequest.new_room" class="form-input" required>
                <option value="">Select a room</option>
                <option v-for="room in availableRooms" :key="room" :value="room">
                  Room {{ room }}
                </option>
              </select>
            </div>
          </template>

          <template v-else-if="newRequest.type === 'Time Change'">
            <div class="form-group">
              <label>Requested Time *</label>
              <select v-model="newRequest.new_time" class="form-input" required>
                <option value="">Select a time</option>
                <option v-for="time in availableTimes" :key="time" :value="time">
                  {{ time }}
                </option>
              </select>
            </div>
          </template>

          <!-- Reason -->
          <div class="form-group">
            <label>Reason for Request *</label>
            <textarea
              v-model="newRequest.reason"
              class="form-input form-textarea"
              placeholder="Explain why you need this change..."
              rows="4"
              required
            ></textarea>
          </div>

          <!-- Additional Notes -->
          <div class="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea
              v-model="newRequest.notes"
              class="form-input form-textarea"
              placeholder="Any additional information..."
              rows="3"
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="submit" class="btn-primary">
              <i class="bi bi-paper-plane"></i> Submit Request
            </button>
            <button type="button" class="btn-secondary" @click="showNewRequestModal = false">
              <i class="bi bi-x"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Request Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showDetailsModal = false">
          <i class="bi bi-x-lg"></i>
        </button>

        <div v-if="selectedRequest" class="request-details-view">
          <div class="details-header">
            <h2>{{ selectedRequest.type }}</h2>
            <div class="status-badge" :class="selectedRequest.status">
              {{ selectedRequest.status }}
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-section">
              <h4>Current Lesson</h4>
              <p>
                <strong>{{ selectedRequest.lesson.subject }}</strong>
              </p>
              <small>
                {{ selectedRequest.lesson.class }} • {{ selectedRequest.lesson.room }} • {{ selectedRequest.lesson.time }}
              </small>
            </div>

            <div v-if="selectedRequest.type !== 'Schedule Adjustment'" class="detail-section">
              <h4>Requested Change</h4>
              <p>
                <template v-if="selectedRequest.type === 'Class Swap'">
                  Swap with: <strong>{{ selectedRequest.swap_with }}</strong>
                </template>
                <template v-else-if="selectedRequest.type === 'Room Change'">
                  New Room: <strong>{{ selectedRequest.new_room }}</strong>
                </template>
                <template v-else-if="selectedRequest.type === 'Time Change'">
                  New Time: <strong>{{ selectedRequest.new_time }}</strong>
                </template>
              </p>
            </div>

            <div class="detail-section full-width">
              <h4>Reason</h4>
              <p>{{ selectedRequest.reason }}</p>
            </div>

            <div v-if="selectedRequest.notes" class="detail-section full-width">
              <h4>Notes</h4>
              <p>{{ selectedRequest.notes }}</p>
            </div>

            <div class="detail-section full-width">
              <h4>Dates</h4>
              <p>
                <strong>Submitted:</strong> {{ formatDateTime(selectedRequest.created_at) }}
              </p>
              <p v-if="selectedRequest.updated_at">
                <strong>Updated:</strong> {{ formatDateTime(selectedRequest.updated_at) }}
              </p>
            </div>

            <div v-if="selectedRequest.admin_response" class="detail-section full-width admin-response">
              <h4>Admin Response</h4>
              <p>{{ selectedRequest.admin_response }}</p>
            </div>

            <div v-if="selectedRequest.status === 'rejected'" class="detail-section full-width rejection-help">
              <h4>What to do next</h4>
              <p>Review the admin feedback, adjust the request, and resubmit with any missing details addressed.</p>
            </div>
          </div>

          <div class="details-actions">
            <button v-if="selectedRequest.status === 'pending'" class="btn-danger" @click="cancelRequest(selectedRequest.id)">
              <i class="bi bi-trash"></i> Cancel Request
            </button>
            <button v-if="selectedRequest.status === 'rejected'" class="btn-primary" @click="resubmitRequest(selectedRequest)">
              <i class="bi bi-arrow-repeat"></i> Resubmit
            </button>
            <button class="btn-secondary" @click="showDetailsModal = false">
              <i class="bi bi-x"></i> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import api from '@/stores/api'

const activeTab = ref('All')
const showNewRequestModal = ref(false)
const showDetailsModal = ref(false)
const selectedRequest = ref(null)
const requests = ref([])
const availableLessons = ref([])
const availableRooms = ref(['101', '102', '103', '104', '105', '201', '202', '203', '204', '205'])
const availableTimes = ref(['08:00', '09:00', '10:30', '11:30', '13:00', '14:00', '15:00'])

const newRequest = ref({
  type: '',
  lesson_id: '',
  swap_with: '',
  new_room: '',
  new_time: '',
  reason: '',
  notes: ''
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'All') return requests.value
  return requests.value.filter(r => r.status === activeTab.value.toLowerCase())
})

const getStatusCount = (status) => {
  if (status === 'All') return requests.value.length
  return requests.value.filter(r => r.status === status.toLowerCase()).length
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
         ' at ' +
         d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const submitRequest = () => {
  if (
    !newRequest.value.type ||
    !newRequest.value.lesson_id ||
    !newRequest.value.reason
  ) {
    alert('Please fill in all required fields')
    return
  }

  const request = {
    id: Date.now(),
    type: newRequest.value.type,
    lesson: availableLessons.value.find(l => l.id === newRequest.value.lesson_id),
    swap_with: newRequest.value.swap_with,
    new_room: newRequest.value.new_room,
    new_time: newRequest.value.new_time,
    reason: newRequest.value.reason,
    notes: newRequest.value.notes,
    status: 'pending',
    created_at: new Date(),
    admin_response: null
  }

  requests.value.unshift(request)

  // Reset form
  newRequest.value = {
    type: '',
    lesson_id: '',
    swap_with: '',
    new_room: '',
    new_time: '',
    reason: '',
    notes: ''
  }

  showNewRequestModal.value = false
  alert('Request submitted successfully!')
}

const cancelRequest = (id) => {
  if (confirm('Are you sure you want to cancel this request?')) {
    const index = requests.value.findIndex(r => r.id === id)
    if (index > -1) {
      requests.value.splice(index, 1)
      if (showDetailsModal.value && selectedRequest.value?.id === id) {
        showDetailsModal.value = false
      }
      alert('Request cancelled successfully')
    }
  }
}

const viewRequestDetails = (request) => {
  selectedRequest.value = request
  showDetailsModal.value = true
}

const resubmitRequest = (request) => {
  if (!request) return

  newRequest.value = {
    type: request.type || '',
    lesson_id: request.lesson?.id || '',
    swap_with: request.swap_with || '',
    new_room: request.new_room || '',
    new_time: request.new_time || '',
    reason: `${request.reason || ''}\n\nResubmitted after review:`,
    notes: request.notes || ''
  }

  showDetailsModal.value = false
  showNewRequestModal.value = true
}

const loadMockData = () => {
  availableLessons.value = [
    { id: 1, subject: 'Mathematics', class: '10-A', time: '08:00 - 09:00', room: '101' },
    { id: 2, subject: 'English', class: '10-B', time: '09:00 - 10:00', room: '105' },
    { id: 3, subject: 'Physics', class: '11-A', time: '10:30 - 11:30', room: '201' },
    { id: 4, subject: 'Chemistry', class: '11-B', time: '11:30 - 12:30', room: '202' },
    { id: 5, subject: 'Biology', class: '12-A', time: '13:00 - 14:00', room: '301' }
  ]

  requests.value = [
    {
      id: 1,
      type: 'Class Swap',
      lesson: {
        subject: 'Mathematics',
        class: '10-A',
        time: '08:00 - 09:00',
        room: '101'
      },
      swap_with: 'Physics - 11-A',
      reason: 'Need to attend a professional development workshop',
      notes: 'Can arrange with Mr. Smith',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000),
      updated_at: null,
      admin_response: null
    },
    {
      id: 2,
      type: 'Room Change',
      lesson: {
        subject: 'English',
        class: '10-B',
        time: '09:00 - 10:00',
        room: '105'
      },
      new_room: '103',
      reason: 'Projector not working in current room',
      notes: 'Need a room with working AV equipment',
      status: 'approved',
      created_at: new Date(Date.now() - 172800000),
      updated_at: new Date(Date.now() - 86400000),
      admin_response: 'Approved. Room 103 has been allocated.'
    },
    {
      id: 3,
      type: 'Time Change',
      lesson: {
        subject: 'Chemistry',
        class: '11-B',
        time: '11:30 - 12:30',
        room: '202'
      },
      new_time: '13:00',
      reason: 'Clash with staff meeting',
      notes: 'Prefer afternoon slot if possible',
      status: 'rejected',
      created_at: new Date(Date.now() - 259200000),
      updated_at: new Date(Date.now() - 172800000),
      admin_response: 'Cannot accommodate. Please work with admin office.'
    }
  ]
}

onMounted(() => {
  loadMockData()
})
</script>

<style scoped>
.requests-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f0f4f8 0%, #f9fafb 100%);
  min-height: 100vh;
}

.requests-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.875rem;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.header-content h1 i {
  color: #2563eb;
}

.header-content p {
  color: #9ca3af;
  margin: 0;
}

.btn-new-request {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-new-request:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.status-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.tab-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  padding: 0 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3.5rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 1rem 0 0.5rem 0;
}

.empty-state p {
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.btn-link {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #2563eb;
  border: 2px solid #2563eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-link:hover {
  background: #f0f9ff;
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.request-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.request-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.request-card.pending {
  border-left: 4px solid #f59e0b;
}

.request-card.approved {
  border-left: 4px solid #10b981;
}

.request-card.rejected {
  border-left: 4px solid #ef4444;
}

.card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.request-type {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.request-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-detail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request-detail label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
}

.request-detail p {
  margin: 0;
  font-size: 0.95rem;
  color: #111827;
  line-height: 1.4;
}

.request-detail small {
  color: #6b7280;
  display: block;
}

.response-text {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #2563eb;
  font-style: italic;
}

.success-info,
.error-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
}

.success-info {
  background: #dcfce7;
  color: #15803d;
}

.error-info {
  background: #fee2e2;
  color: #991b1b;
}

.success-info i,
.error-info i {
  font-size: 1.25rem;
}

.success-info p,
.error-info p {
  margin: 0;
  font-weight: 600;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}

.btn-sm-danger,
.btn-sm-secondary {
  flex: 1;
  padding: 0.625rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-sm-danger {
  color: #ef4444;
}

.btn-sm-danger:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.btn-sm-secondary {
  color: #2563eb;
}

.btn-sm-secondary:hover {
  background: #dbeafe;
  border-color: #2563eb;
}

/* Modal Styles */
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
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #111827;
  transform: rotate(90deg);
}

.modal-content h2 {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #111827;
}

.request-form {
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
  color: #111827;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #111827;
  background: white;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1e40af;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.details-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.details-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-section {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h4 {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0 0 0.75rem 0;
}

.detail-section p {
  margin: 0.5rem 0;
  color: #111827;
  line-height: 1.6;
}

.detail-section small {
  color: #6b7280;
  display: block;
}

.admin-response {
  background: #f0f9ff;
  border-left: 3px solid #2563eb;
}

.details-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .requests-container {
    padding: 1rem;
  }

  .requests-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .btn-new-request {
    width: 100%;
    justify-content: center;
  }

  .requests-grid {
    grid-template-columns: 1fr;
  }

  .status-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .modal-content {
    padding: 1.5rem;
    margin: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

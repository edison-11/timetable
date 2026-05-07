<template>
  <div class="min-vh-100 bg-light">
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <span class="me-2">👨‍🏫</span>
          Teacher Portal
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 mb-0">My Timetable</h2>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-secondary btn-sm" 
                @click="refreshTimetable"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>

          <!-- Teacher Info Card -->
          <div class="card mb-4">
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <strong>Name:</strong> {{ teacher?.name }}
                </div>
                <div class="col-md-3">
                  <strong>Email:</strong> {{ teacher?.email }}
                </div>
                <div class="col-md-3">
                  <strong>Department:</strong> {{ teacher?.department }}
                </div>
                <div class="col-md-3">
                  <strong>Status:</strong> 
                  <span class="badge" :class="teacher?.status === 'active' ? 'bg-success' : 'bg-danger'">
                    {{ teacher?.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading your timetable...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ error }}
          </div>

          <!-- No Timetable Data -->
          <div v-else-if="!timetableEntries.length" class="text-center py-5">
            <i class="bi bi-calendar-x display-1 text-muted"></i>
            <h4 class="mt-3 text-muted">No Timetable Found</h4>
            <p class="text-muted">You don't have any scheduled classes at the moment.</p>
          </div>

          <!-- Timetable Table -->
          <div v-else class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Class</th>
                      <th>Module</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in sortedTimetableEntries" :key="entry.timetable_id">
                      <td>
                        <span class="badge bg-info">{{ entry.day_of_week }}</span>
                      </td>
                      <td>
                        <strong>{{ formatTime(entry.start_time) }}</strong> - 
                        {{ formatTime(entry.end_time) }}
                      </td>
                      <td>{{ entry.class_name }}</td>
                      <td>{{ entry.module_name }}</td>
                      <td>
                        <span v-if="entry.room_name" class="badge bg-secondary">
                          {{ entry.room_name }}
                        </span>
                        <span v-else class="text-muted">No room assigned</span>
                      </td>
                      <td>
                        <span class="badge bg-success">Scheduled</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const storedTeacher = ref(null)
const teacher = computed(() => {
  return authStore.currentUserType === 'teacher' && authStore.currentUser
    ? authStore.currentUser
    : storedTeacher.value
})
const timetableEntries = ref([])
const loading = ref(false)
const error = ref('')

// Sort timetable entries by day and time
const sortedTimetableEntries = computed(() => {
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  return [...timetableEntries.value].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
    if (dayDiff !== 0) return dayDiff
    
    // If same day, sort by time
    return a.start_time.localeCompare(b.start_time)
  })
})

const formatTime = (time) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const loadTeacherData = () => {
  const teacherData = localStorage.getItem('teacher')
  if (teacherData) {
    storedTeacher.value = JSON.parse(teacherData)
  }
}

const loadTimetable = async () => {
  const teacherId = teacher.value?.teacher_id || teacher.value?.id

  if (!teacherId) {
    error.value = 'Teacher information not found'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await api.get(`/timetable/teacher/${teacherId}`)
    timetableEntries.value = response.data.timetables || []
  } catch (err) {
    console.error('Error loading timetable:', err)
    error.value = err.response?.data?.message || 'Failed to load timetable'
  } finally {
    loading.value = false
  }
}

const refreshTimetable = () => {
  loadTimetable()
}

onMounted(() => {
  loadTeacherData()
  loadTimetable()
})
</script>

<style scoped>
.navbar-brand {
  font-size: 1.5rem;
  font-weight: 600;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
}

.badge {
  font-size: 0.75em;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.display-1 {
  font-size: 4rem;
}
</style>

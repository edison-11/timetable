<template>
  <div class="min-vh-100">
    <!-- Header -->
    <header class="header-custom">
      <!-- Notifications -->
      <div v-if="showNotifications" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;">
        <div class="card-custom" style="max-width: 400px;">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">🔔 New Teacher Registration</h6>
              <button @click="showNotifications = false" class="btn-close">&times;</button>
            </div>
            <div v-for="notification in notifications.slice(0, 3)" :key="notification.id" class="alert alert-success mb-2">
              <strong>{{ notification.title }}</strong>
              <p class="mb-0">{{ notification.message }}</p>
              <small class="text-muted">{{ formatTime(notification.timestamp) }}</small>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Timetable Management System</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="text-light opacity-75">Welcome, Admin</span>
          <div class="dropdown">
            <button 
              class="btn btn-link text-light text-decoration-none d-flex align-items-center gap-2 p-1" 
              type="button" 
              id="adminDropdown" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
                A
              </div>
              <i class="bi bi-chevron-down"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminDropdown">
              <li><h6 class="dropdown-header">Admin Account</h6></li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item" href="#" @click="handleLogout">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link 
            v-for="item in navigation?.filter(Boolean)" 
            :key="item?.name"
            :to="item?.path"
            class="nav-item-custom d-block mb-2"
            :class="{ 'active': route.path === item?.path }"
          >
            <span class="fs-5">{{ item?.icon }}</span>
            <span>{{ item?.name }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow-1 p-4">
        <!-- Stats Cards -->
        <div class="row g-4 mb-4">
          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.teachers }}</div>
                <div class="small opacity-75">Total Teachers</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">👥</div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom primary animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.activeTeachers }}</div>
                <div class="small opacity-75">Active Teachers</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">✅</div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom info animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.pendingTeachers }}</div>
                <div class="small opacity-75">Pending Teachers</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">⏳</div>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom success animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.modules }}</div>
                <div class="small opacity-75">Active Modules</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">📚</div>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom warning animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.classes }}</div>
                <div class="small opacity-75">Classes</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">🏫</div>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-md-6 col-lg-3">
            <div class="stat-card-custom danger animate-pulse-slow">
              <div class="position-relative z-1">
                <div class="fs-2 fw-bold mb-1">{{ stats.sessions }}</div>
                <div class="small opacity-75">Weekly Sessions</div>
                <div class="position-absolute top-0 end-0 fs-1 opacity-25">📅</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row g-3 mb-4">
          <div 
            v-for="action in quickActions" 
            :key="action.title"
            class="col-12 col-md-6 col-lg-3"
          >
            <div 
              class="quick-action-card"
              @click="handleAction(action)"
            >
              <div class="text-center">
                <div class="quick-action-icon">
                  {{ action.icon }}
                </div>
                <h3 class="fw-semibold mb-1">{{ action.title }}</h3>
                <p class="small text-muted">{{ action.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Teacher Approvals -->
        <div v-if="pendingTeachers.length > 0" class="card-custom mb-4 border-warning">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">
              <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
              Pending Teacher Approvals ({{ pendingTeachers.length }})
            </h2>
            <button class="btn btn-outline-warning btn-sm" @click="togglePendingTeachers">
              {{ showPendingTeachers ? 'Hide' : 'Show' }} Details
            </button>
          </div>

          <div v-if="showPendingTeachers" class="alert alert-warning" role="alert">
            <i class="bi bi-info-circle me-2"></i>
            <strong>New teacher registrations require approval</strong> before they can access the system.
          </div>

          <div v-if="showPendingTeachers" class="table-responsive">
            <table class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in pendingTeachers" :key="teacher.teacher_id" class="align-middle">
                  <td class="fw-medium">{{ teacher.name }}</td>
                  <td>{{ teacher.email }}</td>
                  <td>{{ formatDate(teacher.created_at) }}</td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-success btn-sm" @click="approveTeacher(teacher)">
                        <i class="bi bi-check-circle me-1"></i>
                        Approve
                      </button>
                      <button class="btn btn-danger btn-sm" @click="rejectTeacher(teacher)">
                        <i class="bi bi-x-circle me-1"></i>
                        Reject
                      </button>
                      <button class="btn btn-outline-primary btn-sm" @click="viewTeacherDetails(teacher)">
                        <i class="bi bi-eye me-1"></i>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Add Teacher Form -->
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Quick Add Teacher</h2>
            <button class="btn btn-secondary btn-sm" @click="toggleTeacherForm">
              {{ showTeacherForm ? 'Hide' : 'Show' }} Form
            </button>
          </div>

          <div v-if="showTeacherForm" class="row g-3">
            <div class="col-md-6">
              <label for="quickTeacherName" class="form-label">Full Name *</label>
              <input 
                type="text" 
                class="form-control" 
                id="quickTeacherName" 
                v-model="newTeacher.name"
                required
                placeholder="Enter teacher's full name"
                :class="{ 'is-invalid': errors.name }"
              >
              <div class="invalid-feedback" v-if="errors.name">
                {{ errors.name }}
              </div>
            </div>
            <div class="col-md-6">
              <label for="quickTeacherEmail" class="form-label">Email Address *</label>
              <input 
                type="email" 
                class="form-control" 
                id="quickTeacherEmail" 
                v-model="newTeacher.email"
                required
                placeholder="teacher@school.com"
                :class="{ 'is-invalid': errors.email }"
              >
              <div class="invalid-feedback" v-if="errors.email">
                {{ errors.email }}
              </div>
            </div>
            <div class="col-md-6">
              <label for="quickTeacherPassword" class="form-label">Password *</label>
              <div class="input-group">
                <input 
                  :type="showNewTeacherPassword ? 'text' : 'password'" 
                  class="form-control" 
                  id="quickTeacherPassword" 
                  v-model="newTeacher.password"
                  required
                  placeholder="Minimum 6 characters"
                  :class="{ 'is-invalid': errors.password }"
                >
                <button type="button" class="btn btn-outline-secondary" @click="showNewTeacherPassword = !showNewTeacherPassword">
                  <i :class="showNewTeacherPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div class="invalid-feedback" v-if="errors.password">
                {{ errors.password }}
              </div>
            </div>
            <div class="col-md-6">
              <label for="quickTeacherStatus" class="form-label">Status</label>
              <select class="form-select" id="quickTeacherStatus" v-model="newTeacher.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div class="col-12">
              <button 
                type="button" 
                class="btn btn-primary-custom" 
                @click="handleQuickAddTeacher" 
                :disabled="loading"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding Teacher...
                </span>
                <span v-else>Add Teacher</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Teacher Management Section -->
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Teacher Management</h2>
            <div class="d-flex gap-2">
              <router-link to="/teachers" class="btn btn-outline-primary">View All Teachers</router-link>
              <button class="btn btn-secondary btn-sm" @click="toggleTeacherSearch">
                {{ showTeacherSearch ? 'Hide' : 'Show' }} Search
              </button>
            </div>
          </div>

          <!-- Search and Filter -->
          <div v-if="showTeacherSearch" class="row g-3 mb-4">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  v-model="teacherSearchQuery"
                  type="text"
                  class="form-control"
                  placeholder="Search teachers..."
                >
              </div>
            </div>
            <div class="col-md-4">
              <select v-model="teacherStatusFilter" class="form-select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary-custom w-100" @click="searchTeachers">
                <i class="bi bi-search me-1"></i>
                Search
              </button>
            </div>
          </div>

          <!-- Teachers Table -->
          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>
                    <div class="d-flex justify-content-between align-items-center">
                      <span>Name</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="sortBy('name')">
                        <i class="bi bi-arrow-down-up"></i>
                      </button>
                    </div>
                  </th>
                  <th>
                    <div class="d-flex justify-content-between align-items-center">
                      <span>Email</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="sortBy('email')">
                        <i class="bi bi-arrow-down-up"></i>
                      </button>
                    </div>
                  </th>
                  <th>
                    <div class="d-flex justify-content-between align-items-center">
                      <span>Status</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="sortBy('status')">
                        <i class="bi bi-arrow-down-up"></i>
                      </button>
                    </div>
                  </th>
                  <th>
                    <div class="d-flex justify-content-between align-items-center">
                      <span>Date Joined</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="sortBy('date_joined')">
                        <i class="bi bi-arrow-down-up"></i>
                      </button>
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in filteredTeachers" :key="teacher.teacher_id" class="align-middle">
                  <td class="fw-medium">{{ teacher.name }}</td>
                  <td>{{ teacher.email }}</td>
                  <td>
                    <span :class="getStatusClass(teacher.status)" class="status-badge">
                      {{ teacher.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(teacher.date_joined) }}</td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-warning-custom btn-sm" @click="openEditModal(teacher)">
                        <i class="bi bi-pencil me-1"></i>
                        Edit
                      </button>
                      <button class="btn btn-danger-custom btn-sm" @click="deleteTeacher(teacher)">
                        <i class="bi bi-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Modules -->
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Recent Modules</h2>
            <div class="d-flex gap-2">
              <router-link to="/modules" class="btn btn-outline-primary">View All Modules</router-link>
              <button class="btn btn-success btn-sm" @click="exportDashboardData">
                <i class="bi bi-download me-1"></i>
                Export Data
              </button>
            </div>
          </div>

          <div class="row g-3">
            <div v-for="module in recentModules" :key="module.module_id" class="col-12 col-md-6 col-lg-4">
              <div class="module-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 class="fw-semibold mb-1">{{ module.module_name }}</h5>
                    <p class="text-muted small mb-2">{{ module.department || 'General' }}</p>
                    <div class="d-flex gap-2">
                      <span class="badge bg-primary">{{ module.credits || 3 }} credits</span>
                      <span class="badge bg-secondary">{{ module.semester || 'Fall' }}</span>
                    </div>
                  </div>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="editModule(module)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="deleteModule(module)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Logs -->
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Recent File Uploads</h2>
            <router-link to="/uploads" class="btn btn-outline-primary">View All Files</router-link>
          </div>

          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in fileLogs.slice(0, 5)" :key="log.id" class="align-middle">
                  <td class="fw-medium">{{ log.filename }}</td>
                  <td>
                    <span class="badge bg-info">{{ log.file_type }}</span>
                  </td>
                  <td>{{ formatFileSize(log.file_size) }}</td>
                  <td>{{ formatDate(log.upload_date) }}</td>
                  <td>
                    <span :class="log.status === 'success' ? 'text-success' : 'text-danger'" class="fw-semibold">
                      {{ log.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { Modal, Toast } from 'bootstrap'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Navigation
const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
  { name: 'Timetable', path: '/timetable', icon: '📅' },
  { name: 'Under Timetable', path: '/under-timetable', icon: '📋' }
]

// State
const loading = ref(false)
const stats = ref({
  teachers: 0,
  activeTeachers: 0,
  pendingTeachers: 0,
  modules: 0,
  classes: 0,
  sessions: 0
})

const teachers = ref([])
const recentTeachers = ref([])
const recentModules = ref([])
const pendingTeachers = ref([])
const fileLogs = ref([])

// UI State
const showTeacherForm = ref(true)
const showPendingTeachers = ref(false)
const showTeacherSearch = ref(false)
const showNewTeacherPassword = ref(false)

// Search and Filter
const teacherSearchQuery = ref('')
const teacherStatusFilter = ref('')
const sortField = ref('name')
const sortDirection = ref('asc')

// New Teacher Form
const newTeacher = ref({
  name: '',
  email: '',
  password: '',
  status: 'active'
})

const errors = ref({})

// Notification system
const notifications = ref([])
const showNotifications = ref(false)

// Quick Actions
const quickActions = [
  { title: 'Add Teacher', description: 'Register a new teacher', icon: '👤', path: '/teachers' },
  { title: 'Create Module', description: 'Add a new module', icon: '📚', path: '/modules' },
  { title: 'Generate Timetable', description: 'Create class schedules', icon: '📅', path: '/timetable' },
  { title: 'View Reports', description: 'System analytics', icon: '📊', path: '/reports' }
]

// Computed Properties
const filteredTeachers = computed(() => {
  let filtered = teachers.value

  // Apply search filter
  if (teacherSearchQuery.value) {
    const query = teacherSearchQuery.value.toLowerCase()
    filtered = filtered.filter(teacher => 
      teacher.name.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (teacherStatusFilter.value) {
    filtered = filtered.filter(teacher => teacher.status === teacherStatusFilter.value)
  }

  // Apply sorting without mutating the reactive source array
  const sorted = [...filtered]
  return sorted.sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]

    if (sortField.value === 'date_joined') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
})

// Helper Functions
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleTimeString()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getStatusClass = (status) => {
  const statusClasses = {
    active: 'bg-success',
    inactive: 'bg-secondary',
    on_leave: 'bg-warning',
    pending: 'bg-info'
  }
  return statusClasses[status] || 'bg-secondary'
}

// Notification Functions
const addNotification = (notification) => {
  notifications.value.unshift({
    id: Date.now(),
    ...notification,
    timestamp: new Date().toISOString()
  })
  showNotifications.value = true
  
  // Auto-hide notifications after 5 seconds
  setTimeout(() => {
    showNotifications.value = false
  }, 5000)
}

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// UI Toggle Functions
const toggleTeacherForm = () => {
  showTeacherForm.value = !showTeacherForm.value
}

const togglePendingTeachers = () => {
  showPendingTeachers.value = !showPendingTeachers.value
}

const toggleTeacherSearch = () => {
  showTeacherSearch.value = !showTeacherSearch.value
}

// Sort Functions
const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Search Functions
const searchTeachers = () => {
  // Search is handled by computed property
  console.log('Searching teachers...')
}

// Teacher Management Functions
const validateTeacherForm = () => {
  errors.value = {}

  if (!newTeacher.value.name.trim()) {
    errors.value.name = 'Name is required'
  } else if (newTeacher.value.name.trim().length < 3) {
    errors.value.name = 'Name must be at least 3 characters'
  }

  if (!newTeacher.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }

  if (!newTeacher.value.password) {
    errors.value.password = 'Password is required'
  } else if (newTeacher.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }

  return Object.keys(errors.value).length === 0
}

const handleQuickAddTeacher = async () => {
  if (!validateTeacherForm()) return

  loading.value = true

  try {
    const response = await api.post('/teachers', newTeacher.value)
    
    if (response.data.teacher) {
      teachers.value.unshift(response.data.teacher)
      recentTeachers.value.unshift(response.data.teacher)
      stats.value.teachers = teachers.value.length

      // Reset form
      newTeacher.value = {
        name: '',
        email: '',
        password: '',
        status: 'active'
      }

      // Add notification for admin approval
      addNotification({
        type: 'success',
        title: 'New Teacher Registration',
        message: `${response.data.teacher.name} has registered and needs admin approval.`,
        teacher: response.data.teacher
      })

      // Refresh dashboard stats after add
      await loadDashboardData()

      // Show success message
      const toast = new Toast(document.createElement('div'))
      toast.show()
    }
  } catch (error) {
    console.error('Error adding teacher:', error)
  } finally {
    loading.value = false
  }
}

const approveTeacher = async (teacher) => {
  try {
    await api.put(`/teachers/${teacher.teacher_id}/approve`)
    
    // Update teacher status
    const index = pendingTeachers.value.findIndex(t => t.teacher_id === teacher.teacher_id)
    if (index > -1) {
      pendingTeachers.value.splice(index, 1)
    }

    // Update main teachers list
    const teacherIndex = teachers.value.findIndex(t => t.teacher_id === teacher.teacher_id)
    if (teacherIndex > -1) {
      teachers.value[teacherIndex].status = 'active'
    }

    showSuccessMessage('Teacher approved successfully!')
    await loadDashboardData()
  } catch (error) {
    console.error('Error approving teacher:', error)
    showErrorMessage('Failed to approve teacher')
  }
}

const rejectTeacher = async (teacher) => {
  if (!confirm(`Are you sure you want to reject ${teacher.name}?`)) return

  try {
    await api.delete(`/teachers/${teacher.teacher_id}`)
    
    // Remove from pending teachers
    pendingTeachers.value = pendingTeachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    // Remove from main teachers list
    teachers.value = teachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    showSuccessMessage('Teacher rejected and removed successfully!')
    await loadDashboardData()
  } catch (error) {
    console.error('Error rejecting teacher:', error)
    showErrorMessage('Failed to reject teacher')
  }
}

const viewTeacherDetails = (teacher) => {
  // Implementation for viewing teacher details
  console.log('View teacher details:', teacher)
}

const openEditModal = (teacher) => {
  // Implementation for editing teacher
  console.log('Edit teacher:', teacher)
}

const deleteTeacher = async (teacher) => {
  if (!confirm(`Are you sure you want to delete ${teacher.name}?`)) return

  try {
    await api.delete(`/teachers/${teacher.teacher_id}`)
    
    // Remove teacher from the list
    teachers.value = teachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    recentTeachers.value = recentTeachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    // Update stats
    stats.value.teachers = teachers.value.length
    
    showSuccessMessage('Teacher deleted successfully!')
    await loadDashboardData()
  } catch (error) {
    console.error('Error deleting teacher:', error)
    showErrorMessage('Failed to delete teacher')
  }
}

// Module Functions
const editModule = (module) => {
  console.log('Edit module:', module)
}

const deleteModule = async (module) => {
  if (!confirm(`Are you sure you want to delete ${module.module_name}?`)) return

  try {
    await api.delete(`/modules/${module.module_id}`)
    recentModules.value = recentModules.value.filter(item => item.module_id !== module.module_id)
    stats.value.modules = Math.max((stats.value.modules || 1) - 1, 0)
    showSuccessMessage('Module deleted successfully!')
    await loadDashboardData()
  } catch (error) {
    console.error('Error deleting module:', error)
    showErrorMessage('Failed to delete module')
  }
}

// Export Function
const exportDashboardData = () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    stats: stats.value,
    teachers: teachers.value,
    modules: recentModules.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  showSuccessMessage('Dashboard data exported successfully!')
}

// Action Handler
const handleAction = (action) => {
  if (action.path) {
    router.push(action.path)
  }
}


// Logout Function
const handleLogout = () => {
  authStore.logout()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('userType')
  router.push('/login')
}

// Message Functions
const showSuccessMessage = (message) => {
  // Implementation for showing success messages
  console.log('Success:', message)
}

const showErrorMessage = (message) => {
  // Implementation for showing error messages
  console.log('Error:', message)
}

// Data Loading
const loadDashboardData = async () => {
  try {
    // Load teachers
    const teachersResponse = await api.get('/teachers')
    const teacherList = teachersResponse.data.teachers || []
    teachers.value = teacherList
    recentTeachers.value = teacherList.slice(0, 3)
    pendingTeachers.value = teacherList.filter(t => t.status === 'pending')
    stats.value.teachers = teacherList.length
    stats.value.activeTeachers = teacherList.filter(t => t.status === 'active').length
    stats.value.pendingTeachers = teacherList.filter(t => t.status === 'pending').length

    // Load modules
    const modulesResponse = await api.get('/modules')
    recentModules.value = modulesResponse.data.modules?.slice(0, 3) || []
    stats.value.modules = modulesResponse.data.modules?.length || 0

    // Load classes
    const classesResponse = await api.get('/classes')
    stats.value.classes = classesResponse.data.classes?.length || 0

    // Load timetable entries for actual session count
    const timetableResponse = await api.get('/timetable')
    stats.value.sessions = timetableResponse.data.timetables?.length || 0

    // Load file logs
    const logsResponse = await api.get('/uploads')
    fileLogs.value = logsResponse.data.logs || []

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.header-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
}

.sidebar-custom {
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  min-height: calc(100vh - 80px);
  padding: 1rem;
}

.nav-item-custom {
  color: #495057;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item-custom:hover {
  background-color: #e9ecef;
  color: #495057;
}

.nav-item-custom.active {
  background-color: #007bff;
  color: white;
}

.card-custom {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  padding: 1.5rem;
}

.stat-card-custom {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 0.75rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.stat-card-custom,
.stat-card-custom * {
  color: white !important;
}

.stat-card-custom:hover {
  transform: translateY(-2px);
}

.stat-card-custom.success {
  border-left: 4px solid #28a745;
}

.stat-card-custom.warning {
  border-left: 4px solid #ffc107;
}

.stat-card-custom.danger {
  border-left: 4px solid #dc3545;
}

.animate-pulse-slow {
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.quick-action-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.quick-action-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.module-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: transform 0.2s ease;
}

.module-card:hover {
  transform: translateY(-1px);
}

.btn-primary-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.btn-primary-custom:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}

.btn-warning-custom {
  background: #ffc107;
  border: none;
  color: #212529;
}

.btn-danger-custom {
  background: #dc3545;
  border: none;
  color: white;
}

.table-custom {
  background: white;
}

.table-custom th {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

.text-decoration-none {
  text-decoration: none;
}

.dropdown-menu {
  border: 1px solid #dee2e6;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>

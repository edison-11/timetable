<template>
  <div class="min-vh-100">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Timetable Management System</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="text-light opacity-75">Welcome, Admin</span>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
            A
          </div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link 
            v-for="item in navigation" 
            :key="item.name"
            :to="item.path"
            class="nav-item-custom d-block mb-2"
            :class="{ 'active': route.path === item.path }"
          >
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
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

        <!-- Quick Add Teacher Form -->
        <div class="card-custom mb-4">
          <div ref="teacherFormSection"></div>
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
              <input 
                type="password" 
                class="form-control" 
                id="quickTeacherPassword" 
                v-model="newTeacher.password"
                required
                placeholder="Minimum 6 characters"
                :class="{ 'is-invalid': errors.password }"
              >
              <div class="invalid-feedback" v-if="errors.password">
                {{ errors.password }}
              </div>
            </div>
            <div class="col-md-6">
              <label for="quickTeacherDepartment" class="form-label">Department *</label>
              <input
                type="text"
                class="form-control"
                id="quickTeacherDepartment"
                v-model="newTeacher.department"
                required
                list="dashboardTeacherDepartmentSuggestions"
                placeholder="Enter department"
                :class="{ 'is-invalid': errors.department }"
              >
              <datalist id="dashboardTeacherDepartmentSuggestions">
                <option v-for="department in teacherDepartmentSuggestions" :key="department" :value="department" />
              </datalist>
              <div class="invalid-feedback" v-if="errors.department">
                {{ errors.department }}
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
          <div ref="teacherManagementSection"></div>
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
                      <span>Department</span>
                      <button class="btn btn-sm btn-outline-secondary" @click="sortBy('department')">
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
                    <span class="badge bg-primary">{{ teacher.department || 'SSOD' }}</span>
                  </td>
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
            
            <!-- No Results Message -->
            <div v-if="filteredTeachers.length === 0" class="text-center py-5">
              <div class="alert alert-info" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                No teachers found matching your search criteria.
              </div>
            </div>
          </div>
        </div>

        <!-- Reports Section -->
        <div v-if="showReports" class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Reports Overview</h2>
            <button class="btn btn-outline-secondary btn-sm" @click="showReports = false">Hide Reports</button>
          </div>
          <div class="row g-3">
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <div class="h3 mb-1">{{ stats.teachers }}</div>
                <div class="text-muted small">Teachers</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <div class="h3 mb-1">{{ stats.modules }}</div>
                <div class="text-muted small">Modules</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <div class="h3 mb-1">{{ stats.classes }}</div>
                <div class="text-muted small">Classes</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <div class="h3 mb-1">{{ stats.sessions }}</div>
                <div class="text-muted small">Weekly Sessions</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Modules Table -->
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-semibold text-dark">Recent Modules</h2>
            <router-link to="/modules" class="btn btn-primary-custom">Add Module</router-link>
          </div>
          
          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Module Name</th>
                  <th>Department</th>
                  <th>Hours/Year</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="module in recentModules" :key="module.module_id">
                  <td>{{ module.module_name }}</td>
                  <td>
                    <span class="badge bg-primary">{{ module.department || 'SSOD' }}</span>
                  </td>
                  <td>{{ module.hours_per_year }}</td>
                  <td>{{ module.description || 'No description' }}</td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2" @click="router.push('/modules')">Edit</button>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteModule(module)">Delete</button>
                  </td>
                </tr>
                <tr v-if="!recentModules.length">
                  <td colspan="5" class="text-center text-muted py-4">No modules found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Edit Teacher Modal -->
        <div class="modal fade" id="editTeacherModal" tabindex="-1" aria-labelledby="editTeacherModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="editTeacherModalLabel">Edit Teacher</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" v-if="editingTeacher">
                <form @submit.prevent="handleUpdateTeacher">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="editTeacherName" class="form-label">Full Name *</label>
                      <input type="text" class="form-control" id="editTeacherName" v-model="editingTeacher.name" required :class="{ 'is-invalid': errors.name }">
                      <div class="invalid-feedback" v-if="errors.name">{{ errors.name }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherEmail" class="form-label">Email Address *</label>
                      <input type="email" class="form-control" id="editTeacherEmail" v-model="editingTeacher.email" required :class="{ 'is-invalid': errors.email }">
                      <div class="invalid-feedback" v-if="errors.email">{{ errors.email }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherPassword" class="form-label">Password</label>
                      <input type="password" class="form-control" id="editTeacherPassword" v-model="editingTeacher.password" placeholder="Leave blank to keep current password" :class="{ 'is-invalid': errors.password }">
                      <div class="invalid-feedback" v-if="errors.password">{{ errors.password }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherDepartment" class="form-label">Department *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="editTeacherDepartment"
                        v-model="editingTeacher.department"
                        required
                        list="dashboardTeacherDepartmentSuggestions"
                        placeholder="Enter department"
                        :class="{ 'is-invalid': errors.department }"
                      >
                      <div class="invalid-feedback" v-if="errors.department">{{ errors.department }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherStatus" class="form-label">Status</label>
                      <select class="form-select" id="editTeacherStatus" v-model="editingTeacher.status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherDateJoined" class="form-label">Date Joined</label>
                      <input type="date" class="form-control" id="editTeacherDateJoined" v-model="editingTeacher.date_joined">
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="handleUpdateTeacher" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </span>
                  <span v-else>Update Teacher</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/stores/api'
import { Modal, Toast } from 'bootstrap'
const router = useRouter()
const route = useRoute()

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Rooms', path: '/rooms', icon: '🏠' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
  { name: 'Bus Routes', path: '/bus-routes', icon: '🚌' },
  { name: 'Timetable', path: '/timetable', icon: '📅' },
  { name: 'Settings', path: '/settings', icon: '⚙️' }
]

const quickActions = [
  { title: 'Add Teacher', description: 'Register new teacher', icon: '➕', action: 'add-teacher' },
  { title: 'Create Timetable', description: 'Generate schedule', icon: '📋', action: 'create-timetable' },
  { title: 'View Reports', description: 'Analytics & insights', icon: '📊', action: 'view-reports' },
  { title: 'Export Data', description: 'Download reports', icon: '📤', action: 'export-data' }
]

const stats = ref({
  teachers: 0,
  modules: 0,
  classes: 0,
  sessions: 0
})

const teachers = ref([])
const recentTeachers = ref([])
const recentModules = ref([])
const showReports = ref(false)
const teacherFormSection = ref(null)
const teacherManagementSection = ref(null)
const commonDepartments = ['SSOD', 'ELT', 'S1', 'S2']
const teacherDepartmentSuggestions = computed(() => {
  const departments = teachers.value.map(teacher => teacher.department).filter(Boolean)
  return [...new Set([...commonDepartments, ...departments])].sort((a, b) => a.localeCompare(b))
})

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'status-active'
    case 'inactive': return 'status-inactive'
    case 'pending': return 'status-pending'
    default: return 'status-pending'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const handleAction = (action) => {
  if (action.action === 'add-teacher') {
    showTeacherForm.value = true
    errors.value = {}
    setTimeout(() => teacherFormSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    return
  }

  if (action.action === 'create-timetable') {
    router.push('/timetable')
    return
  }

  if (action.action === 'view-reports') {
    showReports.value = true
    return
  }

  if (action.action === 'export-data') {
    exportDashboardData()
  }
}

// Teacher form data
const showTeacherForm = ref(false)
const newTeacher = ref({
  name: '',
  email: '',
  department: '',
  password: '',
  status: 'active'
})
const loading = ref(false)
const errors = ref({})

// Teacher management data
const teacherSearchQuery = ref('')
const teacherStatusFilter = ref('')
const sortField = ref('name')
const sortDirection = ref('asc')
const editingTeacher = ref(null)
const showTeacherSearch = ref(false)

const toggleTeacherForm = () => {
  showTeacherForm.value = !showTeacherForm.value
  // Reset form when opening
  if (showTeacherForm.value) {
    newTeacher.value = {
      name: '',
      email: '',
      department: '',
      password: '',
      status: 'active'
    }
    errors.value = {}
  }
}

const validateTeacherForm = () => {
  errors.value = {}
  
  if (!newTeacher.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!newTeacher.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }

  if (!newTeacher.value.department.trim()) {
    errors.value.department = 'Department is required'
  }
  
  if (!newTeacher.value.password.trim()) {
    errors.value.password = 'Password is required'
  } else if (newTeacher.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleQuickAddTeacher = async () => {
  if (!validateTeacherForm()) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    const payload = {
      ...newTeacher.value,
      name: newTeacher.value.name.trim(),
      email: newTeacher.value.email.trim(),
      department: newTeacher.value.department.trim()
    }
    const response = await api.post('/teachers/register', payload)
    
    if (response.data.teacher) {
      // Add to recent teachers list
      recentTeachers.value.unshift(response.data.teacher)
      stats.value.teachers = (stats.value.teachers || 0) + 1
      
      // Reset form
      newTeacher.value = {
        name: '',
        email: '',
        department: '',
        password: '',
        status: 'active'
      }
      
      // Hide form
      showTeacherForm.value = false
      
      // Show success message
      showSuccessMessage('Teacher added successfully!')
    }
  } catch (error) {
    console.error('Error adding teacher:', error)
    if (error.response?.data?.message) {
      errors.value.email = error.response.data.message
    } else {
      showErrorMessage('Failed to add teacher. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

const showSuccessMessage = (message) => {
  // Create a toast notification
  const toastHtml = `
    <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `
  
  const toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
  toastContainer.innerHTML = toastHtml
  document.body.appendChild(toastContainer)
  
  const toastElement = toastContainer.querySelector('.toast')
  const toast = new Toast(toastElement)
  toast.show()
  
  setTimeout(() => {
    document.body.removeChild(toastContainer)
  }, 5000)
}

const showErrorMessage = (message) => {
  // Create an error toast notification
  const toastHtml = `
    <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `
  
  const toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
  toastContainer.innerHTML = toastHtml
  document.body.appendChild(toastContainer)
  
  const toastElement = toastContainer.querySelector('.toast')
  const toast = new Toast(toastElement)
  toast.show()
  
  setTimeout(() => {
    document.body.removeChild(toastContainer)
  }, 5000)
}

const toggleTeacherSearch = () => {
  showTeacherSearch.value = !showTeacherSearch.value
  teacherSearchQuery.value = ''
  teacherStatusFilter.value = ''
}

const filteredTeachers = computed(() => {
  let filtered = teachers.value.filter(teacher => {
    const matchesSearch = !teacherSearchQuery.value || 
      teacher.name.toLowerCase().includes(teacherSearchQuery.value.toLowerCase()) ||
      teacher.email.toLowerCase().includes(teacherSearchQuery.value.toLowerCase()) ||
      (teacher.department || 'SSOD').toLowerCase().includes(teacherSearchQuery.value.toLowerCase())
    
    const matchesStatus = !teacherStatusFilter.value || teacher.status === teacherStatusFilter.value
    
    return matchesSearch && matchesStatus
  })

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]
    
    if (sortField.value === 'date_joined') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (sortDirection.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
})

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const searchTeachers = () => {
  teacherManagementSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const openEditModal = (teacher) => {
  editingTeacher.value = {
    teacher_id: teacher.teacher_id,
    name: teacher.name,
    email: teacher.email,
    department: teacher.department || 'SSOD',
    password: '',
    status: teacher.status,
    date_joined: teacher.date_joined ? teacher.date_joined.slice(0, 10) : ''
  }
  errors.value = {}
  
  // Show the modal using Bootstrap
  const modal = new Modal(document.getElementById('editTeacherModal'))
  modal.show()
}

const handleUpdateTeacher = async () => {
  if (!editingTeacher.value) return
  
  loading.value = true
  errors.value = {}
  
  try {
    const updateData = {
      name: editingTeacher.value.name,
      email: editingTeacher.value.email,
      department: editingTeacher.value.department.trim(),
      status: editingTeacher.value.status,
      date_joined: editingTeacher.value.date_joined
    }
    
    // Only include password if it's provided
    if (editingTeacher.value.password) {
      updateData.password = editingTeacher.value.password
    }
    
    const response = await api.put(`/teachers/${editingTeacher.value.teacher_id}`, updateData)
    
    if (response.data.teacher) {
      // Update teacher in the list
      const index = teachers.value.findIndex(t => t.teacher_id === editingTeacher.value.teacher_id)
      if (index !== -1) {
        teachers.value[index] = response.data.teacher
      }
      
      // Update recent teachers if needed
      const recentIndex = recentTeachers.value.findIndex(t => t.teacher_id === editingTeacher.value.teacher_id)
      if (recentIndex !== -1) {
        recentTeachers.value[recentIndex] = response.data.teacher
      }
      
      // Close modal
      const modal = Modal.getInstance(document.getElementById('editTeacherModal'))
      modal.hide()
      
      // Reset editing teacher
      editingTeacher.value = null
      
      showSuccessMessage('Teacher updated successfully!')
    }
  } catch (error) {
    console.error('Error updating teacher:', error)
    if (error.response?.data?.message) {
      errors.value.email = error.response.data.message
    } else {
      showErrorMessage('Failed to update teacher. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

const deleteTeacher = async (teacher) => {
  if (!confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) {
    return
  }
  
  try {
    await api.delete(`/teachers/${teacher.teacher_id}`)
    
    // Remove teacher from the list
    teachers.value = teachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    // Remove from recent teachers if present
    recentTeachers.value = recentTeachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    // Update stats
    stats.value.teachers = teachers.value.length
    
    showSuccessMessage('Teacher deleted successfully!')
  } catch (error) {
    console.error('Error deleting teacher:', error)
    showErrorMessage('Failed to delete teacher. Please try again.')
  }
}

const deleteModule = async (module) => {
  if (!confirm(`Are you sure you want to delete ${module.module_name}? This action cannot be undone.`)) {
    return
  }

  try {
    await api.delete(`/modules/${module.module_id}`)
    recentModules.value = recentModules.value.filter(item => item.module_id !== module.module_id)
    stats.value.modules = Math.max((stats.value.modules || 1) - 1, 0)
    showSuccessMessage('Module deleted successfully!')
  } catch (error) {
    console.error('Error deleting module:', error)
    showErrorMessage(error.response?.data?.message || 'Failed to delete module. Please try again.')
  }
}

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

const loadDashboardData = async () => {
  try {
    // Load teachers
    const teachersResponse = await api.get('/teachers')
    teachers.value = teachersResponse.data.teachers || []
    recentTeachers.value = teachersResponse.data.teachers?.slice(0, 3) || []
    stats.value.teachers = teachersResponse.data.teachers?.length || 0

    // Load modules
    const modulesResponse = await api.get('/modules')
    recentModules.value = modulesResponse.data.modules?.slice(0, 3) || []
    stats.value.modules = modulesResponse.data.modules?.length || 0

    // Load classes
    const classesResponse = await api.get('/classes')
    stats.value.classes = classesResponse.data.classes?.length || 0

    // Calculate sessions (example calculation)
    stats.value.sessions = stats.value.classes * 20 // Assuming 20 sessions per class

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

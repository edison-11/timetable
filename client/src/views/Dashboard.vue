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
            
            <!-- No Results Message -->
            <div v-if="filteredTeachers.length === 0" class="text-center py-5">
              <div class="alert alert-info" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                No teachers found matching your search criteria.
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
                  <th>Hours/Year</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="module in recentModules" :key="module.module_id">
                  <td>{{ module.module_name }}</td>
                  <td>{{ module.hours_per_year }}</td>
                  <td>{{ module.description }}</td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2">Edit</button>
                    <button class="btn btn-danger-custom btn-sm">Delete</button>
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
import axios from 'axios'
import { Modal, Toast } from 'bootstrap'
const router = useRouter()
const route = useRoute()

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
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
const pendingTeachers = ref([])
const showPendingTeachers = ref(true)

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
  console.log('Action clicked:', action.action)
  // Handle different actions here
}

// Teacher form data
const showTeacherForm = ref(false)
const newTeacher = ref({
  name: '',
  email: '',
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
    const response = await api.post('/teachers/register', newTeacher.value)
    
    if (response.data.teacher) {
      // Add to recent teachers list
      recentTeachers.value.unshift(response.data.teacher)
      stats.value.teachers = (stats.value.teachers || 0) + 1
      
      // Reset form
      newTeacher.value = {
        name: '',
        email: '',
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
      teacher.email.toLowerCase().includes(teacherSearchQuery.value.toLowerCase())
    
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
  // This function can be used to trigger a search
  console.log('Searching teachers...')
}

const togglePendingTeachers = () => {
  showPendingTeachers.value = !showPendingTeachers.value
}

const approveTeacher = async (teacher) => {
  if (!confirm(`Are you sure you want to approve ${teacher.name}?`)) {
    return
  }
  
  try {
    const response = await api.put(`/teachers/${teacher.teacher_id}/approve`)
    
    if (response.data.success) {
      // Remove from pending list
      pendingTeachers.value = pendingTeachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
      
      // Add to active teachers list
      teachers.value.unshift(response.data.teacher)
      
      // Update stats
      stats.value.teachers = teachers.value.length
      
      showSuccessMessage(`Teacher ${teacher.name} approved successfully!`)
    }
  } catch (error) {
    console.error('Error approving teacher:', error)
    showErrorMessage('Failed to approve teacher. Please try again.')
  }
}

const rejectTeacher = async (teacher) => {
  if (!confirm(`Are you sure you want to reject ${teacher.name}? This action cannot be undone.`)) {
    return
  }
  
  try {
    await api.delete(`/teachers/${teacher.teacher_id}`)
    
    // Remove from pending list
    pendingTeachers.value = pendingTeachers.value.filter(t => t.teacher_id !== teacher.teacher_id)
    
    showErrorMessage(`Teacher ${teacher.name} rejected and removed.`)
  } catch (error) {
    console.error('Error rejecting teacher:', error)
    showErrorMessage('Failed to reject teacher. Please try again.')
  }
}

const viewTeacherDetails = (teacher) => {
  // Show teacher details in a modal or alert
  const details = `
    Teacher Details:
    Name: ${teacher.name}
    Email: ${teacher.email}
    Registration Date: ${formatDate(teacher.created_at)}
    Status: ${teacher.status}
  `
  alert(details)
}

const openEditModal = (teacher) => {
  editingTeacher.value = {
    teacher_id: teacher.teacher_id,
    name: teacher.name,
    email: teacher.email,
    password: '',
    status: teacher.status,
    date_joined: teacher.date_joined
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

const loadDashboardData = async () => {
  try {
    // Load teachers
    const teachersResponse = await api.get('/teachers')
    teachers.value = teachersResponse.data.teachers || []
    recentTeachers.value = teachersResponse.data.teachers?.slice(0, 3) || []
    stats.value.teachers = teachersResponse.data.teachers?.length || 0

    // Load pending teachers (without auth)
    const pendingResponse = await axios.get('/api/pending/teachers')
    pendingTeachers.value = pendingResponse.data.pendingTeachers || []

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

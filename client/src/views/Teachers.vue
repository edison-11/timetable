<template>
  <div class="min-vh-100 admin-page">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Teachers Management</h1>
        </div>
        <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
          A
        </div>
      </div>
    </header>

    <div class="d-flex admin-page-shell">
      <!-- Sidebar -->
      <AdminSidebar />

      <!-- Main Content -->
      <main class="flex-grow-1 p-4 admin-main">
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">All Teachers</h2>
            <button class="btn btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addTeacherModal">
              Add New Teacher
            </button>
          </div>

          <!-- Search and Filter -->
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search teachers..."
                class="form-control"
              />
            </div>
            <div class="col-md-4">
              <select v-model="departmentFilter" class="form-select">
                <option value="">All Departments</option>
                <option v-for="department in departmentOptions" :key="department" :value="department">
                  {{ department }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <select v-model="statusFilter" class="form-select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <!-- Teachers Table -->
          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in filteredTeachers" :key="teacher.teacher_id">
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
                    <button class="btn btn-success-custom btn-sm me-2" @click="openEditModal(teacher)">Edit</button>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteTeacher(teacher)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add Teacher Modal -->
        <div class="modal fade" id="addTeacherModal" tabindex="-1" aria-labelledby="addTeacherModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="addTeacherModalLabel">Add New Teacher</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form @submit.prevent="handleAddTeacher">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="teacherName" class="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="teacherName" 
                        v-model="newTeacher.name"
                        required
                        placeholder="Enter teacher's full name"
                      >
                      <div class="invalid-feedback" v-if="errors.name">
                        {{ errors.name }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="teacherEmail" class="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        class="form-control" 
                        id="teacherEmail" 
                        v-model="newTeacher.email"
                        required
                        placeholder="teacher@school.com"
                      >
                      <div class="invalid-feedback" v-if="errors.email">
                        {{ errors.email }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="teacherPassword" class="form-label">Password *</label>
                      <div class="input-group">
                        <input 
                          :type="showNewTeacherPassword ? 'text' : 'password'" 
                          class="form-control" 
                          id="teacherPassword" 
                          v-model="newTeacher.password"
                          required
                          placeholder="Minimum 6 characters"
                        >
                        <button type="button" class="btn btn-outline-secondary" @click="showNewTeacherPassword = !showNewTeacherPassword">
                          {{ showNewTeacherPassword ? 'Hide' : 'Show' }}
                        </button>
                      </div>
                      <div class="invalid-feedback" v-if="errors.password">
                        {{ errors.password }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="teacherDepartment" class="form-label">Department *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="teacherDepartment"
                        v-model="newTeacher.department"
                        required
                        list="teacherDepartmentSuggestions"
                        placeholder="Enter department"
                        :class="{ 'is-invalid': errors.department }"
                      >
                      <datalist id="teacherDepartmentSuggestions">
                        <option v-for="department in departmentSuggestions" :key="department" :value="department" />
                      </datalist>
                      <div class="invalid-feedback" v-if="errors.department">
                        {{ errors.department }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="teacherStatus" class="form-label">Status</label>
                      <select class="form-select" id="teacherStatus" v-model="newTeacher.status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label for="teacherDateJoined" class="form-label">Date Joined</label>
                      <input 
                        type="date" 
                        class="form-control" 
                        id="teacherDateJoined" 
                        v-model="newTeacher.date_joined"
                      >
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="handleAddTeacher" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </span>
                  <span v-else>Add Teacher</span>
                </button>
              </div>
            </div>
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
              <div class="modal-body">
                <form @submit.prevent="handleUpdateTeacher" id="editTeacherForm">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="editTeacherName" class="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="editTeacherName" 
                        v-model="editingTeacher.name"
                        required
                        placeholder="Enter teacher's full name"
                      >
                      <div class="invalid-feedback" v-if="editErrors.name">
                        {{ editErrors.name }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherEmail" class="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        class="form-control" 
                        id="editTeacherEmail" 
                        v-model="editingTeacher.email"
                        required
                        placeholder="teacher@school.com"
                      >
                      <div class="invalid-feedback" v-if="editErrors.email">
                        {{ editErrors.email }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherPassword" class="form-label">Password (leave blank to keep current)</label>
                      <div class="input-group">
                        <input 
                          :type="showEditTeacherPassword ? 'text' : 'password'" 
                          class="form-control" 
                          id="editTeacherPassword" 
                          v-model="editingTeacher.password"
                          placeholder="Enter new password or leave blank"
                        >
                        <button type="button" class="btn btn-outline-secondary" @click="showEditTeacherPassword = !showEditTeacherPassword">
                          {{ showEditTeacherPassword ? 'Hide' : 'Show' }}
                        </button>
                      </div>
                      <div class="invalid-feedback" v-if="editErrors.password">
                        {{ editErrors.password }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherDepartment" class="form-label">Department *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="editTeacherDepartment"
                        v-model="editingTeacher.department"
                        required
                        list="teacherDepartmentSuggestions"
                        placeholder="Enter department"
                        :class="{ 'is-invalid': editErrors.department }"
                      >
                      <div class="invalid-feedback" v-if="editErrors.department">
                        {{ editErrors.department }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTeacherStatus" class="form-label">Status</label>
                      <select class="form-select" id="editTeacherStatus" v-model="editingTeacher.status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary-custom" :disabled="editLoading" @click="handleUpdateTeacher">
                      <span v-if="editLoading">
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </span>
                      <span v-else>Update Teacher</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '@/stores/api'
import { Modal, Toast } from 'bootstrap'
import AdminSidebar from '@/components/AdminSidebar.vue'


const teachers = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const departmentFilter = ref('')
const showAddModal = ref(false)
const commonDepartments = ['Business', 'Software Development', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Networking', 'Accounting', 'Finance', 'Marketing', 'Management', 'Hospitality', 'Tourism', 'Construction', 'Mechanical', 'Automotive', 'Agriculture', 'General Studies']
const showNewTeacherPassword = ref(false)
const showEditTeacherPassword = ref(false)

// Edit functionality
const editingTeacher = ref({
  teacher_id: null,
  name: '',
  email: '',
  department: '',
  password: '',
  status: 'active',
  date_joined: ''
})
const editLoading = ref(false)
const editErrors = ref({})

// Form data
const newTeacher = ref({
  name: '',
  email: '',
  department: '',
  password: '',
  status: 'active',
  date_joined: new Date().toISOString().split('T')[0]
})

const loading = ref(false)
const errors = ref({})

const filteredTeachers = computed(() => {
  return teachers.value.filter(teacher => {
    const department = teacher.department || 'SSOD'
    const query = searchQuery.value.toLowerCase()
    const matchesSearch = teacher.name.toLowerCase().includes(query) ||
                         teacher.email.toLowerCase().includes(query) ||
                         department.toLowerCase().includes(query)
    const matchesStatus = !statusFilter.value || teacher.status === statusFilter.value
    const matchesDepartment = !departmentFilter.value || department === departmentFilter.value
    return matchesSearch && matchesStatus && matchesDepartment
  })
})

const departmentOptions = computed(() => {
  const departments = teachers.value.map(teacher => teacher.department).filter(Boolean)
  return [...new Set([...commonDepartments, ...departments])].sort((a, b) => a.localeCompare(b))
})

const departmentSuggestions = computed(() => {
  return [...new Set([...commonDepartments, ...departmentOptions.value])]
})

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'status-active'
    case 'inactive': return 'status-inactive'
    case 'on_leave': return 'status-pending'
    default: return 'status-pending'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const validateForm = () => {
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

const handleAddTeacher = async () => {
  if (!validateForm()) {
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
      // Add the new teacher to the list
      teachers.value.unshift(response.data.teacher)
      
      // Reset form
      newTeacher.value = {
        name: '',
        email: '',
        department: '',
        password: '',
        status: 'active',
        date_joined: new Date().toISOString().split('T')[0]
      }
      
      // Close modal
      const modal = document.getElementById('addTeacherModal')
      const bootstrapModal = Modal.getInstance(modal)
      bootstrapModal.hide()
      
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

const openEditModal = (teacher) => {
  console.log('🔍 Opening edit modal for teacher:', teacher.name)
  editingTeacher.value = {
    teacher_id: teacher.teacher_id,
    name: teacher.name,
    email: teacher.email,
    department: teacher.department || 'SSOD',
    password: '',
    status: teacher.status,
    date_joined: teacher.date_joined
  }
  editErrors.value = {}
  
  // Show the modal
  const modal = new Modal(document.getElementById('editTeacherModal'))
  modal.show()
}

const validateEditForm = () => {
  console.log('validateEditForm called')
  editErrors.value = {}
  
  if (!editingTeacher.value.name.trim()) {
    editErrors.value.name = 'Name is required'
    console.log('Name validation failed')
  }
  
  if (!editingTeacher.value.email.trim()) {
    editErrors.value.email = 'Email is required'
    console.log('Email required validation failed')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingTeacher.value.email)) {
    editErrors.value.email = 'Please enter a valid email address'
    console.log('Email format validation failed')
  }

  if (!editingTeacher.value.department.trim()) {
    editErrors.value.department = 'Department is required'
  }
  
  if (editingTeacher.value.password && editingTeacher.value.password.length < 6) {
    editErrors.value.password = 'Password must be at least 6 characters'
    console.log('Password validation failed')
  }
  
  const isValid = Object.keys(editErrors.value).length === 0
  console.log('Validation result:', isValid, 'Errors:', editErrors.value)
  return isValid
}

const handleUpdateTeacher = async (event) => {
  console.log('🔥 handleUpdateTeacher called!')
  console.log('🔥 Event type:', event?.type)
  console.log('🔥 editingTeacher.value:', editingTeacher.value)
  
  // Prevent default form submission if it's a click event
  if (event && event.type === 'click') {
    event.preventDefault()
    console.log('🔥 Click event prevented')
  }
  
  if (!validateEditForm()) {
    console.log('❌ Form validation failed')
    return
  }
  
  console.log('✅ Form validation passed')
  editLoading.value = true
  editErrors.value = {}
  console.log('🔄 editLoading set to true')
  
  try {
    const updateData = {
      name: editingTeacher.value.name,
      email: editingTeacher.value.email,
      department: editingTeacher.value.department.trim(),
      status: editingTeacher.value.status
    }
    
    // Only include password if it's provided
    if (editingTeacher.value.password) {
      updateData.password = editingTeacher.value.password
    }
    
    // Note: date_joined is excluded from update as it's typically not changed
    
    console.log('📤 Sending update data:', updateData)
    console.log('📤 API endpoint:', `/teachers/${editingTeacher.value.teacher_id}`)
    
    const response = await api.put(`/teachers/${editingTeacher.value.teacher_id}`, updateData)
    
    console.log('📥 API response:', response.data)
    
    if (response.data.teacher) {
      // Update teacher in the list
      const index = teachers.value.findIndex(t => t.teacher_id === editingTeacher.value.teacher_id)
      if (index !== -1) {
        teachers.value[index] = response.data.teacher
      }
      
      // Close modal
      const modal = Modal.getInstance(document.getElementById('editTeacherModal'))
      modal.hide()
      
      // Reset editing teacher
      editingTeacher.value = {
        teacher_id: null,
        name: '',
        email: '',
        password: '',
        status: 'active',
        date_joined: ''
      }
      
      showSuccessMessage('Teacher updated successfully!')
    }
  } catch (error) {
    console.error('❌ Error updating teacher:', error)
    console.error('❌ Error response:', error.response?.data)
    console.error('❌ Error status:', error.response?.status)
    console.error('❌ Error message:', error.message)
    
    if (error.response?.data?.message) {
      editErrors.value.email = error.response.data.message
      console.error('❌ Backend error message:', error.response.data.message)
    } else if (error.response?.data?.errors) {
      console.error('❌ Validation errors:', error.response.data.errors)
    } else {
      showErrorMessage('Failed to update teacher. Please try again.')
      console.error('❌ Generic error - showing error message')
    }
  } finally {
    editLoading.value = false
    console.log('🔄 editLoading set to false')
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
    
    showSuccessMessage('Teacher deleted successfully!')
  } catch (error) {
    console.error('Error deleting teacher:', error)
    showErrorMessage('Failed to delete teacher. Please try again.')
  }
}

const loadTeachers = async () => {
  try {
    const response = await api.get('/teachers')
    teachers.value = response.data.teachers || []
  } catch (error) {
    console.error('Error loading teachers:', error)
  }
}

onMounted(() => {
  loadTeachers()
})
</script>

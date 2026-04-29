<template>
  <div class="min-vh-100">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Modules Management</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
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
            :class="{ 'active': $route.path === item.path }"
          >
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow-1 p-4">
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">All Modules</h2>
            <button class="btn btn-primary-custom" @click="openAddModal">
              Add New Module
            </button>
          </div>

          <!-- Search -->
          <div class="row g-3 mb-4">
            <div class="col-md-8">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search modules..."
                class="form-control"
              />
            </div>
            <div class="col-md-4">
              <select v-model="selectedDepartment" class="form-select" aria-label="Filter modules by department">
                <option value="">All departments</option>
                <option v-for="department in departmentFilterOptions" :key="department" :value="department">
                  {{ department }}
                </option>
              </select>
            </div>
          </div>

          <!-- Modules Table -->
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
                <tr v-for="module in filteredModules" :key="module.module_id">
                  <td class="fw-medium">{{ module.module_name }}</td>
                  <td>
                    <span class="badge bg-primary">{{ module.department || 'SSOD' }}</span>
                  </td>
                  <td>{{ module.hours_per_year }}</td>
                  <td>{{ module.description || 'No description' }}</td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2" @click="openEditModal(module)">
                      Edit
                    </button>
                    <button class="btn btn-danger-custom btn-sm" @click="handleDeleteModule(module)" :disabled="deleteLoadingId === module.module_id">
                      <span v-if="deleteLoadingId === module.module_id">
                        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Deleting...
                      </span>
                      <span v-else>Delete</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="!filteredModules.length">
                  <td colspan="5" class="text-center text-muted py-4">
                    No modules found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add Module Modal -->
        <div class="modal fade" id="addModuleModal" tabindex="-1" aria-labelledby="addModuleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="addModuleModalLabel">Add New Module</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div v-if="formMessage" class="alert alert-danger" role="alert">
                  {{ formMessage }}
                </div>
                <form @submit.prevent="handleAddModule">
                  <div class="row g-3">
                    <div class="col-md-12">
                      <label for="moduleName" class="form-label">Module Name *</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        id="moduleName" 
                        v-model="newModule.module_name"
                        required
                        placeholder="Enter module name"
                        :class="{ 'is-invalid': errors.module_name }"
                      >
                      <div class="invalid-feedback" v-if="errors.module_name">
                        {{ errors.module_name }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="moduleDepartment" class="form-label">Department *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="moduleDepartment"
                        v-model="newModule.department"
                        required
                        list="departmentSuggestions"
                        placeholder="Enter department"
                        :class="{ 'is-invalid': errors.department }"
                      >
                      <datalist id="departmentSuggestions">
                        <option v-for="department in departmentInputSuggestions" :key="department" :value="department" />
                      </datalist>
                      <div class="invalid-feedback" v-if="errors.department">
                        {{ errors.department }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="hoursPerYear" class="form-label">Hours per Year *</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        id="hoursPerYear" 
                        v-model.number="newModule.hours_per_year"
                        required
                        min="1"
                        step="1"
                        placeholder="Enter hours per year"
                        :class="{ 'is-invalid': errors.hours_per_year }"
                      >
                      <div class="invalid-feedback" v-if="errors.hours_per_year">
                        {{ errors.hours_per_year }}
                      </div>
                    </div>
                    <div class="col-md-12">
                      <label for="moduleDescription" class="form-label">Description</label>
                      <textarea 
                        class="form-control" 
                        id="moduleDescription" 
                        v-model="newModule.description"
                        rows="3"
                        placeholder="Enter module description"
                        :class="{ 'is-invalid': errors.description }"
                      ></textarea>
                      <div class="invalid-feedback" v-if="errors.description">
                        {{ errors.description }}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="handleAddModule" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </span>
                  <span v-else>Add Module</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Module Modal -->
        <div class="modal fade" id="editModuleModal" tabindex="-1" aria-labelledby="editModuleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="editModuleModalLabel">Edit Module</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div v-if="editFormMessage" class="alert alert-danger" role="alert">
                  {{ editFormMessage }}
                </div>
                <form @submit.prevent="handleEditModule">
                  <div class="row g-3">
                    <div class="col-md-12">
                      <label for="editModuleName" class="form-label">Module Name *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="editModuleName"
                        v-model="editModule.module_name"
                        required
                        placeholder="Enter module name"
                        :class="{ 'is-invalid': editErrors.module_name }"
                      >
                      <div class="invalid-feedback" v-if="editErrors.module_name">
                        {{ editErrors.module_name }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editModuleDepartment" class="form-label">Department *</label>
                      <input
                        type="text"
                        class="form-control"
                        id="editModuleDepartment"
                        v-model="editModule.department"
                        required
                        list="departmentSuggestions"
                        placeholder="Enter department"
                        :class="{ 'is-invalid': editErrors.department }"
                      >
                      <div class="invalid-feedback" v-if="editErrors.department">
                        {{ editErrors.department }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editHoursPerYear" class="form-label">Hours per Year *</label>
                      <input
                        type="number"
                        class="form-control"
                        id="editHoursPerYear"
                        v-model.number="editModule.hours_per_year"
                        required
                        min="1"
                        step="1"
                        placeholder="Enter hours per year"
                        :class="{ 'is-invalid': editErrors.hours_per_year }"
                      >
                      <div class="invalid-feedback" v-if="editErrors.hours_per_year">
                        {{ editErrors.hours_per_year }}
                      </div>
                    </div>
                    <div class="col-md-12">
                      <label for="editModuleDescription" class="form-label">Description</label>
                      <textarea
                        class="form-control"
                        id="editModuleDescription"
                        v-model="editModule.description"
                        rows="3"
                        placeholder="Enter module description"
                        :class="{ 'is-invalid': editErrors.description }"
                      ></textarea>
                      <div class="invalid-feedback" v-if="editErrors.description">
                        {{ editErrors.description }}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="handleEditModule" :disabled="editLoading">
                  <span v-if="editLoading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </span>
                  <span v-else>Save Changes</span>
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
import { Modal, Toast } from 'bootstrap'
import api from '@/stores/api'

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
  { name: 'Timetable', path: '/timetable', icon: '📅' }
]

const modules = ref([])
const searchQuery = ref('')
const selectedDepartment = ref('')
const commonDepartments = ['SSOD', 'ELT', 'S1', 'S2']

// Form data
const newModule = ref({
  module_name: '',
  department: '',
  hours_per_year: '',
  description: ''
})

const editModule = ref({
  module_id: null,
  module_name: '',
  department: '',
  hours_per_year: '',
  description: ''
})

const loading = ref(false)
const editLoading = ref(false)
const deleteLoadingId = ref(null)
const errors = ref({})
const editErrors = ref({})
const formMessage = ref('')
const editFormMessage = ref('')

const filteredModules = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return modules.value.filter(module => {
    const name = module.module_name || ''
    const department = module.department || 'SSOD'
    const description = module.description || ''
    const matchesDepartment = !selectedDepartment.value || department === selectedDepartment.value
    const matchesSearch = name.toLowerCase().includes(query) ||
      department.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query)

    return matchesDepartment && matchesSearch
  })
})

const existingDepartments = computed(() => {
  const departments = modules.value
    .map(module => module.department)
    .filter(Boolean)

  return [...new Set(departments)].sort((a, b) => a.localeCompare(b))
})

const departmentInputSuggestions = computed(() => {
  return [...new Set([...commonDepartments, ...existingDepartments.value])]
})

const departmentFilterOptions = computed(() => {
  return existingDepartments.value
})

const resetForm = () => {
  newModule.value = {
    module_name: '',
    department: '',
    hours_per_year: '',
    description: ''
  }
  errors.value = {}
  formMessage.value = ''
}

const resetEditForm = () => {
  editModule.value = {
    module_id: null,
    module_name: '',
    department: '',
    hours_per_year: '',
    description: ''
  }
  editErrors.value = {}
  editFormMessage.value = ''
}

const openAddModal = () => {
  resetForm()
  const modalElement = document.getElementById('addModuleModal')
  Modal.getOrCreateInstance(modalElement).show()
}

const openEditModal = (module) => {
  editModule.value = {
    module_id: module.module_id,
    module_name: module.module_name || '',
    department: module.department || 'SSOD',
    hours_per_year: Number(module.hours_per_year),
    description: module.description || ''
  }
  editErrors.value = {}
  editFormMessage.value = ''

  const modalElement = document.getElementById('editModuleModal')
  Modal.getOrCreateInstance(modalElement).show()
}

const validateModuleForm = (moduleData, fieldErrors, messageRef) => {
  fieldErrors.value = {}
  messageRef.value = ''
  
  if (!moduleData.value.module_name.trim()) {
    fieldErrors.value.module_name = 'Module name is required'
  }

  if (!moduleData.value.department.trim()) {
    fieldErrors.value.department = 'Department is required'
  }
  
  if (!Number.isInteger(moduleData.value.hours_per_year) || moduleData.value.hours_per_year < 1) {
    fieldErrors.value.hours_per_year = 'Hours per year must be a positive whole number'
  }
  
  return Object.keys(fieldErrors.value).length === 0
}

const buildModulePayload = (moduleData) => {
  return {
    module_name: moduleData.value.module_name.trim(),
    department: moduleData.value.department.trim(),
    hours_per_year: moduleData.value.hours_per_year,
    description: moduleData.value.description.trim()
  }
}

const setValidationErrors = (error, fieldErrors, messageRef) => {
  if (error.response?.data?.errors?.length) {
    fieldErrors.value = error.response.data.errors.reduce((currentErrors, item) => {
      if (item.path) currentErrors[item.path] = item.msg
      return currentErrors
    }, {})
    messageRef.value = 'Please correct the highlighted fields.'
    return true
  }

  if (error.response?.data?.message) {
    messageRef.value = error.response.data.message
    return true
  }

  return false
}

const handleAddModule = async () => {
  if (!validateModuleForm(newModule, errors, formMessage)) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    const payload = buildModulePayload(newModule)

    const response = await api.post('/modules', payload)
    
    if (response.data.module) {
      // Add the new module to the list
      modules.value.unshift(response.data.module)
      
      // Reset form
      resetForm()
      
      // Close modal
      const modalElement = document.getElementById('addModuleModal')
      Modal.getOrCreateInstance(modalElement).hide()
      
      // Show success message
      showSuccessMessage('Module added successfully!')
    }
  } catch (error) {
    console.error('Error adding module:', error)
    if (!setValidationErrors(error, errors, formMessage)) {
      showErrorMessage('Failed to add module. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

const handleEditModule = async () => {
  if (!validateModuleForm(editModule, editErrors, editFormMessage)) {
    return
  }

  editLoading.value = true
  editErrors.value = {}
  editFormMessage.value = ''

  try {
    const payload = buildModulePayload(editModule)
    const response = await api.put(`/modules/${editModule.value.module_id}`, payload)
    const updatedModule = response.data.module

    if (updatedModule) {
      const index = modules.value.findIndex(module => module.module_id === updatedModule.module_id)
      if (index !== -1) {
        modules.value.splice(index, 1, updatedModule)
      }
    }

    const modalElement = document.getElementById('editModuleModal')
    Modal.getOrCreateInstance(modalElement).hide()
    resetEditForm()
    showSuccessMessage('Module updated successfully!')
  } catch (error) {
    console.error('Error updating module:', error)
    if (!setValidationErrors(error, editErrors, editFormMessage)) {
      showErrorMessage('Failed to update module. Please try again.')
    }
  } finally {
    editLoading.value = false
  }
}

const handleDeleteModule = async (module) => {
  const confirmed = window.confirm(`Delete "${module.module_name}"?`)
  if (!confirmed) {
    return
  }

  deleteLoadingId.value = module.module_id

  try {
    await api.delete(`/modules/${module.module_id}`)
    modules.value = modules.value.filter(item => item.module_id !== module.module_id)
    showSuccessMessage('Module deleted successfully!')
  } catch (error) {
    console.error('Error deleting module:', error)
    showErrorMessage(error.response?.data?.message || 'Failed to delete module. Please try again.')
  } finally {
    deleteLoadingId.value = null
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

const loadModules = async () => {
  try {
    const response = await api.get('/modules')
    modules.value = response.data.modules || []
  } catch (error) {
    console.error('Error loading modules:', error)
  }
}

onMounted(() => {
  loadModules()
})
</script>

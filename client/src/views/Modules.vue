<template>
  <AppLayout>
    <div class="modules-container">
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h3 fw-semibold text-dark">All Modules</h2>
          <button class="btn btn-primary" @click="openAddModal">
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
          <table class="table-custom">
            <thead>
              <tr>
                <th>Module Name</th>
                <th>Department</th>
                <th>Required Room</th>
                <th>Hours/Year</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="module in filteredModules" :key="module.module_id">
                <td class="fw-medium">{{ module.module_name }}</td>
                <td>
                  <span class="badge">{{ module.department || 'SSOD' }}</span>
                </td>
                <td>{{ module.required_room_type || 'Any room' }}</td>
                <td>{{ module.hours_per_year }}</td>
                <td>{{ module.description || 'No description' }}</td>
                <td>
                  <button class="btn-edit" @click="openEditModal(module)">
                    Edit
                  </button>
                  <button class="btn-delete" @click="handleDeleteModule(module)" :disabled="deleteLoadingId === module.module_id">
                    <span v-if="deleteLoadingId === module.module_id">
                      Deleting...
                    </span>
                    <span v-else>Delete</span>
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredModules.length">
                <td colspan="6" class="text-center py-4">
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
                    <datalist id="roomTypeSuggestions">
                      <option v-for="roomType in roomTypeSuggestions" :key="roomType" :value="roomType" />
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
                  <div class="col-md-6">
                    <label for="requiredRoomType" class="form-label">Required Room Type</label>
                    <input
                      type="text"
                      class="form-control"
                      id="requiredRoomType"
                      v-model="newModule.required_room_type"
                      list="roomTypeSuggestions"
                      placeholder="Any room, Computer Lab, Workshop..."
                    >
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
              <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn-primary" @click="handleAddModule" :disabled="loading">
                <span v-if="loading">Adding...</span>
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
                  <div class="col-md-6">
                    <label for="editRequiredRoomType" class="form-label">Required Room Type</label>
                    <input
                      type="text"
                      class="form-control"
                      id="editRequiredRoomType"
                      v-model="editModule.required_room_type"
                      list="roomTypeSuggestions"
                      placeholder="Any room, Computer Lab, Workshop..."
                    >
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
              <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn-primary" @click="handleEditModule" :disabled="editLoading">
                <span v-if="editLoading">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        v-model="deleteDialog.open"
        title="Delete Module"
        :description="`Delete ${deleteDialog.module?.module_name || 'this module'}? This action cannot be undone.`"
        confirm-label="Delete"
        cancel-label="Cancel"
        loading-label="Deleting..."
        :loading="Boolean(deleteLoadingId)"
        danger
        @confirm="confirmDeleteModule"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Modal, Toast } from 'bootstrap'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const modules = ref([])
const searchQuery = ref('')
const selectedDepartment = ref('')
const commonDepartments = ['Business', 'Software Development', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Networking', 'Accounting', 'Finance', 'Marketing', 'Management', 'Hospitality', 'Tourism', 'Construction', 'Mechanical', 'Automotive', 'Agriculture', 'General Studies']
const commonRoomTypes = ['Classroom', 'Computer Lab', 'Science Lab', 'Workshop', 'Hall', 'Library']

// Form data
const newModule = ref({
  module_name: '',
  department: '',
  hours_per_year: '',
  required_room_type: '',
  description: ''
})

const editModule = ref({
  module_id: null,
  module_name: '',
  department: '',
  hours_per_year: '',
  required_room_type: '',
  description: ''
})

const loading = ref(false)
const editLoading = ref(false)
const deleteLoadingId = ref(null)
const deleteDialog = ref({ open: false, module: null })
const errors = ref({})
const editErrors = ref({})
const formMessage = ref('')
const editFormMessage = ref('')

const filteredModules = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return modules.value.filter(module => {
    const name = module.module_name || ''
    const department = module.department || 'SSOD'
    const requiredRoomType = module.required_room_type || ''
    const description = module.description || ''
    const matchesDepartment = !selectedDepartment.value || department === selectedDepartment.value
    const matchesSearch = name.toLowerCase().includes(query) ||
      department.toLowerCase().includes(query) ||
      requiredRoomType.toLowerCase().includes(query) ||
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
  return [...new Set([...commonDepartments, ...existingDepartments.value])]
})

const roomTypeSuggestions = computed(() => {
  const existingRoomTypes = modules.value.map(module => module.required_room_type).filter(Boolean)
  return [...new Set([...commonRoomTypes, ...existingRoomTypes])]
})

const resetForm = () => {
  newModule.value = {
    module_name: '',
    department: '',
    hours_per_year: '',
    required_room_type: '',
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
    required_room_type: '',
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
    required_room_type: module.required_room_type || '',
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
    required_room_type: moduleData.value.required_room_type.trim(),
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
      modules.value.unshift(response.data.module)
      resetForm()
      const modalElement = document.getElementById('addModuleModal')
      Modal.getOrCreateInstance(modalElement).hide()
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
  deleteDialog.value = { open: true, module }
}

const confirmDeleteModule = async () => {
  const module = deleteDialog.value.module
  if (!module) return

  deleteLoadingId.value = module.module_id

  try {
    await api.delete(`/modules/${module.module_id}`)
    modules.value = modules.value.filter(item => item.module_id !== module.module_id)
    showSuccessMessage('Module deleted successfully!')
    deleteDialog.value = { open: false, module: null }
  } catch (error) {
    console.error('Error deleting module:', error)
    showErrorMessage(error.response?.data?.message || 'Failed to delete module. Please try again.')
  } finally {
    deleteLoadingId.value = null
  }
}

const showSuccessMessage = (message) => {
  const toastHtml = `
    <div class="toast align-items-center text-white bg-success border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
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
  const toastHtml = `
    <div class="toast align-items-center text-white bg-danger border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
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

onMounted(async () => {
  await loadModules()
  if (route.query.action === 'add') {
    await nextTick()
    openAddModal()
  }
})
</script>

<style scoped>
.modules-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-custom {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
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
  margin-right: 0.25rem;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.form-control, .form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
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

.badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.is-invalid {
  border-color: #ef4444;
}

.invalid-feedback {
  color: #ef4444;
  font-size: 0.7rem;
  margin-top: 0.25rem;
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

.text-center {
  text-align: center;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
</style>

<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">🏛️</div>
          <h1 class="h2 mb-0">Sections Management</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">A</div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link v-for="item in navigation" :key="item.name" :to="item.path" class="nav-item-custom d-block mb-2" :class="{ 'active': $route.path === item.path }">
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <main class="flex-grow-1 p-4">
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">All Sections</h2>
            <button class="btn btn-primary-custom" @click="openAddModal">Add New Section</button>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <input v-model="searchQuery" type="text" placeholder="Search sections..." class="form-control">
            </div>
            <div class="col-md-6">
              <select v-model="levelFilter" class="form-select">
                <option value="">All Levels</option>
                <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Section Name</th>
                  <th>Level</th>
                  <th>Description</th>
                  <th>Classes Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="section in filteredSections" :key="section.section_id">
                  <td class="fw-medium">{{ section.section_name }}</td>
                  <td>{{ section.level }}</td>
                  <td>{{ section.description || 'No description' }}</td>
                  <td>
                    <span class="badge bg-info">{{ section.class_count || 0 }}</span>
                  </td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2" @click="openEditModal(section)">Edit</button>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteSection(section)">Delete</button>
                  </td>
                </tr>
                <tr v-if="!filteredSections.length">
                  <td colspan="5" class="text-center text-muted py-4">No sections found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section Modal -->
        <div class="modal fade" id="sectionModal" tabindex="-1" aria-labelledby="sectionModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="sectionModalLabel">{{ isEditing ? 'Edit Section' : 'Add New Section' }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div v-if="formMessage" class="alert alert-danger" role="alert">{{ formMessage }}</div>
                <form @submit.prevent="saveSection">
                  <div class="mb-3">
                    <label for="sectionName" class="form-label">Section Name *</label>
                    <input id="sectionName" v-model="sectionForm.section_name" class="form-control" required placeholder="Example: A, Science, Arts" :class="{ 'is-invalid': errors.section_name }">
                    <div class="invalid-feedback" v-if="errors.section_name">{{ errors.section_name }}</div>
                  </div>
                  <div class="mb-3">
                    <label for="sectionLevel" class="form-label">Level *</label>
                    <input id="sectionLevel" v-model="sectionForm.level" class="form-control" required list="levelSuggestions" placeholder="Example: Grade 10, Grade 11" :class="{ 'is-invalid': errors.level }">
                    <datalist id="levelSuggestions">
                      <option v-for="level in levelSuggestions" :key="level" :value="level" />
                    </datalist>
                    <div class="invalid-feedback" v-if="errors.level">{{ errors.level }}</div>
                  </div>
                  <div class="mb-3">
                    <label for="sectionDescription" class="form-label">Description</label>
                    <textarea id="sectionDescription" v-model="sectionForm.description" class="form-control" rows="3" placeholder="Optional description"></textarea>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="saveSection" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </span>
                  <span v-else>{{ isEditing ? 'Update Section' : 'Add Section' }}</span>
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
import { computed, onMounted, ref } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/stores/api'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
  { name: 'Timetable', path: '/timetable', icon: '📅' }
]

const sections = ref([])
const searchQuery = ref('')
const levelFilter = ref('')
const isEditing = ref(false)
const loading = ref(false)
const errors = ref({})
const formMessage = ref('')

const emptySectionForm = () => ({
  section_id: null,
  section_name: '',
  level: '',
  description: ''
})

const sectionForm = ref(emptySectionForm())

const levelOptions = computed(() => uniqueSorted(sections.value.map(section => section.level)))
const levelSuggestions = computed(() => uniqueSorted(['Grade 10', 'Grade 11', 'Grade 12', ...sections.value.map(section => section.level)]))

const filteredSections = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return sections.value.filter(section => {
    const matchesSearch = !query ||
      section.section_name?.toLowerCase().includes(query) ||
      section.level?.toLowerCase().includes(query) ||
      section.description?.toLowerCase().includes(query)
    const matchesLevel = !levelFilter.value || section.level === levelFilter.value

    return matchesSearch && matchesLevel
  })
})

const uniqueSorted = (items) => {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

const openAddModal = () => {
  isEditing.value = false
  sectionForm.value = emptySectionForm()
  errors.value = {}
  formMessage.value = ''
  Modal.getOrCreateInstance(document.getElementById('sectionModal')).show()
}

const openEditModal = (section) => {
  isEditing.value = true
  sectionForm.value = {
    section_id: section.section_id,
    section_name: section.section_name || '',
    level: section.level || '',
    description: section.description || ''
  }
  errors.value = {}
  formMessage.value = ''
  Modal.getOrCreateInstance(document.getElementById('sectionModal')).show()
}

const validateForm = () => {
  errors.value = {}
  formMessage.value = ''

  const trimmedSectionName = sectionForm.value.section_name.trim()
  if (!trimmedSectionName) errors.value.section_name = 'Section name is required'
  if (!sectionForm.value.level.trim()) errors.value.level = 'Level is required'

  const duplicateSection = sections.value.find((section) => {
    return section.section_name?.trim().toLowerCase() === trimmedSectionName.toLowerCase() &&
      section.level?.trim().toLowerCase() === sectionForm.value.level.trim().toLowerCase() &&
      (!isEditing.value || section.section_id !== sectionForm.value.section_id)
  })

  if (duplicateSection) {
    errors.value.section_name = 'A section with this name and level already exists'
  }

  return Object.keys(errors.value).length === 0
}

const buildPayload = () => ({
  section_name: sectionForm.value.section_name.trim(),
  level: sectionForm.value.level.trim(),
  description: sectionForm.value.description?.trim() || null
})

const saveSection = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const payload = buildPayload()
    const response = isEditing.value
      ? await api.put(`/sections/${sectionForm.value.section_id}`, payload)
      : await api.post('/sections', payload)
    const savedSection = response.data.section

    if (isEditing.value) {
      const index = sections.value.findIndex(section => section.section_id === savedSection.section_id)
      if (index !== -1) sections.value.splice(index, 1, savedSection)
    } else {
      sections.value.unshift(savedSection)
    }

    Modal.getOrCreateInstance(document.getElementById('sectionModal')).hide()
    showToast(isEditing.value ? 'Section updated successfully!' : 'Section added successfully!', 'success')
  } catch (error) {
    if (error.response?.data?.errors?.length) {
      errors.value = error.response.data.errors.reduce((fieldErrors, item) => {
        if (item.path) fieldErrors[item.path] = item.msg
        return fieldErrors
      }, {})
      formMessage.value = 'Please correct the highlighted fields.'
    } else {
      formMessage.value = error.response?.data?.message || 'Failed to save section.'
    }
  } finally {
    loading.value = false
  }
}

const deleteSection = async (section) => {
  if (!confirm(`Delete section "${section.section_name}" (${section.level})? This action cannot be undone.`)) return

  try {
    await api.delete(`/sections/${section.section_id}`)
    sections.value = sections.value.filter(item => item.section_id !== section.section_id)
    showToast('Section deleted successfully!', 'success')
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete section.', 'danger')
  }
}

const showToast = (message, type) => {
  const toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
  toastContainer.innerHTML = `
    <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `
  document.body.appendChild(toastContainer)
  const toast = new Toast(toastContainer.querySelector('.toast'))
  toast.show()
  setTimeout(() => document.body.removeChild(toastContainer), 5000)
}

const loadData = async () => {
  try {
    const response = await api.get('/sections/with-count')
    sections.value = response.data.sections || []
  } catch (error) {
    console.error('Failed to load sections:', error)
    showToast('Failed to load sections.', 'danger')
  }
}

onMounted(() => {
  loadData()
})
</script>

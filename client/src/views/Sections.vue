<template>
  <AppLayout>
    <div class="sections-container">
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h3 fw-semibold text-dark">All Sections</h2>
          <button class="btn-primary" @click="openAddModal">Add New Section</button>
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
          <table class="table-custom">
            <thead>
              <tr>
                <th>Level</th>
                <th>Sections</th>
                <th>Description</th>
                <th>Classes Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in filteredSectionGroups" :key="group.level">
                <td class="fw-medium level-cell">{{ group.level }}</td>
                <td>
                  <div class="section-list">
                    <span v-for="section in group.sections" :key="section.section_id" class="section-chip">
                      {{ section.section_name }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="description-list">
                    <span v-for="section in group.sections" :key="section.section_id">
                      <strong>{{ section.section_name }}:</strong> {{ section.description || 'No description' }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="badge">{{ group.class_count }}</span>
                </td>
                <td>
                  <div class="section-actions">
                    <div v-for="section in group.sections" :key="section.section_id" class="section-action-row">
                      <span>{{ section.section_name }}</span>
                      <button class="btn-edit" @click="openEditModal(section)">Edit</button>
                      <button class="btn-delete" @click="deleteSection(section)">Delete</button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredSectionGroups.length">
                <td colspan="5" class="text-center py-4">No sections found</td>
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
              <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn-primary" @click="saveSection" :disabled="loading">
                <span v-if="loading">Saving...</span>
                <span v-else>{{ isEditing ? 'Update Section' : 'Add Section' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

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

const filteredSectionGroups = computed(() => {
  const groups = new Map()

  filteredSections.value.forEach((section) => {
    const level = section.level || 'No Level'
    if (!groups.has(level)) {
      groups.set(level, {
        level,
        sections: [],
        class_count: 0
      })
    }

    const group = groups.get(level)
    group.sections.push(section)
    group.class_count += Number(section.class_count || 0)
  })

  return [...groups.values()].map((group) => ({
    ...group,
    sections: group.sections.sort((a, b) => String(a.section_name).localeCompare(String(b.section_name)))
  }))
}
)

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

    Modal.getOrCreateInstance(document.getElementById('sectionModal')).hide()
    await loadData()
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
    <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
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

<style scoped>
.sections-container {
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

.level-cell {
  color: #0f172a;
  font-size: 0.95rem;
}

.section-list,
.description-list,
.section-actions {
  display: grid;
  gap: 0.45rem;
}

.section-chip {
  width: fit-content;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.22rem 0.55rem;
}

.description-list span {
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.35;
}

.description-list strong {
  color: #0f172a;
}

.section-action-row {
  display: grid;
  grid-template-columns: minmax(4rem, 1fr) auto auto;
  gap: 0.45rem;
  align-items: center;
}

.section-action-row span {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
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

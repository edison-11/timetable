<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">C</div>
          <h1 class="h2 mb-0">Classes Management</h1>
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
            <h2 class="h3 fw-semibold text-dark">All Classes</h2>
            <button class="btn btn-primary-custom" @click="openAddModal">Add New Class</button>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <input v-model="searchQuery" type="text" placeholder="Search classes..." class="form-control">
            </div>
            <div class="col-md-3">
              <select v-model="levelFilter" class="form-select">
                <option value="">All Levels</option>
                <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <select v-model="academicYearFilter" class="form-select">
                <option value="">All Academic Years</option>
                <option v-for="year in academicYearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select v-model="teacherDepartmentFilter" class="form-select">
                <option value="">All Departments</option>
                <option v-for="department in teacherDepartments" :key="department" :value="department">{{ department }}</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Level</th>
                  <th>Academic Year</th>
                  <th>Class Teacher</th>
                  <th>Teacher Dept.</th>
                  <th>Shift</th>
                  <th>Section</th>
                  <th>DOS</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="classItem in filteredClasses" :key="classItem.class_id">
                  <td class="fw-medium">{{ classItem.class_name }}</td>
                  <td>{{ classItem.level }}</td>
                  <td>{{ classItem.academic_year }}</td>
                  <td>{{ classItem.class_teacher_name || 'Not assigned' }}</td>
                  <td>
                    <span v-if="classItem.class_teacher_department" class="badge bg-primary">{{ classItem.class_teacher_department }}</span>
                    <span v-else class="text-muted">N/A</span>
                  </td>
                  <td>{{ classItem.shift_name || 'No shift' }}</td>
                  <td>{{ classItem.section_name || 'No section' }}</td>
                  <td>{{ classItem.dos_name || 'No DOS' }}</td>
                  <td>
                    <button class="btn btn-warning-custom btn-sm me-2" @click="openEditModal(classItem)">Edit</button>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteClass(classItem)">Delete</button>
                  </td>
                </tr>
                <tr v-if="!filteredClasses.length">
                  <td colspan="9" class="text-center text-muted py-4">No classes found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal fade" id="classModal" tabindex="-1" aria-labelledby="classModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="classModalLabel">{{ isEditing ? 'Edit Class' : 'Add New Class' }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div v-if="formMessage" class="alert alert-danger" role="alert">{{ formMessage }}</div>
                <form @submit.prevent="saveClass">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="className" class="form-label">Class Name *</label>
                      <input id="className" v-model="classForm.class_name" class="form-control" required placeholder="Example: 10A" :class="{ 'is-invalid': errors.class_name }">
                      <div class="invalid-feedback" v-if="errors.class_name">{{ errors.class_name }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="classLevel" class="form-label">Level *</label>
                      <input id="classLevel" v-model="classForm.level" class="form-control" required list="levelSuggestions" placeholder="Example: Grade 10" :class="{ 'is-invalid': errors.level }">
                      <datalist id="levelSuggestions">
                        <option v-for="level in levelSuggestions" :key="level" :value="level" />
                      </datalist>
                      <div class="invalid-feedback" v-if="errors.level">{{ errors.level }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="academicYear" class="form-label">Academic Year *</label>
                      <input id="academicYear" v-model="classForm.academic_year" class="form-control" required placeholder="2024-2025" :class="{ 'is-invalid': errors.academic_year }">
                      <div class="invalid-feedback" v-if="errors.academic_year">{{ errors.academic_year }}</div>
                    </div>
                    <div class="col-md-6">
                      <label for="classTeacherDepartment" class="form-label">Teacher Department</label>
                      <select id="classTeacherDepartment" v-model="classTeacherDepartment" class="form-select">
                        <option value="">All departments</option>
                        <option v-for="department in teacherDepartments" :key="department" :value="department">{{ department }}</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="classTeacher" class="form-label">Class Teacher</label>
                      <select id="classTeacher" v-model.number="classForm.class_teacher_id" class="form-select">
                        <option value="">No class teacher</option>
                        <option v-for="teacher in filteredTeacherOptions" :key="teacher.teacher_id" :value="teacher.teacher_id">
                          {{ teacher.name }} - {{ teacher.department || 'SSOD' }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="classShift" class="form-label">Shift</label>
                      <select id="classShift" v-model.number="classForm.shift_id" class="form-select">
                        <option value="">No shift</option>
                        <option v-for="shift in shifts" :key="shift.shift_id" :value="shift.shift_id">{{ shift.shift_name }}</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="classSection" class="form-label">Section</label>
                      <select id="classSection" v-model.number="classForm.section_id" class="form-select">
                        <option value="">No section</option>
                        <option v-for="section in sections" :key="section.section_id" :value="section.section_id">
                          {{ section.section_name }} - {{ section.level }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="classDos" class="form-label">Director of Studies</label>
                      <select id="classDos" v-model.number="classForm.dos_id" class="form-select">
                        <option value="">No DOS</option>
                        <option v-for="dosItem in dosList" :key="dosItem.dos_id" :value="dosItem.dos_id">{{ dosItem.name }}</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary-custom" @click="saveClass" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </span>
                  <span v-else>{{ isEditing ? 'Update Class' : 'Add Class' }}</span>
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
import { computed, onMounted, ref, watch } from 'vue'
import { Modal, Toast } from 'bootstrap'
import api from '@/stores/api'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: 'D' },
  { name: 'Teachers', path: '/teachers', icon: 'T' },
  { name: 'Modules', path: '/modules', icon: 'M' },
  { name: 'Classes', path: '/classes', icon: 'C' },
  { name: 'Sections', path: '/sections', icon: 'S' },
  { name: 'Rooms', path: '/rooms', icon: 'R' },
  { name: 'Shifts', path: '/shifts', icon: 'H' },
  { name: 'Assignments', path: '/assignments', icon: 'A' },
  { name: 'Bus Routes', path: '/bus-routes', icon: 'BR' },
  { name: 'Timetable', path: '/timetable', icon: 'TT' }
]

const classes = ref([])
const teachers = ref([])
const shifts = ref([])
const sections = ref([])
const dosList = ref([])
const searchQuery = ref('')
const levelFilter = ref('')
const academicYearFilter = ref('')
const teacherDepartmentFilter = ref('')
const classTeacherDepartment = ref('')
const isEditing = ref(false)
const loading = ref(false)
const errors = ref({})
const formMessage = ref('')

const emptyClassForm = () => ({
  class_id: null,
  class_name: '',
  level: '',
  academic_year: '2024-2025',
  class_teacher_id: '',
  shift_id: '',
  dos_id: '',
  section_id: ''
})

const classForm = ref(emptyClassForm())

const levelOptions = computed(() => uniqueSorted(classes.value.map(classItem => classItem.level)))
const academicYearOptions = computed(() => uniqueSorted(classes.value.map(classItem => classItem.academic_year)))
const teacherDepartments = computed(() => uniqueSorted(teachers.value.map(teacher => teacher.department || 'SSOD')))
const levelSuggestions = computed(() => uniqueSorted(['Grade 10', 'Grade 11', 'Grade 12', ...classes.value.map(classItem => classItem.level)]))

const filteredTeacherOptions = computed(() => {
  if (!classTeacherDepartment.value) return teachers.value
  return teachers.value.filter(teacher => (teacher.department || 'SSOD') === classTeacherDepartment.value)
})

const filteredClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return classes.value.filter(classItem => {
    const teacherDepartment = classItem.class_teacher_department || ''
    const matchesSearch = !query ||
      classItem.class_name?.toLowerCase().includes(query) ||
      classItem.level?.toLowerCase().includes(query) ||
      classItem.academic_year?.toLowerCase().includes(query) ||
      classItem.class_teacher_name?.toLowerCase().includes(query) ||
      teacherDepartment.toLowerCase().includes(query) ||
      classItem.shift_name?.toLowerCase().includes(query) ||
      classItem.section_name?.toLowerCase().includes(query) ||
      classItem.dos_name?.toLowerCase().includes(query)
    const matchesLevel = !levelFilter.value || classItem.level === levelFilter.value
    const matchesAcademicYear = !academicYearFilter.value || classItem.academic_year === academicYearFilter.value
    const matchesDepartment = !teacherDepartmentFilter.value || teacherDepartment === teacherDepartmentFilter.value

    return matchesSearch && matchesLevel && matchesAcademicYear && matchesDepartment
  })
})

watch(classTeacherDepartment, () => {
  if (!filteredTeacherOptions.value.some(teacher => teacher.teacher_id === classForm.value.class_teacher_id)) {
    classForm.value.class_teacher_id = ''
  }
})

const uniqueSorted = (items) => {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

const openAddModal = () => {
  isEditing.value = false
  classForm.value = emptyClassForm()
  classTeacherDepartment.value = ''
  errors.value = {}
  formMessage.value = ''
  Modal.getOrCreateInstance(document.getElementById('classModal')).show()
}

const openEditModal = (classItem) => {
  isEditing.value = true
  classForm.value = {
    class_id: classItem.class_id,
    class_name: classItem.class_name || '',
    level: classItem.level || '',
    academic_year: classItem.academic_year || '',
    class_teacher_id: classItem.class_teacher_id || '',
    shift_id: classItem.shift_id || '',
    dos_id: classItem.dos_id || '',
    section_id: classItem.section_id || ''
  }
  classTeacherDepartment.value = classItem.class_teacher_department || ''
  errors.value = {}
  formMessage.value = ''
  Modal.getOrCreateInstance(document.getElementById('classModal')).show()
}

const validateForm = () => {
  errors.value = {}
  formMessage.value = ''

  if (!classForm.value.class_name.trim()) errors.value.class_name = 'Class name is required'
  if (!classForm.value.level.trim()) errors.value.level = 'Level is required'
  if (!classForm.value.academic_year.trim()) errors.value.academic_year = 'Academic year is required'

  return Object.keys(errors.value).length === 0
}

const buildPayload = () => ({
  class_name: classForm.value.class_name.trim(),
  level: classForm.value.level.trim(),
  academic_year: classForm.value.academic_year.trim(),
  class_teacher_id: classForm.value.class_teacher_id || null,
  shift_id: classForm.value.shift_id || null,
  dos_id: classForm.value.dos_id || null,
  section_id: classForm.value.section_id || null
})

const saveClass = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const payload = buildPayload()
    const response = isEditing.value
      ? await api.put(`/classes/${classForm.value.class_id}`, payload)
      : await api.post('/classes', payload)
    const savedClass = response.data.class

    if (isEditing.value) {
      const index = classes.value.findIndex(classItem => classItem.class_id === savedClass.class_id)
      if (index !== -1) classes.value.splice(index, 1, savedClass)
    } else {
      classes.value.unshift(savedClass)
    }

    Modal.getOrCreateInstance(document.getElementById('classModal')).hide()
    showToast(isEditing.value ? 'Class updated successfully!' : 'Class added successfully!', 'success')
  } catch (error) {
    if (error.response?.data?.errors?.length) {
      errors.value = error.response.data.errors.reduce((fieldErrors, item) => {
        if (item.path) fieldErrors[item.path] = item.msg
        return fieldErrors
      }, {})
      formMessage.value = 'Please correct the highlighted fields.'
    } else {
      formMessage.value = error.response?.data?.message || 'Failed to save class.'
    }
  } finally {
    loading.value = false
  }
}

const deleteClass = async (classItem) => {
  if (!confirm(`Delete ${classItem.class_name}? This action cannot be undone.`)) return

  try {
    await api.delete(`/classes/${classItem.class_id}`)
    classes.value = classes.value.filter(item => item.class_id !== classItem.class_id)
    showToast('Class deleted successfully!', 'success')
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete class.', 'danger')
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
  const [classesResponse, teachersResponse, shiftsResponse, sectionsResponse, dosResponse] = await Promise.all([
    api.get('/classes'),
    api.get('/teachers/active'),
    api.get('/shifts'),
    api.get('/sections'),
    api.get('/dos')
  ])

  classes.value = classesResponse.data.classes || []
  teachers.value = teachersResponse.data.teachers || []
  shifts.value = shiftsResponse.data.shifts || []
  sections.value = sectionsResponse.data.sections || []
  dosList.value = dosResponse.data.dos || []
}

onMounted(() => {
  loadData()
})
</script>

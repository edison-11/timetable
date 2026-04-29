<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">A</div>
          <h1 class="h2 mb-0">Assignments Management</h1>
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
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">Add Assignment</h2>
            <button class="btn btn-outline-primary" @click="loadData">Refresh</button>
          </div>

          <div v-if="formMessage" class="alert alert-danger" role="alert">{{ formMessage }}</div>

          <form class="row g-3" @submit.prevent="handleAddAssignment">
            <div class="col-md-4">
              <label for="teacherDepartment" class="form-label">Teacher Department</label>
              <select id="teacherDepartment" v-model="selectedDepartment" class="form-select">
                <option value="">All departments</option>
                <option v-for="department in teacherDepartments" :key="department" :value="department">
                  {{ department }}
                </option>
              </select>
            </div>

            <div class="col-md-4">
              <label for="assignmentTeacher" class="form-label">Teacher *</label>
              <select id="assignmentTeacher" v-model.number="newAssignment.teacher_id" class="form-select" required :class="{ 'is-invalid': errors.teacher_id }">
                <option value="">Select teacher</option>
                <option v-for="teacher in filteredTeachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                  {{ teacher.name }} - {{ teacher.department || 'SSOD' }}
                </option>
              </select>
              <div class="invalid-feedback" v-if="errors.teacher_id">{{ errors.teacher_id }}</div>
            </div>

            <div class="col-md-4">
              <label for="assignmentModule" class="form-label">Module *</label>
              <select id="assignmentModule" v-model.number="newAssignment.module_id" class="form-select" required :class="{ 'is-invalid': errors.module_id }">
                <option value="">Select module</option>
                <option v-for="module in modules" :key="module.module_id" :value="module.module_id">
                  {{ module.module_name }} - {{ module.department || 'SSOD' }}
                </option>
              </select>
              <div class="invalid-feedback" v-if="errors.module_id">{{ errors.module_id }}</div>
            </div>

            <div class="col-md-4">
              <label for="assignmentClass" class="form-label">Class *</label>
              <select id="assignmentClass" v-model.number="newAssignment.class_id" class="form-select" required :class="{ 'is-invalid': errors.class_id }">
                <option value="">Select class</option>
                <option v-for="classItem in classes" :key="classItem.class_id" :value="classItem.class_id">
                  {{ classItem.class_name }} - {{ classItem.level }}
                </option>
              </select>
              <div class="invalid-feedback" v-if="errors.class_id">{{ errors.class_id }}</div>
            </div>

            <div class="col-md-4">
              <label for="academicYear" class="form-label">Academic Year *</label>
              <input id="academicYear" v-model="newAssignment.academic_year" class="form-control" required placeholder="2024-2025" :class="{ 'is-invalid': errors.academic_year }">
              <div class="invalid-feedback" v-if="errors.academic_year">{{ errors.academic_year }}</div>
            </div>

            <div class="col-md-4">
              <label for="assignmentTerm" class="form-label">Term *</label>
              <select id="assignmentTerm" v-model="newAssignment.term" class="form-select" required :class="{ 'is-invalid': errors.term }">
                <option value="">Select term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <div class="invalid-feedback" v-if="errors.term">{{ errors.term }}</div>
            </div>

            <div class="col-12">
              <button class="btn btn-primary-custom" type="submit" :disabled="loading">
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </span>
                <span v-else>Add Assignment</span>
              </button>
            </div>
          </form>
        </div>

        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark">All Assignments</h2>
            <input v-model="assignmentSearch" class="form-control" style="max-width: 320px;" placeholder="Search assignments...">
          </div>

          <div class="table-responsive">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th>Module</th>
                  <th>Class</th>
                  <th>Academic Year</th>
                  <th>Term</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in filteredAssignments" :key="assignment.assignment_id">
                  <td>{{ assignment.teacher_name }}</td>
                  <td><span class="badge bg-primary">{{ assignment.teacher_department || 'SSOD' }}</span></td>
                  <td>{{ assignment.module_name }}</td>
                  <td>{{ assignment.class_name }}</td>
                  <td>{{ assignment.academic_year }}</td>
                  <td>{{ assignment.term }}</td>
                  <td>
                    <button class="btn btn-danger-custom btn-sm" @click="deleteAssignment(assignment)">Delete</button>
                  </td>
                </tr>
                <tr v-if="!filteredAssignments.length">
                  <td colspan="7" class="text-center text-muted py-4">No assignments found</td>
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
import { computed, onMounted, ref, watch } from 'vue'
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

const teachers = ref([])
const modules = ref([])
const classes = ref([])
const assignments = ref([])
const selectedDepartment = ref('')
const assignmentSearch = ref('')
const loading = ref(false)
const errors = ref({})
const formMessage = ref('')

const newAssignment = ref({
  teacher_id: '',
  module_id: '',
  class_id: '',
  academic_year: '2024-2025',
  term: ''
})

const teacherDepartments = computed(() => {
  const departments = teachers.value.map(teacher => teacher.department || 'SSOD')
  return [...new Set(departments)].sort((a, b) => a.localeCompare(b))
})

const filteredTeachers = computed(() => {
  if (!selectedDepartment.value) return teachers.value
  return teachers.value.filter(teacher => (teacher.department || 'SSOD') === selectedDepartment.value)
})

const filteredAssignments = computed(() => {
  const query = assignmentSearch.value.trim().toLowerCase()
  return assignments.value.filter(assignment => {
    const department = assignment.teacher_department || 'SSOD'
    return !query ||
      assignment.teacher_name?.toLowerCase().includes(query) ||
      department.toLowerCase().includes(query) ||
      assignment.module_name?.toLowerCase().includes(query) ||
      assignment.class_name?.toLowerCase().includes(query) ||
      assignment.academic_year?.toLowerCase().includes(query) ||
      assignment.term?.toLowerCase().includes(query)
  })
})

watch(selectedDepartment, () => {
  if (!filteredTeachers.value.some(teacher => teacher.teacher_id === newAssignment.value.teacher_id)) {
    newAssignment.value.teacher_id = ''
  }
})

const validateForm = () => {
  errors.value = {}
  formMessage.value = ''

  if (!newAssignment.value.teacher_id) errors.value.teacher_id = 'Teacher is required'
  if (!newAssignment.value.module_id) errors.value.module_id = 'Module is required'
  if (!newAssignment.value.class_id) errors.value.class_id = 'Class is required'
  if (!newAssignment.value.academic_year.trim()) errors.value.academic_year = 'Academic year is required'
  if (!newAssignment.value.term.trim()) errors.value.term = 'Term is required'

  return Object.keys(errors.value).length === 0
}

const handleAddAssignment = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const response = await api.post('/assignments', newAssignment.value)
    if (response.data.assignment) {
      assignments.value.unshift(response.data.assignment)
      newAssignment.value = {
        teacher_id: '',
        module_id: '',
        class_id: '',
        academic_year: newAssignment.value.academic_year,
        term: ''
      }
      alert('Assignment added successfully!')
    }
  } catch (error) {
    if (error.response?.data?.errors?.length) {
      errors.value = error.response.data.errors.reduce((fieldErrors, item) => {
        if (item.path) fieldErrors[item.path] = item.msg
        return fieldErrors
      }, {})
      formMessage.value = 'Please correct the highlighted fields.'
    } else {
      formMessage.value = error.response?.data?.message || 'Failed to add assignment.'
    }
  } finally {
    loading.value = false
  }
}

const deleteAssignment = async (assignment) => {
  if (!confirm(`Delete assignment for ${assignment.teacher_name}?`)) return

  await api.delete(`/assignments/${assignment.assignment_id}`)
  assignments.value = assignments.value.filter(item => item.assignment_id !== assignment.assignment_id)
}

const loadData = async () => {
  const [teachersResponse, modulesResponse, classesResponse, assignmentsResponse] = await Promise.all([
    api.get('/teachers/active'),
    api.get('/modules'),
    api.get('/classes'),
    api.get('/assignments')
  ])

  teachers.value = teachersResponse.data.teachers || []
  modules.value = modulesResponse.data.modules || []
  classes.value = classesResponse.data.classes || []
  assignments.value = assignmentsResponse.data.assignments || []
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <AppLayout>
    <div class="assignments-container">
      <div class="card-custom mb-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h3 fw-semibold text-dark">Assignments</h2>
          <div class="header-actions">
            <button class="btn btn-primary" type="button" @click="openAddModal">Add Assignment</button>
            <button class="btn btn-outline-primary" @click="loadData">Refresh</button>
          </div>
        </div>
      </div>

      <div class="modal fade" id="assignmentModal" tabindex="-1" aria-labelledby="assignmentModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="assignmentModalLabel">Add Assignment</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
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
                      {{ classItem.class_name }} - {{ classItem.level }} - {{ classItem.shift_name || 'No shift' }}
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
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary" type="button" :disabled="loading" @click="handleAddAssignment">
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </span>
                <span v-else>Add Assignment</span>
              </button>
            </div>
          </div>
        </div>
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
                <th>Shift</th>
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
                <td>{{ assignment.shift_name || 'No shift' }}</td>
                <td>{{ assignment.academic_year }}</td>
                <td>{{ assignment.term }}</td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="deleteAssignment(assignment)">Delete</button>
                </td>
              </tr>
              <tr v-if="!filteredAssignments.length">
                <td colspan="8" class="text-center text-muted py-4">No assignments found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const teachers = ref([])
const modules = ref([])
const classes = ref([])
const assignments = ref([])
const selectedDepartment = ref('')
const commonDepartments = ['Business', 'Software Development', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Networking', 'Accounting', 'Finance', 'Marketing', 'Management', 'Hospitality', 'Tourism', 'Construction', 'Mechanical', 'Automotive', 'Agriculture', 'General Studies']
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

const resetAssignmentForm = () => {
  newAssignment.value = {
    teacher_id: '',
    module_id: '',
    class_id: '',
    academic_year: newAssignment.value.academic_year || '2024-2025',
    term: ''
  }
  selectedDepartment.value = ''
  formMessage.value = ''
  errors.value = {}
}

const openAddModal = () => {
  resetAssignmentForm()
  Modal.getOrCreateInstance(document.getElementById('assignmentModal')).show()
}

const teacherDepartments = computed(() => {
  const departments = teachers.value.map(teacher => teacher.department || 'SSOD')
  return [...new Set([...commonDepartments, ...departments])].sort((a, b) => a.localeCompare(b))
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
      assignment.shift_name?.toLowerCase().includes(query) ||
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
      formMessage.value = ''
      errors.value = {}
      Modal.getOrCreateInstance(document.getElementById('assignmentModal')).hide()
    }
  } catch (error) {
    if (error.response?.status === 401) {
      formMessage.value = 'Authentication required. Please login again.'
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else if (error.response?.status === 400) {
      if (error.response?.data?.errors?.length) {
        errors.value = error.response.data.errors.reduce((fieldErrors, item) => {
          if (item.path) fieldErrors[item.path] = item.msg
          return fieldErrors
        }, {})
        formMessage.value = 'Please correct the highlighted fields.'
      } else {
        formMessage.value = error.response?.data?.message || 'Validation failed. Please check all fields.'
      }
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

<style scoped>
.assignments-container {
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

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-outline-primary {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
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
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.bg-primary {
  background: #3b82f6;
  color: white;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: block;
}

.form-control, .form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.invalid-feedback {
  color: #ef4444;
  font-size: 0.7rem;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #ef4444;
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
</style>

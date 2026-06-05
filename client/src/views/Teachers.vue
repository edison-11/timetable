<template>
  <AppLayout>
    <div class="teachers-container">
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="h3 fw-semibold text-dark mb-1">All Teachers</h2>
            <p class="teacher-page-subtitle">Review staff, approvals, classes, and assigned modules.</p>
          </div>
          <div class="teacher-toolbar">
            <button class="btn-secondary" type="button" :disabled="!filteredTeachers.length" @click="exportTeachers">
              Export CSV
            </button>
            <button class="btn-primary" data-bs-toggle="modal" data-bs-target="#addTeacherModal">
              Add New Teacher
            </button>
          </div>
        </div>

        <section class="teacher-summary-grid">
          <article>
            <span>Total</span>
            <strong>{{ teacherStats.total }}</strong>
            <small>teachers</small>
          </article>
          <article>
            <span>Active</span>
            <strong>{{ teacherStats.active }}</strong>
            <small>approved</small>
          </article>
          <article>
            <span>Pending</span>
            <strong>{{ teacherStats.pending }}</strong>
            <small>need review</small>
          </article>
          <article>
            <span>Assigned</span>
            <strong>{{ teacherStats.withModules }}</strong>
            <small>with modules</small>
          </article>
          <article>
            <span>No Load</span>
            <strong>{{ teacherStats.unassigned }}</strong>
            <small>no modules</small>
          </article>
        </section>

        <div class="quick-filter-row">
          <button
            v-for="filter in quickFilters"
            :key="filter.value"
            type="button"
            :class="{ active: quickFilter === filter.value }"
            @click="quickFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search name, email, class, module..."
              class="form-control"
            />
          </div>
          <div class="col-md-3">
            <select v-model="departmentFilter" class="form-select">
              <option value="">All Departments</option>
              <option v-for="department in departmentOptions" :key="department" :value="department">
                {{ department }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="statusFilter" class="form-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="sortMode" class="form-select">
              <option value="newest">Newest first</option>
              <option value="name">Name A-Z</option>
              <option value="status">Status</option>
              <option value="modules">Most modules</option>
              <option value="classes">Most classes</option>
            </select>
          </div>
        </div>

        <!-- Teachers Table -->
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Department</th>
                <th>Classes</th>
                <th>Modules</th>
                <th>Status</th>
                <th>Classes</th>
                <th>Modules</th>
                <th>Date Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="teacher in filteredTeachers" :key="teacher.teacher_id">
                <td>
                  <div class="teacher-cell">
                    <strong>{{ teacher.name }}</strong>
                    <small>{{ teacher.email }}</small>
                  </div>
                </td>
                <td>
                  <span class="badge">{{ teacher.department || 'SSOD' }}</span>
                </td>
                <td>
                  <span class="muted-list">{{ teacher.teaching_classes || teacher.head_teacher_classes || 'Not assigned' }}</span>
                </td>
                <td>
                  <span class="muted-list">{{ teacher.assigned_modules || teacher.module_name || 'Not assigned' }}</span>
                </td>
                <td>
                  <span :class="getStatusClass(teacher.status)" class="status-badge">
                    {{ getStatusLabel(teacher.status) }}
                  </span>
                </td>
                <td>
                  <div class="compact-list-cell">
                    <strong>{{ splitList(teacher.teaching_classes || teacher.head_teacher_classes).length }}</strong>
                    <small>{{ shortList(teacher.teaching_classes || teacher.head_teacher_classes, 'No classes') }}</small>
                  </div>
                </td>
                <td>
                  <div class="compact-list-cell">
                    <strong>{{ splitList(teacher.assigned_modules).length }}</strong>
                    <small>{{ shortList(teacher.assigned_modules, 'No modules') }}</small>
                  </div>
                </td>
                <td>{{ formatDate(teacher.date_joined) }}</td>
                <td>
                  <template v-if="teacher.status === 'pending'">
                    <button class="btn-details me-2" @click="openDetailsModal(teacher)">View</button>
                    <button
                      class="btn-approve me-2"
                      @click="approveTeacher(teacher)"
                      :disabled="approvalLoadingId === teacher.teacher_id"
                    >
                      {{ approvalLoadingId === teacher.teacher_id ? 'Saving...' : 'Approve' }}
                    </button>
                    <button
                      class="btn-delete"
                      @click="rejectTeacher(teacher)"
                      :disabled="approvalLoadingId === teacher.teacher_id"
                    >
                      Reject
                    </button>
                  </template>
                  <template v-else>
                    <button class="btn-details me-2" @click="openDetailsModal(teacher)">View</button>
                    <button class="btn-edit me-2" @click="openEditModal(teacher)">Edit</button>
                    <button class="btn-delete" @click="deleteTeacher(teacher)">Del</button>
                  </template>
                </td>
              </tr>
              <tr v-if="!filteredTeachers.length">
                <td colspan="7" class="text-center py-4">No teachers found</td>
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
                    <div class="password-wrap">
                      <input
                        :type="showNewTeacherPassword ? 'text' : 'password'"
                        class="form-control"
                        id="teacherPassword"
                        v-model="newTeacher.password"
                        required
                        autocomplete="new-password"
                        placeholder="Minimum 6 characters"
                      >
                      <button type="button" :aria-label="showNewTeacherPassword ? 'Hide password' : 'Show password'" @click="showNewTeacherPassword = !showNewTeacherPassword">
                        <EyeOff v-if="showNewTeacherPassword" :size="17" :stroke-width="2.2" aria-hidden="true" />
                        <Eye v-else :size="17" :stroke-width="2.2" aria-hidden="true" />
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
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
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
              <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn-primary" @click="handleAddTeacher" :disabled="loading">
                <span v-if="loading">Adding...</span>
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
                    <label for="editTeacherPassword" class="form-label">Reset Password (leave blank to keep current)</label>
                    <div class="password-wrap">
                      <input
                        :type="showEditTeacherPassword ? 'text' : 'password'"
                        class="form-control"
                        id="editTeacherPassword"
                        v-model="editingTeacher.password"
                        autocomplete="new-password"
                        placeholder="Enter new password or leave blank"
                      >
                      <button type="button" :aria-label="showEditTeacherPassword ? 'Hide password' : 'Show password'" @click="showEditTeacherPassword = !showEditTeacherPassword">
                        <EyeOff v-if="showEditTeacherPassword" :size="17" :stroke-width="2.2" aria-hidden="true" />
                        <Eye v-else :size="17" :stroke-width="2.2" aria-hidden="true" />
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
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn-primary" :disabled="editLoading" @click="handleUpdateTeacher">
                    <span v-if="editLoading">Updating...</span>
                    <span v-else>Update Teacher</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="teacherDetailsModal" tabindex="-1" aria-labelledby="teacherDetailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="teacherDetailsModalLabel">Teacher Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="selectedTeacher" class="details-grid">
                <div><span>Name</span><strong>{{ selectedTeacher.name }}</strong></div>
                <div><span>Email</span><strong>{{ selectedTeacher.email }}</strong></div>
                <div><span>Phone</span><strong>{{ selectedTeacher.phone || 'Not set' }}</strong></div>
                <div><span>Department</span><strong>{{ selectedTeacher.department || 'SSOD' }}</strong></div>
                <div><span>Classes</span><strong>{{ selectedTeacher.teaching_classes || selectedTeacher.head_teacher_classes || 'Not assigned' }}</strong></div>
                <div><span>Modules</span><strong>{{ selectedTeacher.assigned_modules || selectedTeacher.module_name || 'Not assigned' }}</strong></div>
                <div><span>Qualification</span><strong>{{ selectedTeacher.qualification || 'Not set' }}</strong></div>
                <div><span>National/Staff ID</span><strong>{{ selectedTeacher.national_id || selectedTeacher.employee_id || 'Not set' }}</strong></div>
                <div><span>Status</span><strong>{{ getStatusLabel(selectedTeacher.status) }}</strong></div>
                <div><span>Date Joined</span><strong>{{ formatDate(selectedTeacher.date_joined) }}</strong></div>
                <div><span>Classes</span><strong>{{ selectedTeacher.teaching_classes || selectedTeacher.head_teacher_classes || 'No classes assigned' }}</strong></div>
                <div><span>Modules</span><strong>{{ selectedTeacher.assigned_modules || 'No modules assigned' }}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        v-model="teacherDialog.open"
        :title="teacherDialog.mode === 'reject' ? 'Reject Registration' : 'Delete Teacher'"
        :description="teacherDialog.mode === 'reject'
          ? `Reject ${teacherDialog.teacher?.name || 'this teacher'}'s registration request?`
          : `Delete ${teacherDialog.teacher?.name || 'this teacher'}? This action cannot be undone.`"
        :confirm-label="teacherDialog.mode === 'reject' ? 'Reject' : 'Delete'"
        cancel-label="Cancel"
        :loading-label="teacherDialog.mode === 'reject' ? 'Rejecting...' : 'Deleting...'"
        :loading="teacherDialog.loading"
        danger
        @confirm="confirmTeacherAction"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import api from '@/stores/api'
import { Modal, Toast } from 'bootstrap'
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const teachers = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const departmentFilter = ref('')
const quickFilter = ref('all')
const sortMode = ref('newest')
const commonDepartments = ['Business', 'Software Development', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Networking', 'Accounting', 'Finance', 'Marketing', 'Management', 'Hospitality', 'Tourism', 'Construction', 'Mechanical', 'Automotive', 'Agriculture', 'General Studies']

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
const approvalLoadingId = ref(null)
const teacherDialog = ref({ open: false, teacher: null, mode: 'delete', loading: false })
const selectedTeacher = ref(null)
const errors = ref({})
const showNewTeacherPassword = ref(false)
const showEditTeacherPassword = ref(false)
const quickFilters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'No Modules', value: 'unassigned' },
  { label: 'On Leave', value: 'on_leave' }
]

const splitList = (value) => String(value || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)

const shortList = (value, fallback = 'None') => {
  const items = splitList(value)
  if (!items.length) return fallback
  if (items.length <= 2) return items.join(', ')
  return `${items.slice(0, 2).join(', ')} +${items.length - 2}`
}

const teacherStats = computed(() => {
  const total = teachers.value.length
  const active = teachers.value.filter(teacher => teacher.status === 'active').length
  const pending = teachers.value.filter(teacher => teacher.status === 'pending').length
  const withModules = teachers.value.filter(teacher => splitList(teacher.assigned_modules).length > 0).length
  return {
    total,
    active,
    pending,
    withModules,
    unassigned: total - withModules
  }
})

const filteredTeachers = computed(() => {
  const filtered = teachers.value.filter(teacher => {
    const department = teacher.department || 'SSOD'
    const query = searchQuery.value.toLowerCase()
    const searchable = [
      teacher.name,
      teacher.email,
      department,
      teacher.teaching_classes,
      teacher.head_teacher_classes,
      teacher.assigned_modules,
      teacher.module_name
    ].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = searchable.includes(query)
    const matchesStatus = !statusFilter.value || teacher.status === statusFilter.value
    const matchesDepartment = !departmentFilter.value || department === departmentFilter.value
    const matchesQuickFilter =
      quickFilter.value === 'all'
      || teacher.status === quickFilter.value
      || (quickFilter.value === 'unassigned' && !splitList(teacher.assigned_modules).length)
    return matchesSearch && matchesStatus && matchesDepartment && matchesQuickFilter
  })

  return filtered.sort((a, b) => {
    if (sortMode.value === 'name') {
      return String(a.name || '').localeCompare(String(b.name || ''))
    }
    if (sortMode.value === 'status') {
      return String(a.status || '').localeCompare(String(b.status || ''))
    }
    if (sortMode.value === 'modules') {
      return splitList(b.assigned_modules).length - splitList(a.assigned_modules).length
    }
    if (sortMode.value === 'classes') {
      return splitList(b.teaching_classes || b.head_teacher_classes).length - splitList(a.teaching_classes || a.head_teacher_classes).length
    }
    return new Date(b.created_at || b.date_joined || 0) - new Date(a.created_at || a.date_joined || 0)
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
    case 'rejected': return 'status-inactive'
    case 'inactive': return 'status-inactive'
    case 'on_leave': return 'status-pending'
    default: return 'status-pending'
  }
}

const getStatusLabel = (status) => {
  if (status === 'active') return 'Approved'
  if (status === 'pending') return 'Pending'
  if (status === 'rejected') return 'Rejected'
  if (status === 'on_leave') return 'On Leave'
  return status || 'Unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const csvEscape = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const exportTeachers = () => {
  const headers = ['Name', 'Email', 'Department', 'Status', 'Classes', 'Modules', 'Date Joined']
  const rows = filteredTeachers.value.map((teacher) => ({
    Name: teacher.name,
    Email: teacher.email,
    Department: teacher.department || 'SSOD',
    Status: getStatusLabel(teacher.status),
    Classes: teacher.teaching_classes || teacher.head_teacher_classes || '',
    Modules: teacher.assigned_modules || '',
    'Date Joined': formatDate(teacher.date_joined)
  }))
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
  if (!validateForm()) return
  
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
      await loadTeachers()
      newTeacher.value = {
        name: '',
        email: '',
        department: '',
        password: '',
        status: 'active',
        date_joined: new Date().toISOString().split('T')[0]
      }
      const modal = document.getElementById('addTeacherModal')
      const bootstrapModal = Modal.getInstance(modal)
      bootstrapModal.hide()
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

const openAddModal = () => {
  errors.value = {}
  const modal = document.getElementById('addTeacherModal')
  Modal.getOrCreateInstance(modal).show()
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
  setTimeout(() => document.body.removeChild(toastContainer), 5000)
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
  setTimeout(() => document.body.removeChild(toastContainer), 5000)
}

const openEditModal = (teacher) => {
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
  const modal = new Modal(document.getElementById('editTeacherModal'))
  modal.show()
}

const validateEditForm = () => {
  editErrors.value = {}
  
  if (!editingTeacher.value.name.trim()) {
    editErrors.value.name = 'Name is required'
  }
  
  if (!editingTeacher.value.email.trim()) {
    editErrors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingTeacher.value.email)) {
    editErrors.value.email = 'Please enter a valid email address'
  }

  if (!editingTeacher.value.department.trim()) {
    editErrors.value.department = 'Department is required'
  }
  
  if (editingTeacher.value.password && editingTeacher.value.password.length < 6) {
    editErrors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(editErrors.value).length === 0
}

const handleUpdateTeacher = async (event) => {
  if (event && event.type === 'click') {
    event.preventDefault()
  }
  
  if (!validateEditForm()) return
  
  editLoading.value = true
  editErrors.value = {}
  
  try {
    const updateData = {
      name: editingTeacher.value.name,
      email: editingTeacher.value.email,
      department: editingTeacher.value.department.trim(),
      status: editingTeacher.value.status
    }
    
    if (editingTeacher.value.password) {
      updateData.password = editingTeacher.value.password
    }
    
    const response = await api.put(`/teachers/${editingTeacher.value.teacher_id}`, updateData)
    
    if (response.data.teacher) {
      await loadTeachers()
      const modal = Modal.getInstance(document.getElementById('editTeacherModal'))
      modal.hide()
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
    console.error('Error updating teacher:', error)
    if (error.response?.data?.message) {
      editErrors.value.email = error.response.data.message
    } else {
      showErrorMessage('Failed to update teacher. Please try again.')
    }
  } finally {
    editLoading.value = false
  }
}

const deleteTeacher = async (teacher) => {
  teacherDialog.value = { open: true, teacher, mode: 'delete', loading: false }
}

const openDetailsModal = (teacher) => {
  selectedTeacher.value = teacher
  Modal.getOrCreateInstance(document.getElementById('teacherDetailsModal')).show()
}

const rejectTeacher = async (teacher) => {
  teacherDialog.value = { open: true, teacher, mode: 'reject', loading: false }
}

const confirmTeacherAction = async () => {
  const teacher = teacherDialog.value.teacher
  if (!teacher) return

  teacherDialog.value.loading = true
  try {
    if (teacherDialog.value.mode === 'reject') {
      approvalLoadingId.value = teacher.teacher_id
      await api.delete(`/teachers/${teacher.teacher_id}/reject`)
      showSuccessMessage('Teacher rejected successfully!')
    } else {
      await api.delete(`/teachers/${teacher.teacher_id}`)
      showSuccessMessage('Teacher deleted successfully!')
    }
    await loadTeachers()
    teacherDialog.value = { open: false, teacher: null, mode: 'delete', loading: false }
  } catch (error) {
    console.error('Error updating teacher action:', error)
    showErrorMessage(error.response?.data?.message || 'Failed to complete teacher action.')
  } finally {
    teacherDialog.value.loading = false
    approvalLoadingId.value = null
  }
}

const approveTeacher = async (teacher) => {
  approvalLoadingId.value = teacher.teacher_id

  try {
    await api.put(`/teachers/${teacher.teacher_id}/approve`)
    await loadTeachers()
    showSuccessMessage('Teacher approved successfully!')
  } catch (error) {
    console.error('Error approving teacher:', error)
    showErrorMessage(error.response?.data?.message || 'Failed to approve teacher.')
  } finally {
    approvalLoadingId.value = null
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

const openCreateFromQuery = async () => {
  if (route.query.action === 'add') {
    await nextTick()
    openAddModal()
  }
}

watch(() => [route.query.action, route.query.create], openCreateFromQuery)

onMounted(async () => {
  await loadTeachers()
  await openCreateFromQuery()
})
</script>

<style scoped>
.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrap input {
  padding-right: 2.45rem;
}

.password-wrap button {
  position: absolute;
  right: 0.35rem;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.teachers-container {
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

.teacher-page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
}

.teacher-toolbar {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.teacher-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.teacher-summary-grid article {
  padding: 0.85rem;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fafc;
}

.teacher-summary-grid span,
.teacher-summary-grid strong,
.teacher-summary-grid small {
  display: block;
}

.teacher-summary-grid span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}

.teacher-summary-grid strong {
  color: #0f172a;
  font-size: 1.35rem;
  line-height: 1.1;
  margin-top: 0.25rem;
}

.teacher-summary-grid small {
  color: #64748b;
  font-weight: 700;
  margin-top: 0.15rem;
}

.quick-filter-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.quick-filter-row button {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 850;
  padding: 0.42rem 0.75rem;
}

.quick-filter-row button.active {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1d4ed8;
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

.btn-outline {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.26rem 0.55rem;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-approve {
  background: #22c55e;
  color: white;
  border: none;
  padding: 0.26rem 0.55rem;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.26rem 0.55rem;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-details {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 0.26rem 0.55rem;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-approve {
  background: #22c55e;
  color: white;
  border: none;
  padding: 0.26rem 0.55rem;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-approve:disabled,
.btn-delete:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  min-width: 980px;
  border-collapse: collapse;
  table-layout: fixed;
}

.table-custom th,
.table-custom td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
  overflow: hidden;
}

.table-custom th {
  background: #f8fafc;
  font-weight: 600;
}

.table-custom th:nth-child(1),
.table-custom td:nth-child(1) {
  width: 24%;
}

.table-custom th:nth-child(2),
.table-custom td:nth-child(2) {
  width: 14%;
}

.table-custom th:nth-child(3),
.table-custom td:nth-child(3) {
  width: 10%;
}

.table-custom th:nth-child(4),
.table-custom td:nth-child(4) {
  width: 13%;
}

.table-custom th:nth-child(5),
.table-custom td:nth-child(5) {
  width: 17%;
}

.table-custom th:nth-child(6),
.table-custom td:nth-child(6) {
  width: 10%;
}

.table-custom th:nth-child(7),
.table-custom td:nth-child(7) {
  width: 12%;
}

.teacher-cell {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.teacher-cell strong {
  color: #0f172a;
  font-size: 0.86rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-cell small {
  color: #64748b;
  font-size: 0.68rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-list-cell {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.compact-list-cell strong {
  color: #0f172a;
  font-size: 0.86rem;
}

.compact-list-cell small {
  color: #64748b;
  font-size: 0.68rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted-list {
  display: inline-block;
  max-width: 220px;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
}

.status-active {
  background: #22c55e;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.status-inactive {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.status-pending {
  background: #f59e0b;
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

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.details-grid div {
  padding: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.details-grid span,
.details-grid strong {
  display: block;
}

.details-grid span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.details-grid strong {
  color: #0f172a;
  margin-top: 0.2rem;
}

.text-center {
  text-align: center;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container {
  color: #e5edf7;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .card-custom,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .modal-content {
  border-color: #243244 !important;
  background: #111827 !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container h2,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container h5,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-cell strong,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .compact-list-cell strong,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid strong,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .details-grid strong,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .table-custom th {
  color: #f8fafc !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-page-subtitle,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-cell small,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .compact-list-cell small,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid span,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid small,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .details-grid span,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .table-custom td {
  color: #cbd5e1 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .table-custom th,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .details-grid div {
  border-color: #243244 !important;
  background: #0b1220 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .quick-filter-row button {
  border-color: #334155 !important;
  background: #111827 !important;
  color: #dbeafe !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .quick-filter-row button.active {
  border-color: #60a5fa !important;
  background: #172554 !important;
  color: #bfdbfe !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .table-custom td,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .modal-header,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .modal-footer {
  border-color: #243244 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .form-control,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .form-select {
  border-color: #334155 !important;
  background: #0b1220 !important;
  color: #e5edf7 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .quick-filter-row button,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .details-grid div {
  background: #0b1220 !important;
  border-color: #243244 !important;
  color: #e5edf7 !important;
  box-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid span,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid small,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-page-subtitle,
:global(body:is(.admin-dark-mode, .dark)) .teachers-container .muted-list {
  color: #cbd5e1 !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .teachers-container .teacher-summary-grid strong {
  color: #f8fafc !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

@media (max-width: 900px) {
  .teacher-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .teacher-toolbar {
    justify-content: flex-start;
    margin-top: 0.75rem;
  }
}
</style>

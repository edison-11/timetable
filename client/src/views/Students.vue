<template>
  <AppLayout>
    <div class="students-page">
      <header class="page-header">
        <div>
          <h1>Students</h1>
          <p>Add learners, assign them to classes, and keep parent login details on record.</p>
        </div>
        <div class="header-actions">
          <button class="secondary-btn" type="button" :disabled="!filteredStudents.length" @click="downloadStudentList">
            Download List
          </button>
          <button class="primary-btn" type="button" @click="openCreate">Add Student</button>
        </div>
      </header>

      <div v-if="message" class="notice" :class="messageType">{{ message }}</div>

      <section class="toolbar">
        <input v-model="searchQuery" type="search" placeholder="Search by name, ID, parent, or class">
        <select v-model="classFilter">
          <option value="">All classes</option>
          <option v-for="cls in classes" :key="cls.class_id" :value="String(cls.class_id)">
            {{ cls.class_name }}
          </option>
        </select>
        <button type="button" class="secondary-btn" @click="loadStudents">Refresh</button>
      </section>

      <section class="attendance-panel">
        <div class="attendance-header-row">
          <div>
            <h2>Attendance by Date</h2>
            <p>Select a date to review recorded attendance for all classes or one class.</p>
          </div>
          <button type="button" class="secondary-btn" :disabled="loadingAttendanceRecords" @click="loadAttendanceRecords">
            {{ loadingAttendanceRecords ? 'Loading...' : 'View Attendance' }}
          </button>
        </div>

        <div class="attendance-filters">
          <label>
            <span>Date</span>
            <input v-model="attendanceFilters.date" type="date">
          </label>
          <label>
            <span>Class</span>
            <select v-model="attendanceFilters.class_id">
              <option value="">All classes</option>
              <option v-for="cls in classes" :key="cls.class_id" :value="String(cls.class_id)">
                {{ cls.class_name }}
              </option>
            </select>
          </label>
        </div>

        <div class="attendance-summary-row">
          <span><strong>{{ attendanceRecords.length }}</strong> records</span>
          <span><strong>{{ attendanceCounts.present }}</strong> present</span>
          <span><strong>{{ attendanceCounts.absent }}</strong> absent</span>
          <span><strong>{{ attendanceCounts.late }}</strong> late</span>
          <span><strong>{{ attendanceCounts.excused }}</strong> excused</span>
        </div>

        <div class="attendance-record-table">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Period / Module</th>
                <th>Status</th>
                <th>Teacher</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in attendanceRecords" :key="record.attendance_id">
                <td>
                  <strong>{{ record.student_name || '-' }}</strong>
                  <small>{{ record.student_number || '' }}</small>
                </td>
                <td>{{ record.class_name || '-' }}</td>
                <td>
                  <strong>{{ record.module_name || record.period_label || 'Study period' }}</strong>
                  <small>{{ formatTimeRange(record) }}</small>
                </td>
                <td><span class="attendance-status" :class="record.status">{{ record.status }}</span></td>
                <td>{{ record.teacher_name || '-' }}</td>
                <td>{{ record.notes || '-' }}</td>
              </tr>
              <tr v-if="!attendanceRecords.length">
                <td colspan="6" class="empty-row">
                  {{ loadingAttendanceRecords ? 'Loading attendance...' : 'No attendance recorded for this date.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-panel">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Sex</th>
              <th>Class</th>
              <th>Parent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.student_id">
              <td>
                <strong>{{ student.name }}</strong>
                <small>{{ student.student_number }}</small>
              </td>
              <td>{{ student.sex || '-' }}</td>
              <td>{{ student.class_name || 'Unassigned' }}</td>
              <td>
                <strong>{{ student.parent_name || '-' }}</strong>
                <small>{{ student.parent_email || student.parent_phone || '' }}</small>
              </td>
              <td><span class="status-pill">{{ student.status }}</span></td>
              <td class="actions">
                <button type="button" @click="openAbsences(student)">Absences</button>
                <button type="button" @click="openEdit(student)">Edit</button>
                <button type="button" class="danger" @click="deleteStudent(student)">Delete</button>
              </td>
            </tr>
            <tr v-if="!filteredStudents.length">
              <td colspan="6" class="empty-row">{{ loading ? 'Loading students...' : 'No students found' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <form class="student-form" @submit.prevent="saveStudent">
          <div class="form-header">
            <h2>{{ editingStudentId ? 'Edit Student' : 'Add Student' }}</h2>
            <button type="button" class="secondary-btn" @click="closeModal">Cancel</button>
          </div>

          <div class="form-grid">
            <label>
              <span>Student ID *</span>
              <input v-model="form.student_number" required>
            </label>
            <label>
              <span>Name *</span>
              <input v-model="form.name" required>
            </label>
            <label>
              <span>Sex</span>
              <select v-model="form.sex">
                <option value="">Select sex</option>
                <option>Female</option>
                <option>Male</option>
              </select>
            </label>
            <label>
              <span>Class</span>
              <select v-model="form.class_id">
                <option value="">Unassigned</option>
                <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">
                  {{ cls.class_name }}
                </option>
              </select>
            </label>
            <label>
              <span>Academic Year *</span>
              <input v-model="form.academic_year" required placeholder="2025/2026">
            </label>
            <label>
              <span>Student Email</span>
              <input v-model="form.email" type="email">
            </label>
            <label>
              <span>Parent Name</span>
              <input v-model="form.parent_name">
            </label>
            <label>
              <span>Parent Phone</span>
              <input v-model="form.parent_phone">
            </label>
            <label>
              <span>Parent Login Email *</span>
              <input v-model="form.parent_email" type="email" required>
            </label>
            <label v-if="!editingStudentId">
              <span>Parent Password *</span>
              <input v-model="form.parent_password" type="password" required minlength="6">
            </label>
            <label v-if="editingStudentId">
              <span>Status</span>
              <select v-model="form.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </label>
          </div>

          <div class="form-actions">
            <button class="primary-btn" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Student' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="showAbsenceModal" class="modal-overlay" @click.self="closeAbsences">
        <section class="absence-card" role="dialog" aria-modal="true">
          <div class="form-header">
            <div>
              <h2>{{ selectedStudent?.name }} Absences</h2>
              <p>{{ selectedStudent?.student_number }} - {{ selectedStudent?.class_name || 'Unassigned' }}</p>
            </div>
            <button type="button" class="secondary-btn" @click="closeAbsences">Close</button>
          </div>

          <div class="absence-toolbar">
            <label>
              <span>From</span>
              <input v-model="absenceFilters.from_date" type="date">
            </label>
            <label>
              <span>To</span>
              <input v-model="absenceFilters.to_date" type="date">
            </label>
            <button type="button" class="secondary-btn" @click="loadAbsences">Apply</button>
          </div>

          <div class="absence-summary">
            <strong>{{ absentRecords.length }}</strong>
            <span>absent study periods</span>
          </div>

          <div class="absence-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Study Period / Module</th>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in absentRecords" :key="record.attendance_id">
                  <td>{{ formatDate(record.attendance_date) }}</td>
                  <td>
                    <strong>{{ record.module_name || record.period_label || 'Study period' }}</strong>
                    <small>{{ formatTimeRange(record) }}</small>
                  </td>
                  <td>{{ record.class_name || '-' }}</td>
                  <td>{{ record.teacher_name || '-' }}</td>
                  <td>{{ record.notes || '-' }}</td>
                </tr>
                <tr v-if="!absentRecords.length">
                  <td colspan="5" class="empty-row">
                    {{ loadingAbsences ? 'Loading absences...' : 'No absences recorded for this student.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <ConfirmModal
        v-model="deleteDialog.open"
        title="Delete Student"
        :description="`Delete ${deleteDialog.student?.name || 'this student'}? This action cannot be undone.`"
        confirm-label="Delete"
        cancel-label="Cancel"
        loading-label="Deleting..."
        :loading="deleteDialog.loading"
        danger
        @confirm="confirmDeleteStudent"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const students = ref([])
const classes = ref([])
const searchQuery = ref('')
const classFilter = ref('')
const showModal = ref(false)
const editingStudentId = ref(null)
const loading = ref(false)
const saving = ref(false)
const deleteDialog = ref({ open: false, student: null, loading: false })
const message = ref('')
const messageType = ref('success')
const showAbsenceModal = ref(false)
const selectedStudent = ref(null)
const absentRecords = ref([])
const loadingAbsences = ref(false)
const attendanceRecords = ref([])
const loadingAttendanceRecords = ref(false)
const attendanceFilters = ref({
  date: new Date().toISOString().slice(0, 10),
  class_id: ''
})
const absenceFilters = ref({
  from_date: '',
  to_date: ''
})

const currentAcademicYear = () => {
  const now = new Date()
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}/${start + 1}`
}

const emptyForm = () => ({
  student_number: '',
  name: '',
  sex: '',
  email: '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  parent_password: '',
  class_id: '',
  academic_year: currentAcademicYear(),
  status: 'active'
})

const form = ref(emptyForm())

const filteredStudents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return students.value.filter((student) => {
    const matchesClass = !classFilter.value || String(student.class_id) === classFilter.value
    const haystack = [
      student.name,
      student.student_number,
      student.sex,
      student.class_name,
      student.parent_name,
      student.parent_email
    ].filter(Boolean).join(' ').toLowerCase()
    return matchesClass && (!query || haystack.includes(query))
  })
})

const attendanceCounts = computed(() => {
  return attendanceRecords.value.reduce((counts, record) => {
    const status = record.status || 'present'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0
  })
})

const csvEscape = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const downloadCsv = (filename, headers, rows) => {
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const downloadStudentList = () => {
  const headers = [
    'Student ID',
    'Name',
    'Sex',
    'Class',
    'Section',
    'Academic Year',
    'Student Email',
    'Parent Name',
    'Parent Email',
    'Parent Phone',
    'Status'
  ]
  const rows = filteredStudents.value.map(student => ({
    'Student ID': student.student_number,
    Name: student.name,
    Sex: student.sex || '',
    Class: student.class_name || '',
    Section: student.section_name || '',
    'Academic Year': student.academic_year || '',
    'Student Email': student.email || '',
    'Parent Name': student.parent_name || '',
    'Parent Email': student.parent_email || '',
    'Parent Phone': student.parent_phone || '',
    Status: student.status || ''
  }))
  const className = classFilter.value
    ? classes.value.find(cls => String(cls.class_id) === classFilter.value)?.class_name || 'class'
    : 'all-students'
  downloadCsv(`student-list-${className}.csv`, headers, rows)
}

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3500)
}

const loadStudents = async () => {
  loading.value = true
  try {
    const response = await api.get('/students')
    students.value = response.data || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not load students', 'error')
  } finally {
    loading.value = false
  }
}

const loadClasses = async () => {
  const response = await api.get('/classes')
  classes.value = response.data.classes || []
}

const loadAttendanceRecords = async () => {
  if (!attendanceFilters.value.date) {
    showMessage('Select attendance date first', 'error')
    return
  }

  loadingAttendanceRecords.value = true
  try {
    const response = await api.get('/students/attendance/records', {
      params: {
        attendance_date: attendanceFilters.value.date,
        class_id: attendanceFilters.value.class_id || undefined
      }
    })
    attendanceRecords.value = response.data.attendance || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not load attendance records', 'error')
  } finally {
    loadingAttendanceRecords.value = false
  }
}

const openCreate = () => {
  editingStudentId.value = null
  form.value = emptyForm()
  showModal.value = true
}

const openEdit = (student) => {
  editingStudentId.value = student.student_id
  form.value = {
    student_number: student.student_number,
    name: student.name,
    sex: student.sex || '',
    email: student.email || '',
    parent_name: student.parent_name || '',
    parent_email: student.parent_email || '',
    parent_phone: student.parent_phone || '',
    parent_password: '',
    class_id: student.class_id || '',
    academic_year: student.academic_year || currentAcademicYear(),
    status: student.status || 'active'
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const normalizedPayload = () => ({
  ...form.value,
  class_id: form.value.class_id || null,
  section_id: classes.value.find(cls => String(cls.class_id) === String(form.value.class_id))?.section_id || null,
  email: form.value.email || null
})

const saveStudent = async () => {
  saving.value = true
  try {
    if (editingStudentId.value) {
      const payload = normalizedPayload()
      delete payload.parent_password
      delete payload.student_number
      await api.put(`/students/${editingStudentId.value}`, payload)
      showMessage('Student updated')
    } else {
      await api.post('/students', normalizedPayload())
      showMessage('Student added')
    }
    closeModal()
    await loadStudents()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not save student', 'error')
  } finally {
    saving.value = false
  }
}

const deleteStudent = async (student) => {
  deleteDialog.value = { open: true, student, loading: false }
}

const confirmDeleteStudent = async () => {
  const student = deleteDialog.value.student
  if (!student) return

  deleteDialog.value.loading = true
  try {
    await api.delete(`/students/${student.student_id}`)
    showMessage('Student deleted')
    deleteDialog.value = { open: false, student: null, loading: false }
    await loadStudents()
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not delete student', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

const openAbsences = async (student) => {
  selectedStudent.value = student
  absentRecords.value = []
  showAbsenceModal.value = true
  await loadAbsences()
}

const closeAbsences = () => {
  showAbsenceModal.value = false
  selectedStudent.value = null
}

const loadAbsences = async () => {
  if (!selectedStudent.value) return
  loadingAbsences.value = true
  try {
    const response = await api.get(`/students/${selectedStudent.value.student_id}/attendance-history`, {
      params: {
        status: 'absent',
        from_date: absenceFilters.value.from_date || undefined,
        to_date: absenceFilters.value.to_date || undefined
      }
    })
    absentRecords.value = response.data.attendance || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not load student absences', 'error')
  } finally {
    loadingAbsences.value = false
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const formatTime = (value) => String(value || '').slice(0, 5)

const formatTimeRange = (record) => {
  if (record.start_time && record.end_time) return `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`
  return record.period_label || ''
}

onMounted(async () => {
  await Promise.all([loadClasses(), loadStudents()])
  await loadAttendanceRecords()
})
</script>

<style scoped>
.students-page {
  display: grid;
  gap: 1rem;
}

.page-header,
.toolbar,
.table-panel,
.attendance-panel,
.student-form {
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.header-actions {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.page-header h1 {
  margin: 0;
  color: #172033;
  font-size: 1.45rem;
}

.page-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px auto;
  gap: 0.75rem;
  padding: 1rem;
}

.attendance-panel {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.attendance-header-row,
.attendance-summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.attendance-header-row h2 {
  margin: 0;
  color: #172033;
  font-size: 1.1rem;
}

.attendance-header-row p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.attendance-filters {
  display: grid;
  grid-template-columns: 220px 260px;
  gap: 0.75rem;
  align-items: end;
}

.attendance-summary-row {
  justify-content: flex-start;
}

.attendance-summary-row span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  color: #334155;
  background: #f1f5f9;
  font-size: 0.82rem;
  font-weight: 800;
}

.attendance-record-table {
  overflow-x: auto;
}

.attendance-status {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: #1e293b;
  background: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: capitalize;
}

.attendance-status.present {
  color: #166534;
  background: #dcfce7;
}

.attendance-status.absent {
  color: #991b1b;
  background: #fee2e2;
}

.attendance-status.late {
  color: #92400e;
  background: #fef3c7;
}

.attendance-status.excused {
  color: #075985;
  background: #e0f2fe;
}

input,
select {
  width: 100%;
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.55rem 0.7rem;
}

.primary-btn,
.secondary-btn,
.actions button {
  border: 0;
  border-radius: 7px;
  padding: 0.62rem 0.9rem;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  color: #ffffff;
  background: #2563eb;
}

.secondary-btn,
.actions button {
  color: #1e293b;
  background: #e2e8f0;
}

.actions .danger {
  color: #ffffff;
  background: #dc2626;
}

.notice {
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-weight: 800;
}

.notice.success {
  color: #166534;
  background: #dcfce7;
}

.notice.error {
  color: #991b1b;
  background: #fee2e2;
}

.table-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  color: #475569;
  background: #f8fafc;
  font-size: 0.76rem;
  text-transform: uppercase;
}

td small {
  display: block;
  margin-top: 0.2rem;
  color: #64748b;
}

.status-pill {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  color: #166534;
  background: #dcfce7;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: capitalize;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.empty-row {
  color: #64748b;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.student-form {
  width: min(780px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.25rem;
}

.absence-card {
  width: min(920px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

.form-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-weight: 700;
}

.absence-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 180px)) auto;
  gap: 0.75rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.absence-summary {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
  color: #991b1b;
  font-weight: 800;
}

.absence-summary strong {
  font-size: 1.45rem;
}

.absence-table {
  overflow-x: auto;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

label span {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 800;
}

.form-actions {
  margin-top: 1rem;
  text-align: right;
}

@media (max-width: 720px) {
  .page-header,
  .toolbar,
  .attendance-filters,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    display: grid;
  }
}
</style>

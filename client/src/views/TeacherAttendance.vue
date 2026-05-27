<template>
  <TeacherLayout>
    <div class="attendance-page">
      <header class="attendance-header">
        <div>
          <h1>Student Attendance</h1>
          <p>View your class lists and mark attendance by day and study period.</p>
        </div>
        <div class="header-actions">
          <button class="secondary-btn" type="button" :disabled="!students.length" @click="downloadClassList">
            Download List
          </button>
          <button class="primary-btn" type="button" :disabled="!selectedClassId || saving" @click="saveAttendance">
            {{ saving ? 'Saving...' : 'Save Attendance' }}
          </button>
        </div>
      </header>

      <section class="controls-panel">
        <label>
          <span>Class</span>
          <select v-model="selectedClassId">
            <option value="">Select class</option>
            <option v-for="cls in classes" :key="cls.class_id" :value="String(cls.class_id)">
              {{ cls.class_name }} - {{ cls.teacher_relation === 'class_teacher' ? 'Class teacher' : 'Subject teacher' }}
            </option>
          </select>
        </label>
        <label>
          <span>Date</span>
          <input v-model="attendanceDate" type="date">
        </label>
        <label>
          <span>Study Period</span>
          <input v-model="periodLabel" placeholder="Period 1, Morning, Lab...">
        </label>
      </section>

      <div v-if="message" class="notice" :class="messageType">{{ message }}</div>

      <LoadingState v-if="loadingClasses" :rows="3" />

      <ErrorState
        v-else-if="classesError"
        title="Unable to Load Classes"
        description="We're having trouble retrieving your classes right now. Please check your connection or try again."
        :action-label="loadingClasses ? 'Retrying...' : 'Retry'"
        @retry="loadClasses"
      />

      <section v-if="!loadingClasses && classes.length" class="class-strip">
        <button
          v-for="cls in classes"
          :key="cls.class_id"
          type="button"
          :class="{ active: String(cls.class_id) === selectedClassId }"
          @click="selectedClassId = String(cls.class_id)"
        >
          <strong>{{ cls.class_name }}</strong>
          <span>{{ cls.student_count || 0 }} students</span>
        </button>
      </section>

      <section v-if="!classesError && !loadingClasses" class="attendance-table">
        <LoadingState v-if="loadingStudents" :rows="5" />
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Sex</th>
              <th>Student ID</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.student_id">
              <td><strong>{{ student.name }}</strong></td>
              <td>{{ student.sex || '-' }}</td>
              <td>{{ student.student_number }}</td>
              <td>
                <select v-model="attendanceByStudent[student.student_id].status">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </td>
              <td>
                <input v-model="attendanceByStudent[student.student_id].notes" placeholder="Optional note">
              </td>
            </tr>
            <tr v-if="!loadingStudents && !students.length">
              <td colspan="5" class="empty-row">
                <EmptyState
                  :title="selectedClassId ? 'No students found for this class.' : 'Choose a class to view students.'"
                  :description="selectedClassId ? 'Once students are assigned, they will appear here for attendance marking.' : 'Select a class above to begin marking attendance.'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import api from '@/stores/api'
import TeacherLayout from '@/components/TeacherLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'

const classes = ref([])
const students = ref([])
const selectedClassId = ref('')
const attendanceDate = ref(new Date().toISOString().slice(0, 10))
const periodLabel = ref('Period 1')
const attendanceByStudent = reactive({})
const saving = ref(false)
const loadingClasses = ref(false)
const loadingStudents = ref(false)
const classesError = ref(false)
const message = ref('')
const messageType = ref('success')

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3500)
}

const selectedClass = () => classes.value.find(cls => String(cls.class_id) === selectedClassId.value)

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

const downloadClassList = () => {
  const headers = ['Student ID', 'Name', 'Sex', 'Class', 'Status', 'Notes']
  const rows = students.value.map(student => ({
    'Student ID': student.student_number,
    Name: student.name,
    Sex: student.sex || '',
    Class: student.class_name || selectedClass()?.class_name || '',
    Status: attendanceByStudent[student.student_id]?.status || 'present',
    Notes: attendanceByStudent[student.student_id]?.notes || ''
  }))
  const className = selectedClass()?.class_name || 'class'
  downloadCsv(`student-list-${className}-${attendanceDate.value}.csv`, headers, rows)
}

const ensureAttendanceRows = () => {
  students.value.forEach((student) => {
    if (!attendanceByStudent[student.student_id]) {
      attendanceByStudent[student.student_id] = {
        student_id: student.student_id,
        status: 'present',
        notes: ''
      }
    }
  })
}

const loadClasses = async () => {
  loadingClasses.value = true
  classesError.value = false
  message.value = ''
  try {
    const response = await api.get('/students/teacher/classes')
    classes.value = response.data.classes || []
    if (!selectedClassId.value && classes.value.length) {
      selectedClassId.value = String(classes.value[0].class_id)
    }
  } catch (error) {
    classes.value = []
    students.value = []
    classesError.value = true
  } finally {
    loadingClasses.value = false
  }
}

const loadStudents = async () => {
  students.value = []
  Object.keys(attendanceByStudent).forEach(key => delete attendanceByStudent[key])
  if (!selectedClassId.value) return

  loadingStudents.value = true
  try {
    const response = await api.get(`/students/teacher/classes/${selectedClassId.value}/students`)
    students.value = response.data.students || []
    ensureAttendanceRows()
    await loadAttendance()
  } catch (error) {
    students.value = []
    showMessage("We couldn't load the students for this class. Please try again.", 'error')
  } finally {
    loadingStudents.value = false
  }
}

const loadAttendance = async () => {
  if (!selectedClassId.value || !attendanceDate.value) return

  try {
    const response = await api.get('/students/attendance', {
      params: {
        class_id: selectedClassId.value,
        attendance_date: attendanceDate.value,
        period_label: periodLabel.value
      }
    })

    ;(response.data.attendance || []).forEach((record) => {
      attendanceByStudent[record.student_id] = {
        student_id: record.student_id,
        status: record.status,
        notes: record.notes || '',
        attendance_id: record.attendance_id
      }
    })
  } catch (error) {
    showMessage("We couldn't load saved attendance for this period. You can still mark a fresh sheet.", 'error')
  }
}

const saveAttendance = async () => {
  if (!selectedClassId.value) return
  saving.value = true
  try {
    const records = students.value.map(student => ({
      student_id: student.student_id,
      status: attendanceByStudent[student.student_id]?.status || 'present',
      notes: attendanceByStudent[student.student_id]?.notes || ''
    }))

    await api.post('/students/attendance', {
      class_id: Number(selectedClassId.value),
      attendance_date: attendanceDate.value,
      period_label: periodLabel.value,
      records
    })

    showMessage('Attendance saved')
  } catch (error) {
    showMessage("We couldn't save attendance right now. Please try again.", 'error')
  } finally {
    saving.value = false
  }
}

watch(selectedClassId, loadStudents)
watch([attendanceDate, periodLabel], loadAttendance)

onMounted(async () => {
  await loadClasses()
})
</script>

<style scoped>
.attendance-page {
  display: grid;
  gap: 1rem;
}

.attendance-header,
.controls-panel,
.class-strip,
.attendance-table {
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.attendance-header {
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

.attendance-header h1 {
  margin: 0;
  color: #172033;
  font-size: 1.45rem;
}

.attendance-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.controls-panel {
  display: grid;
  grid-template-columns: 1.2fr 180px 1fr;
  gap: 0.8rem;
  padding: 1rem;
}

label span {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

input,
select {
  width: 100%;
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.55rem 0.7rem;
}

.primary-btn {
  align-self: start;
  border: 0;
  border-radius: 7px;
  padding: 0.7rem 1rem;
  color: #ffffff;
  background: #2563eb;
  font-weight: 800;
  cursor: pointer;
}

.secondary-btn {
  align-self: start;
  border: 0;
  border-radius: 7px;
  padding: 0.7rem 1rem;
  color: #1e293b;
  background: #e2e8f0;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.class-strip {
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
  padding: 0.85rem;
}

.class-strip button {
  min-width: 160px;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  padding: 0.75rem;
  color: #334155;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.class-strip button.active {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #dbeafe;
}

.class-strip span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.78rem;
}

.attendance-table {
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

.empty-row {
  text-align: center;
}

@media (max-width: 760px) {
  .attendance-header,
  .controls-panel {
    grid-template-columns: 1fr;
    display: grid;
  }
}

:global(body.teacher-dark-mode) .attendance-page {
  background: #020617;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .attendance-header,
:global(body.teacher-dark-mode) .controls-panel,
:global(body.teacher-dark-mode) .class-strip,
:global(body.teacher-dark-mode) .attendance-table {
  background: #111827;
  border-color: #243244;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .attendance-header h1,
:global(body.teacher-dark-mode) .table-empty strong {
  color: #f8fafc;
}

:global(body.teacher-dark-mode) .attendance-header p,
:global(body.teacher-dark-mode) label span,
:global(body.teacher-dark-mode) .table-empty {
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) input,
:global(body.teacher-dark-mode) select,
:global(body.teacher-dark-mode) .class-strip button {
  background: #0b1220;
  border-color: #334155;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) th {
  background: #0b1220;
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) td {
  border-color: #243244;
}

:global(body.teacher-dark-mode) .class-strip button.active {
  background: #172554;
  color: #dbeafe;
  border-color: #60a5fa;
}
</style>

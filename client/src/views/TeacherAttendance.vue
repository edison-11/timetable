<template>
  <TeacherLayout>
    <div class="attendance-page">
      <header class="attendance-header">
        <div>
          <h1>Student Attendance</h1>
          <p>Select a class, call each student, then send the report to DOS.</p>
        </div>
        <div class="header-actions">
          <button class="secondary-btn" type="button" :disabled="!students.length" @click="downloadClassList">
            Download List
          </button>
          <button class="secondary-btn" type="button" :disabled="!selectedClassId || saving" @click="saveAttendance(false)">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button class="primary-btn" type="button" :disabled="!selectedClassId || saving || !students.length" @click="saveAttendance(true)">
            {{ saving ? 'Sending...' : 'Report to DOS' }}
          </button>
        </div>
      </header>

      <section class="controls-panel">
        <label>
          <span>Class</span>
          <select v-model="selectedClassId" @change="selectClass(selectedClassId)">
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

      <section v-if="students.length" class="attendance-summary">
        <article><span>Total</span><strong>{{ attendanceSummary.total }}</strong></article>
        <article><span>Present</span><strong>{{ attendanceSummary.present }}</strong></article>
        <article><span>Absent</span><strong>{{ attendanceSummary.absent }}</strong></article>
        <article><span>Late</span><strong>{{ attendanceSummary.late }}</strong></article>
        <article><span>Other</span><strong>{{ attendanceSummary.excused }}</strong></article>
      </section>

      <LoadingState v-if="loadingClasses" :rows="3" />

      <ErrorState
        v-else-if="classesError"
        title="Unable to Load Classes"
        :description="classesErrorMessage"
        :action-label="loadingClasses ? 'Retrying...' : 'Retry'"
        @retry="loadClasses"
      />

      <section v-if="!loadingClasses && classes.length" class="class-strip">
        <button
          v-for="cls in classes"
          :key="cls.class_id"
          type="button"
          :class="{ active: String(cls.class_id) === selectedClassId }"
          @click="selectClass(String(cls.class_id))"
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
                <div class="status-toggle">
                  <button
                    type="button"
                    class="status-btn present"
                    :class="{ active: studentStatus(student.student_id) === 'present' }"
                    :aria-pressed="studentStatus(student.student_id) === 'present'"
                    @click.stop.prevent="markStatus(student.student_id, 'present')"
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    class="status-btn absent"
                    :class="{ active: studentStatus(student.student_id) === 'absent' }"
                    :aria-pressed="studentStatus(student.student_id) === 'absent'"
                    @click.stop.prevent="markStatus(student.student_id, 'absent')"
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    class="status-btn late"
                    :class="{ active: studentStatus(student.student_id) === 'late' }"
                    :aria-pressed="studentStatus(student.student_id) === 'late'"
                    @click.stop.prevent="markStatus(student.student_id, 'late')"
                  >
                    Late
                  </button>
                </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
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
const classesErrorMessage = ref("We're having trouble retrieving your classes right now. Please check your connection or try again.")
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

const attendanceSummary = computed(() => {
  const records = students.value.map(student => attendanceByStudent[student.student_id]?.status || 'present')
  return {
    total: records.length,
    present: records.filter(status => status === 'present').length,
    absent: records.filter(status => status === 'absent').length,
    late: records.filter(status => status === 'late').length,
    excused: records.filter(status => status === 'excused').length
  }
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

const ensureAttendanceRow = (studentId) => {
  if (!attendanceByStudent[studentId]) {
    attendanceByStudent[studentId] = { student_id: studentId, status: 'present', notes: '' }
  }
  return attendanceByStudent[studentId]
}

const studentStatus = (studentId) => ensureAttendanceRow(studentId).status

const markStatus = (studentId, status) => {
  ensureAttendanceRow(studentId).status = status
}

const selectClass = async (classId) => {
  selectedClassId.value = String(classId || '')
  await loadStudents()
}

const loadClasses = async () => {
  loadingClasses.value = true
  classesError.value = false
  classesErrorMessage.value = "We're having trouble retrieving your classes right now. Please check your connection or try again."
  message.value = ''
  try {
    const response = await api.get('/teacher-attendance/classes')
    classes.value = response.data.classes || []
    if (classes.value.length) {
      const classWithStudents = classes.value.find(cls => Number(cls.student_count || 0) > 0)
      const currentClass = classes.value.find(cls => String(cls.class_id) === selectedClassId.value)
      selectedClassId.value = String((currentClass || classWithStudents || classes.value[0]).class_id)
      await loadStudents()
    }
  } catch (error) {
    classes.value = []
    students.value = []
    classesError.value = true
    classesErrorMessage.value = error.response?.data?.message || error.response?.data?.code || "We're having trouble retrieving your classes right now. Please check your connection or try again."
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
    const response = await api.get(`/teacher-attendance/classes/${selectedClassId.value}/students`)
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
    const response = await api.get('/teacher-attendance/attendance', {
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

const saveAttendance = async (report = false) => {
  if (!selectedClassId.value) return
  saving.value = true
  try {
    const records = students.value.map(student => ({
      student_id: student.student_id,
      status: attendanceByStudent[student.student_id]?.status || 'present',
      notes: attendanceByStudent[student.student_id]?.notes || ''
    }))

    await api.post('/teacher-attendance/attendance', {
      class_id: Number(selectedClassId.value),
      attendance_date: attendanceDate.value,
      period_label: periodLabel.value,
      records,
      report
    })

    showMessage(report ? 'Attendance report sent to DOS' : 'Attendance saved')
  } catch (error) {
    showMessage("We couldn't save attendance right now. Please try again.", 'error')
  } finally {
    saving.value = false
  }
}

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
.attendance-summary,
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

.attendance-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.85rem;
}

.attendance-summary article {
  padding: 0.85rem;
  border-radius: 8px;
  background: #f8fafc;
}

.attendance-summary span,
.attendance-summary strong {
  display: block;
}

.attendance-summary span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 850;
  text-transform: uppercase;
}

.attendance-summary strong {
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.45rem;
  font-weight: 950;
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

.status-toggle {
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(68px, 1fr));
  gap: 0.35rem;
  position: relative;
  z-index: 2;
}

.status-toggle .status-btn {
  appearance: none;
  min-height: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.42rem 0.6rem;
  color: #334155;
  background: #ffffff;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.status-toggle .status-btn.present.active {
  border-color: #16a34a;
  color: #14532d;
  background: #dcfce7;
  box-shadow: inset 0 0 0 1px rgba(22, 163, 74, 0.28), 0 0 0 3px rgba(34, 197, 94, 0.14);
}

.status-toggle .status-btn.absent.active {
  border-color: #dc2626;
  color: #7f1d1d;
  background: #fee2e2;
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.28), 0 0 0 3px rgba(248, 113, 113, 0.14);
}

.status-toggle .status-btn.late.active {
  border-color: #d97706;
  color: #78350f;
  background: #fef3c7;
  box-shadow: inset 0 0 0 1px rgba(217, 119, 6, 0.28), 0 0 0 3px rgba(245, 158, 11, 0.14);
}

.status-toggle .status-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
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

:global(body.dark) .attendance-page,
:global(body.teacher-dark-mode) .attendance-header,
:global(body.dark) .attendance-header,
:global(body.teacher-dark-mode) .controls-panel,
:global(body.dark) .controls-panel,
:global(body.teacher-dark-mode) .class-strip,
:global(body.dark) .class-strip,
:global(body.teacher-dark-mode) .attendance-summary,
:global(body.dark) .attendance-summary,
:global(body.teacher-dark-mode) .attendance-table,
:global(body.dark) .attendance-table {
  background: #111827;
  border-color: #243244;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .attendance-header h1,
:global(body.dark) .attendance-header h1,
:global(body.teacher-dark-mode) .table-empty strong {
  color: #f8fafc;
}

:global(body.teacher-dark-mode) .attendance-header p,
:global(body.dark) .attendance-header p,
:global(body.teacher-dark-mode) label span,
:global(body.dark) label span,
:global(body.teacher-dark-mode) .attendance-summary span,
:global(body.dark) .attendance-summary span,
:global(body.teacher-dark-mode) .table-empty {
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) .attendance-summary article,
:global(body.dark) .attendance-summary article,
:global(body.teacher-dark-mode) .status-toggle .status-btn,
:global(body.dark) .status-toggle .status-btn {
  background: #0b1220;
  border-color: #334155;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .status-toggle .status-btn.present.active {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.22);
}

:global(body.dark) .status-toggle .status-btn.present.active {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.22);
}

:global(body.teacher-dark-mode) .status-toggle .status-btn.absent.active {
  border-color: #f87171;
  color: #fecaca;
  background: rgba(220, 38, 38, 0.22);
}

:global(body.dark) .status-toggle .status-btn.absent.active {
  border-color: #f87171;
  color: #fecaca;
  background: rgba(220, 38, 38, 0.22);
}

:global(body.teacher-dark-mode) .status-toggle .status-btn.late.active {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.22);
}

:global(body.dark) .status-toggle .status-btn.late.active {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.22);
}

:global(body.teacher-dark-mode) .attendance-summary strong {
  color: #f8fafc;
}

:global(body.dark) .attendance-summary strong {
  color: #f8fafc;
}

:global(body.teacher-dark-mode) input,
:global(body.dark) input,
:global(body.teacher-dark-mode) select,
:global(body.dark) select,
:global(body.dark) .class-strip button,
:global(body.teacher-dark-mode) .class-strip button {
  background: #0b1220;
  border-color: #334155;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) th {
  background: #0b1220;
  color: #cbd5e1;
}

:global(body.dark) th {
  background: #0b1220;
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) td {
  border-color: #243244;
}

:global(body.dark) td {
  border-color: #243244;
}

:global(body.teacher-dark-mode) .class-strip button.active {
  background: #172554;
  color: #dbeafe;
  border-color: #60a5fa;
}

:global(body.dark) .class-strip button.active {
  background: #172554;
  color: #dbeafe;
  border-color: #60a5fa;
}
</style>

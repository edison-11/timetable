<template>
  <AppLayout>
    <div class="students-page">
      <header class="page-header">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDescription }}</p>
        </div>
        <div v-if="pageMode === 'students'" class="header-actions">
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

      <section v-if="pageMode !== 'students'" class="mode-panel">
        <div class="mode-filters">
          <label>
            <span>Date</span>
            <input v-model="attendanceFilters.date" type="date">
          </label>
          <label>
            <span>Class</span>
            <select v-model="classFilter">
              <option value="">All classes</option>
              <option v-for="cls in classes" :key="cls.class_id" :value="String(cls.class_id)">
                {{ cls.class_name }}
              </option>
            </select>
          </label>
          <button type="button" class="secondary-btn" :disabled="loadingAttendanceRecords" @click="loadAttendanceRecords">
            {{ loadingAttendanceRecords ? 'Loading...' : pageMode === 'reports' ? 'View Report' : 'View Attendance' }}
          </button>
        </div>

        <div class="attendance-summary-row">
          <span><strong>{{ attendanceRecords.length }}</strong> records</span>
          <span><strong>{{ attendanceRecordCounts.present }}</strong> present</span>
          <span><strong>{{ attendanceRecordCounts.absent }}</strong> absent</span>
          <span><strong>{{ attendanceRecordCounts.late }}</strong> late</span>
          <span><strong>{{ attendanceRecordCounts.excused }}</strong> excused</span>
        </div>

        <div v-if="pageMode === 'attendance'" class="attendance-record-table">
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

        <div v-else class="report-section">
          <div class="report-summary-grid">
            <article>
              <span>Present Rate</span>
              <strong>{{ attendanceReportSummary.presentRate }}%</strong>
            </article>
            <article>
              <span>Students Present</span>
              <strong>{{ attendanceReportSummary.present }}</strong>
            </article>
            <article>
              <span>Students Absent</span>
              <strong>{{ attendanceReportSummary.absent }}</strong>
            </article>
            <article>
              <span>Late / Excused</span>
              <strong>{{ attendanceReportSummary.late + attendanceReportSummary.excused }}</strong>
            </article>
          </div>

          <div class="module-chart">
            <div v-for="module in attendanceReportRows" :key="module.name" class="module-bar-row">
              <div class="module-bar-label">
                <strong>{{ module.name }}</strong>
                <span>{{ module.present }}/{{ module.total }} attended</span>
              </div>
              <div class="module-bar-track">
                <span :style="{ width: `${module.rate}%` }"></span>
              </div>
              <strong>{{ module.rate }}%</strong>
            </div>
            <p v-if="!attendanceReportRows.length" class="empty-row">
              {{ loadingAttendanceRecords ? 'Loading report...' : 'No report data for this date.' }}
            </p>
          </div>
        </div>
      </section>

      <section v-if="pageMode === 'students' && selectedStudent" class="student-detail-panel">
        <div class="detail-header-row">
          <div>
            <h2>{{ selectedStudent.name }}</h2>
            <p>{{ selectedStudent.student_number }} - {{ selectedStudent.class_name || 'Unassigned' }}</p>
          </div>
          <button type="button" class="secondary-btn" @click="clearSelectedStudent">
            Close
          </button>
        </div>

        <div class="detail-tabs" role="tablist" aria-label="Student detail sections">
          <button type="button" :class="{ active: studentDetailTab === 'info' }" @click="selectStudentTab('info')">
            Information
          </button>
          <button type="button" :class="{ active: studentDetailTab === 'attendance' }" @click="selectStudentTab('attendance')">
            Attendance
          </button>
          <button type="button" :class="{ active: studentDetailTab === 'report' }" @click="selectStudentTab('report')">
            Report
          </button>
        </div>

        <div v-if="studentDetailTab === 'info'" class="student-info-grid">
          <article>
            <span>Student ID</span>
            <strong>{{ selectedStudent.student_number || '-' }}</strong>
          </article>
          <article>
            <span>Name</span>
            <strong>{{ selectedStudent.name || '-' }}</strong>
          </article>
          <article>
            <span>Sex</span>
            <strong>{{ selectedStudent.sex || '-' }}</strong>
          </article>
          <article>
            <span>Class</span>
            <strong>{{ selectedStudent.class_name || 'Unassigned' }}</strong>
          </article>
          <article>
            <span>Section</span>
            <strong>{{ selectedStudent.section_name || '-' }}</strong>
          </article>
          <article>
            <span>Academic Year</span>
            <strong>{{ selectedStudent.academic_year || '-' }}</strong>
          </article>
          <article>
            <span>Student Email</span>
            <strong>{{ selectedStudent.email || '-' }}</strong>
          </article>
          <article>
            <span>Status</span>
            <strong class="status-text">{{ selectedStudent.status || '-' }}</strong>
          </article>
          <article>
            <span>Parent Name</span>
            <strong>{{ selectedStudent.parent_name || '-' }}</strong>
          </article>
          <article>
            <span>Parent Email</span>
            <strong>{{ selectedStudent.parent_email || '-' }}</strong>
          </article>
          <article>
            <span>Parent Phone</span>
            <strong>{{ selectedStudent.parent_phone || '-' }}</strong>
          </article>
        </div>

        <div v-if="studentDetailTab === 'attendance'" class="attendance-history-section">
          <div class="attendance-summary-row">
            <span><strong>{{ selectedAttendance.length }}</strong> records</span>
            <span><strong>{{ selectedAttendanceCounts.present }}</strong> present</span>
            <span><strong>{{ selectedAttendanceCounts.absent }}</strong> absent</span>
            <span><strong>{{ selectedAttendanceCounts.late }}</strong> late</span>
            <span><strong>{{ selectedAttendanceCounts.excused }}</strong> excused</span>
          </div>

          <div class="attendance-record-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Period / Module</th>
                  <th>Status</th>
                  <th>Teacher</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in attendanceByDay" :key="group.date">
                  <tr class="day-row">
                    <td colspan="5">{{ formatDate(group.date) }}</td>
                  </tr>
                  <tr v-for="record in group.records" :key="record.attendance_id">
                    <td>{{ formatDate(record.attendance_date) }}</td>
                    <td>
                      <strong>{{ record.module_name || record.period_label || 'Study period' }}</strong>
                      <small>{{ formatTimeRange(record) }}</small>
                    </td>
                    <td><span class="attendance-status" :class="record.status">{{ record.status }}</span></td>
                    <td>{{ record.teacher_name || '-' }}</td>
                    <td>{{ record.notes || '-' }}</td>
                  </tr>
                </template>
                <tr v-if="!selectedAttendance.length">
                  <td colspan="5" class="empty-row">
                    {{ loadingSelectedAttendance ? 'Loading attendance...' : 'No attendance recorded for this student.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="studentDetailTab === 'report'" class="report-section">
          <div class="report-toolbar">
            <label>
              <span>Period</span>
              <select v-model="reportPeriod">
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="term">This term</option>
              </select>
            </label>
            <div>
              <span>Showing</span>
              <strong>{{ reportRangeLabel }}</strong>
            </div>
          </div>

          <div class="report-summary-grid">
            <article>
              <span>Present Rate</span>
              <strong>{{ selectedReportSummary.presentRate }}%</strong>
            </article>
            <article>
              <span>Present</span>
              <strong>{{ selectedReportSummary.present }}</strong>
            </article>
            <article>
              <span>Absent</span>
              <strong>{{ selectedReportSummary.absent }}</strong>
            </article>
            <article>
              <span>Late / Excused</span>
              <strong>{{ selectedReportSummary.late + selectedReportSummary.excused }}</strong>
            </article>
          </div>

          <div class="chart-row">
            <div class="pie-chart" :style="reportPieStyle">
              <span>{{ selectedReportSummary.presentRate }}%</span>
            </div>
            <div class="chart-legend">
              <span><i class="present-dot"></i> Present</span>
              <span><i class="absent-dot"></i> Absent</span>
              <span><i class="late-dot"></i> Late</span>
              <span><i class="excused-dot"></i> Excused</span>
            </div>
          </div>

          <div class="module-chart">
            <div v-for="module in moduleReportRows" :key="module.name" class="module-bar-row">
              <div class="module-bar-label">
                <strong>{{ module.name }}</strong>
                <span>{{ module.present }}/{{ module.total }} attended</span>
              </div>
              <div class="module-bar-track">
                <span :style="{ width: `${module.rate}%` }"></span>
              </div>
              <strong>{{ module.rate }}%</strong>
            </div>
            <p v-if="!moduleReportRows.length" class="empty-row">
              {{ loadingSelectedAttendance ? 'Loading report...' : 'No module attendance for this period.' }}
            </p>
          </div>
        </div>
      </section>

      <section v-if="pageMode === 'students'" class="table-panel">
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
            <tr v-for="student in filteredStudents" :key="student.student_id" :class="{ selected: selectedStudent?.student_id === student.student_id }">
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
                <button type="button" @click="openStudentDetail(student, 'info')">Information</button>
                <button type="button" @click="openStudentDetail(student, 'attendance')">Attendance</button>
                <button type="button" @click="openStudentDetail(student, 'report')">Report</button>
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
              <div class="password-wrap">
                <input v-model="form.parent_password" :type="showParentPassword ? 'text' : 'password'" required minlength="6">
                <button type="button" :aria-label="showParentPassword ? 'Hide password' : 'Show password'" @click="showParentPassword = !showParentPassword">
                  <EyeOff v-if="showParentPassword" :size="17" :stroke-width="2.2" aria-hidden="true" />
                  <Eye v-else :size="17" :stroke-width="2.2" aria-hidden="true" />
                </button>
              </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
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
const route = useRoute()
const showParentPassword = ref(false)
const selectedStudent = ref(null)
const studentDetailTab = ref('info')
const selectedAttendance = ref([])
const loadingSelectedAttendance = ref(false)
const reportPeriod = ref('week')
const attendanceRecords = ref([])
const loadingAttendanceRecords = ref(false)
const attendanceFilters = ref({
  date: new Date().toISOString().slice(0, 10)
})

const pageMode = computed(() => {
  const view = String(route.query.view || '')
  if (view === 'attendance') return 'attendance'
  if (view === 'report') return 'reports'
  return 'students'
})

const pageTitle = computed(() => {
  if (pageMode.value === 'attendance') return 'Attendance'
  if (pageMode.value === 'reports') return 'Reports'
  return 'Students'
})

const pageDescription = computed(() => {
  if (pageMode.value === 'attendance') return 'Review recorded attendance by date and class.'
  if (pageMode.value === 'reports') return 'View attendance summaries and module-level report data.'
  return 'Add learners, assign them to classes, and keep parent login details on record.'
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

const buildAttendanceCounts = (records) => {
  return records.reduce((counts, record) => {
    const status = record.status || 'present'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0
  })
}

const selectedAttendanceCounts = computed(() => buildAttendanceCounts(selectedAttendance.value))
const attendanceRecordCounts = computed(() => buildAttendanceCounts(attendanceRecords.value))

const attendanceByDay = computed(() => {
  const groups = new Map()
  selectedAttendance.value.forEach((record) => {
    const date = normalizeDate(record.attendance_date)
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date).push(record)
  })
  return Array.from(groups.entries()).map(([date, records]) => ({ date, records }))
})

const getWeekRange = (date = new Date()) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

const getTermRange = (date = new Date()) => {
  const month = date.getMonth()
  const termStartMonth = Math.floor(month / 3) * 3
  const start = new Date(date.getFullYear(), termStartMonth, 1)
  const end = new Date(date.getFullYear(), termStartMonth + 3, 0, 23, 59, 59, 999)
  return { start, end }
}

const reportDateRange = computed(() => {
  if (reportPeriod.value === 'month') return getMonthRange()
  if (reportPeriod.value === 'term') return getTermRange()
  return getWeekRange()
})

const reportRangeLabel = computed(() => {
  const { start, end } = reportDateRange.value
  return `${formatDate(start)} - ${formatDate(end)}`
})

const reportRecords = computed(() => {
  const { start, end } = reportDateRange.value
  return selectedAttendance.value.filter((record) => {
    const date = new Date(record.attendance_date)
    return date >= start && date <= end
  })
})

const selectedReportSummary = computed(() => {
  const counts = buildAttendanceCounts(reportRecords.value)
  const total = reportRecords.value.length
  const attended = counts.present + counts.late + counts.excused
  return {
    ...counts,
    total,
    presentRate: total ? Math.round((attended / total) * 100) : 0
  }
})

const reportPieStyle = computed(() => {
  const total = selectedReportSummary.value.total || 1
  const present = Math.round((selectedReportSummary.value.present / total) * 100)
  const absent = Math.round((selectedReportSummary.value.absent / total) * 100)
  const late = Math.round((selectedReportSummary.value.late / total) * 100)
  return {
    '--present': `${present}%`,
    '--absent': `${present + absent}%`,
    '--late': `${present + absent + late}%`
  }
})

const moduleReportRows = computed(() => {
  const modules = new Map()
  reportRecords.value.forEach((record) => {
    const name = record.module_name || record.period_label || 'Study period'
    if (!modules.has(name)) modules.set(name, { name, total: 0, present: 0 })
    const row = modules.get(name)
    row.total += 1
    if (['present', 'late', 'excused'].includes(record.status || 'present')) row.present += 1
  })
  return Array.from(modules.values())
    .map((row) => ({
      ...row,
      rate: row.total ? Math.round((row.present / row.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
})

const attendanceReportSummary = computed(() => {
  const counts = buildAttendanceCounts(attendanceRecords.value)
  const total = attendanceRecords.value.length
  const attended = counts.present + counts.late + counts.excused
  return {
    ...counts,
    total,
    presentRate: total ? Math.round((attended / total) * 100) : 0
  }
})

const attendanceReportRows = computed(() => {
  const modules = new Map()
  attendanceRecords.value.forEach((record) => {
    const name = record.module_name || record.period_label || 'Study period'
    if (!modules.has(name)) modules.set(name, { name, total: 0, present: 0 })
    const row = modules.get(name)
    row.total += 1
    if (['present', 'late', 'excused'].includes(record.status || 'present')) row.present += 1
  })
  return Array.from(modules.values())
    .map((row) => ({
      ...row,
      rate: row.total ? Math.round((row.present / row.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
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
        class_id: classFilter.value || undefined
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

const openStudentDetail = async (student, tab = 'info') => {
  selectedStudent.value = student
  studentDetailTab.value = tab
  if (!selectedAttendance.value.length || String(selectedAttendance.value[0]?.student_id) !== String(student.student_id)) {
    selectedAttendance.value = []
    await loadSelectedAttendance()
  }
}

const clearSelectedStudent = () => {
  selectedStudent.value = null
  selectedAttendance.value = []
  studentDetailTab.value = 'info'
}

const selectStudentTab = async (tab) => {
  studentDetailTab.value = tab
  if ((tab === 'attendance' || tab === 'report') && selectedStudent.value && !selectedAttendance.value.length) {
    await loadSelectedAttendance()
  }
}

const loadSelectedAttendance = async () => {
  if (!selectedStudent.value) return
  loadingSelectedAttendance.value = true
  try {
    const response = await api.get(`/students/${selectedStudent.value.student_id}/attendance-history`, {
      params: {}
    })
    selectedAttendance.value = response.data.attendance || []
  } catch (error) {
    showMessage(error.response?.data?.message || 'Could not load student attendance', 'error')
  } finally {
    loadingSelectedAttendance.value = false
  }
}

const normalizeDate = (value) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
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

const openCreateFromQuery = () => {
  if (route.query.action === 'add') openCreate()
}

const openViewFromQuery = async () => {
  const view = String(route.query.view || '')
  if (view === 'attendance' || view === 'report') {
    clearSelectedStudent()
    await loadAttendanceRecords()
    return
  }

  if (view !== 'info') return
  if (selectedStudent.value && studentDetailTab.value === view) return

  const firstStudent = filteredStudents.value[0] || students.value[0]
  if (!firstStudent) return

  await openStudentDetail(firstStudent, view)
}

const handleRouteQuery = async () => {
  openCreateFromQuery()
  await openViewFromQuery()
}

watch(
  () => [route.query.action, route.query.create, route.query.view, filteredStudents.value.length],
  handleRouteQuery
)

onMounted(async () => {
  await Promise.all([loadClasses(), loadStudents()])
  await handleRouteQuery()
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
.student-detail-panel,
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

.student-detail-panel {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.detail-header-row,
.attendance-summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.detail-header-row h2 {
  margin: 0;
  color: #172033;
  font-size: 1.1rem;
}

.detail-header-row p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.detail-tabs {
  display: flex;
  gap: 0.45rem;
  padding: 0.25rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}

.detail-tabs button {
  min-height: 34px;
  border: 0;
  border-radius: 6px;
  padding: 0.42rem 0.75rem;
  color: #475569;
  background: transparent;
  font-weight: 900;
  cursor: pointer;
}

.detail-tabs button.active {
  color: #ffffff;
  background: #2563eb;
}

.student-info-grid,
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.student-info-grid article,
.report-summary-grid article {
  min-width: 0;
  padding: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.student-info-grid span,
.report-summary-grid span,
.report-toolbar span {
  display: block;
  margin-bottom: 0.25rem;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
}

.student-info-grid strong,
.report-summary-grid strong,
.report-toolbar strong {
  display: block;
  min-width: 0;
  color: #172033;
  overflow-wrap: anywhere;
}

.status-text {
  text-transform: capitalize;
}

.day-row td {
  color: #1e40af;
  background: #eff6ff;
  font-weight: 900;
}

.report-section,
.attendance-history-section,
.module-chart {
  display: grid;
  gap: 0.9rem;
}

.report-toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  gap: 0.75rem;
  align-items: end;
}

.chart-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.pie-chart {
  width: 132px;
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(
    #16a34a 0 var(--present),
    #dc2626 var(--present) var(--absent),
    #d97706 var(--absent) var(--late),
    #0284c7 var(--late) 100%
  );
}

.pie-chart span {
  display: grid;
  place-items: center;
  width: 78px;
  aspect-ratio: 1;
  border-radius: 50%;
  color: #172033;
  background: #ffffff;
  font-size: 1.25rem;
  font-weight: 900;
}

.chart-legend {
  display: grid;
  gap: 0.4rem;
  color: #334155;
  font-weight: 800;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.chart-legend i {
  width: 10px;
  aspect-ratio: 1;
  border-radius: 999px;
}

.present-dot {
  background: #16a34a;
}

.absent-dot {
  background: #dc2626;
}

.late-dot {
  background: #d97706;
}

.excused-dot {
  background: #0284c7;
}

.module-bar-row {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr) 52px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.module-bar-label {
  min-width: 0;
}

.module-bar-label strong,
.module-bar-label span {
  display: block;
  overflow-wrap: anywhere;
}

.module-bar-label span {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.module-bar-track {
  height: 12px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 999px;
}

.module-bar-track span {
  display: block;
  height: 100%;
  min-width: 4px;
  background: #2563eb;
  border-radius: inherit;
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
  right: 0.3rem;
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

tbody tr.selected {
  background: #eff6ff;
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
  flex-wrap: wrap;
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

.form-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-weight: 700;
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

:global(body:is(.admin-dark-mode, .dark)) .students-page {
  color: #e5edf7;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page .page-header,
:global(body:is(.admin-dark-mode, .dark)) .students-page .toolbar,
:global(body:is(.admin-dark-mode, .dark)) .students-page .table-panel,
:global(body:is(.admin-dark-mode, .dark)) .students-page .student-detail-panel,
:global(body:is(.admin-dark-mode, .dark)) .students-page .student-form {
  background: #111827 !important;
  border-color: #243244 !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page h1,
:global(body:is(.admin-dark-mode, .dark)) .students-page h2,
:global(body:is(.admin-dark-mode, .dark)) .students-page strong,
:global(body:is(.admin-dark-mode, .dark)) .students-page th,
:global(body:is(.admin-dark-mode, .dark)) .students-page label span {
  color: #f8fafc !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page p,
:global(body:is(.admin-dark-mode, .dark)) .students-page small,
:global(body:is(.admin-dark-mode, .dark)) .students-page td,
:global(body:is(.admin-dark-mode, .dark)) .students-page .empty-row,
:global(body:is(.admin-dark-mode, .dark)) .students-page .attendance-summary-row span,
:global(body:is(.admin-dark-mode, .dark)) .students-page .chart-legend,
:global(body:is(.admin-dark-mode, .dark)) .students-page .module-bar-label span {
  color: #cbd5e1 !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page input,
:global(body:is(.admin-dark-mode, .dark)) .students-page select {
  background: #0b1220 !important;
  border-color: #334155 !important;
  color: #e5edf7 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page input::placeholder {
  color: #94a3b8 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page th,
:global(body:is(.admin-dark-mode, .dark)) .students-page .attendance-summary-row span,
:global(body:is(.admin-dark-mode, .dark)) .students-page .detail-tabs,
:global(body:is(.admin-dark-mode, .dark)) .students-page .student-info-grid article,
:global(body:is(.admin-dark-mode, .dark)) .students-page .report-summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .students-page .chart-row {
  background: #0b1220 !important;
  border-color: #243244 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page .module-bar-row {
  background: #111827 !important;
  border-color: #243244 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page .pie-chart span {
  background: #111827 !important;
  color: #f8fafc !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page tbody tr.selected,
:global(body:is(.admin-dark-mode, .dark)) .students-page .day-row td {
  background: #172554 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .students-page td,
:global(body:is(.admin-dark-mode, .dark)) .students-page th {
  border-color: #243244 !important;
}

@media (max-width: 720px) {
  .page-header,
  .toolbar,
  .student-info-grid,
  .report-summary-grid,
  .report-toolbar,
  .module-bar-row,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    display: grid;
  }

  .chart-row {
    display: grid;
    justify-items: start;
  }
}
</style>

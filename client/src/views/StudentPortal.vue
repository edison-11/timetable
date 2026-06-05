<template>
  <div class="student-portal">
    <header class="portal-header">
      <div>
        <h1>Student Portal</h1>
        <p>Welcome, {{ student?.name || 'Student' }}</p>
      </div>
      <div class="portal-info">
        <span class="info-badge">{{ student?.class_name || 'No class assigned' }}</span>
        <span class="info-badge">{{ student?.academic_year || '' }}</span>
      </div>
    </header>

    <section class="student-info-section">
      <div class="portal-actions" role="tablist" aria-label="Student information sections">
        <button
          v-for="tab in infoTabs"
          :key="tab.value"
          type="button"
          class="portal-action-button"
          :class="{ active: activeInfoTab === tab.value }"
          @click="selectInfoTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeInfoTab === 'information'" class="student-info-grid">
        <article>
          <span>Student ID</span>
          <strong>{{ student?.student_number || '-' }}</strong>
        </article>
        <article>
          <span>Name</span>
          <strong>{{ student?.name || '-' }}</strong>
        </article>
        <article>
          <span>Sex</span>
          <strong>{{ student?.sex || '-' }}</strong>
        </article>
        <article>
          <span>Class</span>
          <strong>{{ student?.class_name || 'Unassigned' }}</strong>
        </article>
        <article>
          <span>Section</span>
          <strong>{{ student?.section_name || '-' }}</strong>
        </article>
        <article>
          <span>Academic Year</span>
          <strong>{{ student?.academic_year || '-' }}</strong>
        </article>
      </div>

      <div v-if="activeInfoTab === 'attendance'" class="attendance-panel">
        <div class="attendance-summary-row">
          <span><strong>{{ attendanceHistory.length }}</strong> records</span>
          <span><strong>{{ attendanceCounts.present }}</strong> present</span>
          <span><strong>{{ attendanceCounts.absent }}</strong> absent</span>
          <span><strong>{{ attendanceCounts.late }}</strong> late</span>
          <span><strong>{{ attendanceCounts.excused }}</strong> excused</span>
        </div>

        <div class="attendance-table-wrap">
          <table class="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period / Module</th>
                <th>Status</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in attendanceHistory" :key="record.attendance_id">
                <td>{{ formatDate(record.attendance_date) }}</td>
                <td>
                  <strong>{{ record.module_name || record.period_label || 'Study period' }}</strong>
                  <small>{{ formatRecordTimeRange(record) }}</small>
                </td>
                <td><span class="attendance-status" :class="record.status">{{ record.status }}</span></td>
                <td>{{ record.teacher_name || '-' }}</td>
              </tr>
              <tr v-if="!attendanceHistory.length">
                <td colspan="4" class="empty-row">
                  {{ loadingAttendance ? 'Loading attendance...' : 'No attendance records available.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeInfoTab === 'report'" class="report-panel">
        <div class="report-toolbar">
          <label>
            <span>Period</span>
            <select v-model="reportPeriod" class="form-select">
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
            <strong>{{ reportSummary.presentRate }}%</strong>
          </article>
          <article>
            <span>Present</span>
            <strong>{{ reportSummary.present }}</strong>
          </article>
          <article>
            <span>Absent</span>
            <strong>{{ reportSummary.absent }}</strong>
          </article>
          <article>
            <span>Late / Excused</span>
            <strong>{{ reportSummary.late + reportSummary.excused }}</strong>
          </article>
        </div>

        <div class="module-report-list">
          <div v-for="module in moduleReportRows" :key="module.name" class="module-report-row">
            <div>
              <strong>{{ module.name }}</strong>
              <span>{{ module.present }}/{{ module.total }} attended</span>
            </div>
            <div class="module-bar-track">
              <span :style="{ width: `${module.rate}%` }"></span>
            </div>
            <strong>{{ module.rate }}%</strong>
          </div>
          <p v-if="!moduleReportRows.length" class="empty-row">
            {{ loadingAttendance ? 'Loading report...' : 'No report data available for this period.' }}
          </p>
        </div>
      </div>
    </section>

    <section class="timetable-section">
      <div class="section-header">
        <h2>My Timetable</h2>
        <div class="timetable-controls">
          <select v-model="selectedAcademicYear" class="form-select">
            <option value="">Select Academic Year</option>
            <option v-for="year in academicYears" :key="year" :value="year">{{ year }}</option>
          </select>
          <select v-model="selectedTerm" class="form-select">
            <option value="">Select Term</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <button class="btn-primary" @click="loadTimetable" :disabled="loading">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 14-5M20 11a8 8 0 0 1-14 5M18 3v5h-5M6 21v-5h5"/></svg>
            Refresh
          </button>
          <div class="export-dropdown">
            <button class="btn-secondary" @click="toggleExportDropdown">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 12l-4-4m4 4 4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"/></svg>
              Export
            </button>
            <div v-if="showExportDropdown" class="export-menu">
              <button @click="handleExportPDF">PDF</button>
              <button @click="handleExportWord">Word</button>
              <button @click="handlePrint">Print</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading timetable...</p>
      </div>

      <div v-else-if="timetable.length > 0" class="timetable-container">
        <table class="timetable-grid">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Time</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in buildTimetableGrid()" :key="row.key" :class="{ 'break-row': row.type === 'break' }">
              <td class="period-col">
                <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                <span v-else>{{ row.period }}</span>
              </td>
              <td class="time-col">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
              <td v-if="row.type === 'break'" :colspan="5" class="break-fill"></td>
              <td v-for="day in days" v-else :key="day">
                <div v-if="row.entriesByDay[day]" class="module-cell">
                  <strong>{{ row.entriesByDay[day].module_name }}</strong>
                  <small>{{ row.entriesByDay[day].teacher_name }}</small>
                  <span class="room-badge">{{ row.entriesByDay[day].room_name || 'TBA' }}</span>
                </div>
                <span v-else class="empty-slot"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 8h3v3H9z"/></svg>
        <h2>No timetable available</h2>
        <p>Select an academic year and term to view your timetable.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { exportToPDF, exportToWord, printTimetable } from '@/utils/exportTimetable'
import { FIXED_DAYS, buildFixedTimetableRows } from '@/utils/fixedTimetableStructure'

const authStore = useAuthStore()
const loading = ref(false)
const student = ref(null)
const timetable = ref([])
const selectedAcademicYear = ref('')
const selectedTerm = ref('')
const academicYears = ref(['2024-2025', '2025-2026'])
const showExportDropdown = ref(false)
const activeInfoTab = ref('information')
const attendanceHistory = ref([])
const loadingAttendance = ref(false)
const reportPeriod = ref('week')

const days = FIXED_DAYS
const infoTabs = [
  { label: 'Information', value: 'information' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Report', value: 'report' }
]

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

const attendanceCounts = computed(() => buildAttendanceCounts(attendanceHistory.value))

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
  return attendanceHistory.value.filter((record) => {
    const date = new Date(record.attendance_date)
    return date >= start && date <= end
  })
})

const reportSummary = computed(() => {
  const counts = buildAttendanceCounts(reportRecords.value)
  const total = reportRecords.value.length
  const attended = counts.present + counts.late + counts.excused
  return {
    ...counts,
    total,
    presentRate: total ? Math.round((attended / total) * 100) : 0
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

const loadStudentInfo = async () => {
  try {
    if (!authStore.user?.id) {
      await authStore.checkAuth()
    }

    if (!authStore.user?.id) return

    const response = await api.get('/students/user/' + authStore.user?.id)
    student.value = response.data
    if (student.value?.academic_year) {
      selectedAcademicYear.value = student.value.academic_year
    }
    await loadTimetable()
  } catch (error) {
    console.error('Error loading student info:', error)
  }
}

const loadTimetable = async () => {
  if (!student.value?.student_id) return
  
  loading.value = true
  try {
    const params = {}
    if (selectedAcademicYear.value) params.academic_year = selectedAcademicYear.value
    if (selectedTerm.value) params.term = selectedTerm.value
    
    const response = await api.get(`/students/${student.value.student_id}/timetable`, { params })
    timetable.value = response.data
  } catch (error) {
    console.error('Error loading timetable:', error)
  } finally {
    loading.value = false
  }
}

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  const s = start ? start.slice(0, 5) : ''
  const e = end ? end.slice(0, 5) : ''
  return `${s} - ${e}`
}

const formatRecordTimeRange = (record) => {
  if (record.start_time && record.end_time) return formatTimeRange(record.start_time, record.end_time)
  return record.period_label || '-'
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const buildTimetableGrid = () => {
  return buildFixedTimetableRows(timetable.value, days)
}

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value
}

const selectInfoTab = async (tab) => {
  activeInfoTab.value = tab
  if ((tab === 'attendance' || tab === 'report') && !attendanceHistory.value.length) {
    await loadAttendanceHistory()
  }
}

const loadAttendanceHistory = async () => {
  if (!student.value?.student_id) return

  loadingAttendance.value = true
  try {
    const response = await api.get(`/students/${student.value.student_id}/attendance-history`)
    attendanceHistory.value = response.data.attendance || []
  } catch (error) {
    console.error('Error loading attendance history:', error)
  } finally {
    loadingAttendance.value = false
  }
}

const handleExportPDF = () => {
  exportToPDF(timetable.value, student.value?.class_name || 'My_Timetable')
  showExportDropdown.value = false
}

const handleExportWord = () => {
  exportToWord(timetable.value, student.value?.class_name || 'My_Timetable')
  showExportDropdown.value = false
}

const handlePrint = () => {
  printTimetable(timetable.value, student.value?.class_name || 'My_Timetable')
  showExportDropdown.value = false
}

onMounted(() => {
  loadStudentInfo()
})
</script>

<style scoped>
.student-portal {
  min-height: 100vh;
  padding: 2rem;
  background: #f5f9ff;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e6f0ff;
}

.portal-header h1 {
  margin: 0 0 0.5rem 0;
  color: #0066cc;
  font-size: 2rem;
}

.portal-header p {
  margin: 0;
  color: #333;
}

.portal-info {
  display: flex;
  gap: 1rem;
}

.info-badge {
  padding: 0.5rem 1rem;
  background: #e6f0ff;
  color: #0066cc;
  border-radius: 0.5rem;
  font-weight: 600;
}

.timetable-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.student-info-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  padding: 1.25rem;
}

.portal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.portal-action-button {
  min-width: 120px;
  min-height: 48px;
  padding: 0.75rem 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.portal-action-button:hover {
  background: #d8e0eb;
  border-color: #b8c6d8;
  transform: translateY(-1px);
}

.portal-action-button.active {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.student-info-grid,
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.student-info-grid article,
.report-summary-grid article {
  min-height: 82px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.student-info-grid span,
.report-summary-grid span,
.report-toolbar span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.student-info-grid strong,
.report-summary-grid strong,
.report-toolbar strong {
  display: block;
  margin-top: 0.35rem;
  color: #0f172a;
  font-size: 1rem;
}

.attendance-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.attendance-summary-row span {
  min-width: 112px;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.875rem;
}

.attendance-summary-row strong {
  color: #0f172a;
}

.attendance-table-wrap {
  overflow-x: auto;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th,
.attendance-table td {
  padding: 0.875rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.attendance-table th {
  background: #f8fafc;
  color: #334155;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.attendance-table small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
}

.attendance-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: capitalize;
}

.attendance-status.present {
  background: #dcfce7;
  color: #166534;
}

.attendance-status.absent {
  background: #fee2e2;
  color: #991b1b;
}

.attendance-status.late {
  background: #fef3c7;
  color: #92400e;
}

.attendance-status.excused {
  background: #dbeafe;
  color: #1d4ed8;
}

.report-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.module-report-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.module-report-row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) minmax(120px, 2fr) 52px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.module-report-row span {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.8rem;
}

.module-bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.module-bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0066cc;
}

.empty-row {
  color: #64748b;
  text-align: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0;
  color: #000;
}

.timetable-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.form-select {
  padding: 0.5rem 1rem;
  border: 1px solid #cce0ff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  min-width: 150px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #004499 0%, #003366 100%);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary svg {
  width: 16px;
  height: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e6f0ff;
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.timetable-grid {
  width: 100%;
  border-collapse: collapse;
}

.timetable-grid th,
.timetable-grid td {
  padding: 1rem;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.timetable-grid th {
  background: #0066cc;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
}

.timetable-grid td {
  background: white;
}

.module-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  min-height: 80px;
}

.module-cell strong {
  color: #0066cc;
  font-size: 0.875rem;
}

.module-cell small {
  color: #64748b;
  font-size: 0.75rem;
}

.room-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #cce0ff;
  color: #0066cc;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.empty-slot {
  display: block;
  min-height: 80px;
  background: #f1f5f9;
  border-radius: 0.5rem;
}

.break-row {
  background: #fef3c7;
}

.break-label {
  font-weight: 600;
  color: #92400e;
}

.break-fill {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: #64748b;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0;
  color: #333;
}

.empty-state p {
  margin: 0;
}

@media (max-width: 760px) {
  .student-portal {
    padding: 1rem;
  }

  .portal-header,
  .section-header {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
  }

  .portal-info,
  .timetable-controls {
    flex-wrap: wrap;
  }

  .portal-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-action-button {
    width: 100%;
    min-width: 0;
  }

  .module-report-row {
    grid-template-columns: 1fr;
  }
}
</style>

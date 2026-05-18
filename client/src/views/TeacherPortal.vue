<template>
  <div class="teacher-portal">
    <header class="portal-header">
      <div>
        <h1>Teacher Portal</h1>
        <p>Welcome, {{ teacher?.name || 'Teacher' }}</p>
      </div>
      <div class="portal-info">
        <span class="info-badge">{{ teacher?.department || 'No department' }}</span>
        <span class="info-badge" :class="{ 'status-active': teacher?.status === 'active', 'status-inactive': teacher?.status !== 'active' }">
          {{ teacher?.status || 'Unknown' }}
        </span>
      </div>
    </header>

    <section class="timetable-section">
      <div class="section-header">
        <h2>My Schedule</h2>
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
          <button class="btn-primary" @click="loadSchedule" :disabled="loading">
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
              <button @click="handleExportICal">iCal</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>

      <div v-else-if="schedule.length > 0" class="timetable-container">
        <table class="timetable-grid">
          <thead>
            <tr>
              <th>Period</th>
              <th>Time</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in buildScheduleGrid()" :key="row.key" :class="{ 'break-row': row.type === 'break' }">
              <td class="period-col">
                <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                <span v-else>{{ row.period }}</span>
              </td>
              <td class="time-col">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
              <td v-if="row.type === 'break'" :colspan="5" class="break-fill"></td>
              <td v-for="day in days" v-else :key="day">
                <div v-if="row.entriesByDay[day]" class="module-cell">
                  <strong>{{ row.entriesByDay[day].module_name }}</strong>
                  <small>{{ row.entriesByDay[day].class_name }}</small>
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
        <h2>No schedule available</h2>
        <p>Select an academic year and term to view your schedule.</p>
      </div>
    </section>

    <section class="substitutions-section">
      <div class="section-header">
        <h2>Substitution Assignments</h2>
        <button class="btn-secondary" @click="loadSubstitutions" :disabled="loadingSubs">
          Refresh
        </button>
      </div>

      <div v-if="loadingSubs" class="loading-state">
        <div class="spinner"></div>
        <p>Loading substitutions...</p>
      </div>

      <div v-else-if="substitutions.length > 0" class="substitutions-list">
        <div v-for="sub in substitutions" :key="sub.substitution_id" class="substitution-card">
          <div class="substitution-header">
            <strong>{{ sub.class_name }}</strong>
            <span class="badge">{{ sub.substitution_date }}</span>
          </div>
          <div class="substitution-details">
            <p><strong>Module:</strong> {{ sub.module_name }}</p>
            <p><strong>Original Teacher:</strong> {{ sub.original_teacher_name }}</p>
            <p><strong>Time:</strong> {{ sub.start_time }} - {{ sub.end_time }}</p>
            <p><strong>Room:</strong> {{ sub.room_name || 'TBA' }}</p>
            <p v-if="sub.notes"><strong>Notes:</strong> {{ sub.notes }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1 2 2 3-4"/></svg>
        <h2>No substitution assignments</h2>
        <p>You have no upcoming substitution assignments.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { exportToPDF, exportToWord, exportToICal, printTimetable } from '@/utils/exportTimetable'

const authStore = useAuthStore()
const loading = ref(false)
const loadingSubs = ref(false)
const teacher = ref(null)
const schedule = ref([])
const substitutions = ref([])
const selectedAcademicYear = ref('')
const selectedTerm = ref('')
const academicYears = ref(['2024-2025', '2025-2026'])
const showExportDropdown = ref(false)

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const loadTeacherInfo = async () => {
  try {
    const response = await api.get('/api/teachers/' + authStore.user?.id)
    teacher.value = response.data
  } catch (error) {
    console.error('Error loading teacher info:', error)
  }
}

const loadSchedule = async () => {
  if (!teacher.value?.teacher_id) return
  
  loading.value = true
  try {
    const response = await api.get(`/api/teachers/${teacher.value.teacher_id}/schedule`, {
      params: {
        academic_year: selectedAcademicYear.value,
        term: selectedTerm.value
      }
    })
    schedule.value = response.data
  } catch (error) {
    console.error('Error loading schedule:', error)
  } finally {
    loading.value = false
  }
}

const loadSubstitutions = async () => {
  if (!teacher.value?.teacher_id) return
  
  loadingSubs.value = true
  try {
    const response = await api.get('/api/substitution', {
      params: {
        substitute_teacher_id: teacher.value.teacher_id,
        substitution_date: new Date().toISOString().split('T')[0]
      }
    })
    substitutions.value = response.data
  } catch (error) {
    console.error('Error loading substitutions:', error)
  } finally {
    loadingSubs.value = false
  }
}

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  const s = start ? start.slice(0, 5) : ''
  const e = end ? end.slice(0, 5) : ''
  return `${s} - ${e}`
}

const buildScheduleGrid = () => {
  const timeSlots = new Map()
  
  schedule.value.forEach(entry => {
    const key = `${entry.start_time}-${entry.end_time}`
    if (!timeSlots.has(key)) {
      timeSlots.set(key, {
        key,
        start_time: entry.start_time,
        end_time: entry.end_time,
        entriesByDay: {}
      })
    }
    timeSlots.get(key).entriesByDay[entry.day_of_week] = entry
  })
  
  const sortedSlots = Array.from(timeSlots.values()).sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  )
  
  return sortedSlots.map((slot, index) => ({
    ...slot,
    period: index + 1
  }))
}

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value
}

const handleExportPDF = () => {
  exportToPDF(schedule.value, teacher.value?.name || 'My_Schedule')
  showExportDropdown.value = false
}

const handleExportWord = () => {
  exportToWord(schedule.value, teacher.value?.name || 'My_Schedule')
  showExportDropdown.value = false
}

const handlePrint = () => {
  printTimetable(schedule.value, teacher.value?.name || 'My_Schedule')
  showExportDropdown.value = false
}

const handleExportICal = () => {
  exportToICal(schedule.value, teacher.value?.name || 'My_Schedule')
  showExportDropdown.value = false
}

onMounted(() => {
  loadTeacherInfo()
  loadSubstitutions()
})
</script>

<style scoped>
.teacher-portal {
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

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.timetable-section,
.substitutions-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
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

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #004499 0%, #003366 100%);
  transform: translateY(-1px);
}

.btn-secondary {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary svg,
.btn-secondary svg {
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

.substitutions-list {
  display: grid;
  gap: 1rem;
}

.substitution-card {
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}

.substitution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.substitution-header strong {
  color: #0066cc;
  font-size: 1.125rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  background: #cce0ff;
  color: #0066cc;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.substitution-details {
  display: grid;
  gap: 0.5rem;
}

.substitution-details p {
  margin: 0;
  color: #333;
  font-size: 0.875rem;
}

.substitution-details strong {
  color: #64748b;
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
</style>

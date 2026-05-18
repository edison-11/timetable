<template>
  <AppLayout>
    <div class="timetable-container">
      <header class="studio-header">
        <div>
          <p class="eyebrow">Scheduling workspace</p>
          <h1>Timetable Studio</h1>
          <p class="studio-subtitle">Assign teaching loads, set generation rules, and review class timetables from one control panel.</p>
        </div>
        <div class="studio-actions">
          <button class="icon-button" type="button" title="Refresh timetable" @click="loadTimetable">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-13.66 5.66M4 12A8 8 0 0 1 17.66 6.34M17 3v4h4M7 21v-4H3"/></svg>
          </button>
          <button class="btn-primary" type="button" @click="openAssignmentForm">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Add Assignment
          </button>
          <button class="btn-secondary" type="button" @click="printTimetable" :disabled="!displayedTimetables.length" title="Print timetable">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></svg>
            Print
          </button>
          <button class="btn-secondary" type="button" @click="downloadTimetable(exportFormat)" :disabled="!displayedTimetables.length" title="Download timetable">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>
            Download
          </button>
          <button class="btn-success" type="button" @click="generateTimetable" :disabled="loading">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-7 14-2-7-5 0Z"/></svg>
            {{ loading ? 'Working...' : 'Generate' }}
          </button>
        </div>
      </header>

      <section class="metrics-grid" aria-label="Timetable summary">
        <div class="metric-card">
          <span class="metric-icon class-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Zm4-12h6M8 11h6"/></svg>
          </span>
          <div><strong>{{ classes.length }}</strong><span>Classes</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon teacher-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1 2 2 3-4"/></svg>
          </span>
          <div><strong>{{ teachers.length }}</strong><span>Teachers</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon module-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 7h8M8 11h6"/></svg>
          </span>
          <div><strong>{{ modules.length }}</strong><span>Modules</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon schedule-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 8h3v3H9z"/></svg>
          </span>
          <div><strong>{{ timetableEntries.length }}</strong><span>Entries</span></div>
        </div>
      </section>

      <div v-if="assignmentMessage" class="status-message" :class="messageTone">
        {{ cleanMessage(assignmentMessage) }}
      </div>

      <div v-if="showAssignmentForm" class="modal-overlay" @click.self="closeAssignmentForm">
        <div class="assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignmentModalTitle">
          <div class="modal-header">
            <div>
              <p class="eyebrow">Teaching load</p>
              <h2 id="assignmentModalTitle">Add Assignment</h2>
            </div>
            <button class="icon-button" type="button" title="Close form" @click="closeAssignmentForm">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="form-grid">
            <div>
              <label class="form-label">Class</label>
              <select v-model="assignment.class_id" class="form-select">
                <option value="">Select Class</option>
                <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">{{ cls.class_name }}</option>
              </select>
            </div>
            <div>
              <div class="field-label-row">
                <label class="form-label">Teacher</label>
                <router-link to="/teachers" class="field-link">Add teacher</router-link>
              </div>
              <select v-model="assignment.teacher_id" class="form-select">
                <option value="">Select Teacher</option>
                <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">{{ teacher.name }}</option>
              </select>
            </div>
            <div>
              <div class="field-label-row">
                <label class="form-label">Module</label>
                <router-link to="/modules" class="field-link">Add module</router-link>
              </div>
              <select v-model="assignment.module_id" class="form-select">
                <option value="">Select Module</option>
                <option v-for="module in modules" :key="module.module_id" :value="module.module_id">{{ module.module_name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Academic Year</label>
              <input v-model="assignment.academic_year" class="form-control" placeholder="2024-2025">
            </div>
            <div>
              <label class="form-label">Term</label>
              <select v-model="assignment.term" class="form-select">
                <option value="">Select Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" type="button" @click="closeAssignmentForm">Cancel</button>
            <button class="btn-primary" type="button" @click="addAssignment" :disabled="loading">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              {{ loading ? 'Adding...' : 'Add Assignment' }}
            </button>
          </div>
        </div>
      </div>

      <section class="control-grid">
        <article class="panel-card">
          <div class="panel-heading">
            <span class="panel-icon generate-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 14-5M20 11a8 8 0 0 1-14 5M18 3v5h-5M6 21v-5h5"/></svg>
            </span>
            <div>
              <h2>Generation Rules</h2>
              <p>Choose scope, timing, days, and conflict buffers.</p>
            </div>
          </div>

          <div class="form-grid">
            <div>
              <label class="form-label">Class Scope</label>
              <select v-model="generateSettings.class_id" class="form-select">
                <option value="">All Classes</option>
                <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">{{ cls.class_name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Level</label>
              <select v-model="generateSettings.level" class="form-select">
                <option value="">All Levels</option>
                <option v-for="level in availableLevels" :key="level" :value="level">Level {{ level }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Start Time</label>
              <input v-model="generateSettings.start_time" type="time" class="form-control">
            </div>
            <div>
              <label class="form-label">End Time</label>
              <input v-model="generateSettings.end_time" type="time" class="form-control">
            </div>
            <div>
              <label class="form-label">Period Minutes</label>
              <input v-model.number="generateSettings.period_minutes" type="number" class="form-control" min="30" max="180">
            </div>
            <div>
              <label class="form-label">Teacher Changeover</label>
              <input v-model.number="generateSettings.teacher_changeover_minutes" type="number" class="form-control" min="0" max="60">
            </div>
          </div>

          <div class="day-picker" aria-label="Generation days">
            <label v-for="day in days" :key="day" class="day-chip" :class="{ active: generateSettings.selected_days.includes(day) }">
              <input v-model="generateSettings.selected_days" :value="day" type="checkbox">
              {{ day.slice(0, 3) }}
            </label>
          </div>

          <label class="replace-toggle">
            <input v-model="generateSettings.replace_existing" type="checkbox">
            <span>Replace existing timetable entries when generating</span>
          </label>

          <div class="status-control">
            <label class="form-label">Timetable Status</label>
            <select v-model="generateSettings.status" class="form-select">
              <option value="draft">Draft (Not visible to students)</option>
              <option value="published">Published (Visible to students)</option>
            </select>
            <small class="form-hint">Draft timetables allow you to work on next semester's schedule without affecting current student views.</small>
          </div>
        </article>
      </section>

      <section class="advanced-grid">
        <article class="panel-card">
          <div class="panel-heading compact">
            <span class="panel-icon rules-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            </span>
            <div>
              <h2>Break Rules</h2>
              <p>Control break placement by teaching-period counts.</p>
            </div>
            <div class="form-switch">
              <input id="periodRulesEnabled" v-model="generateSettings.break_period_rules.enabled" type="checkbox">
              <label for="periodRulesEnabled">Enabled</label>
            </div>
          </div>

          <fieldset :disabled="!generateSettings.break_period_rules.enabled" class="period-rules-grid">
            <div>
              <label class="form-label">Before Morning Break</label>
              <input v-model.number="generateSettings.break_period_rules.periods_before_morning_break" type="number" min="1" class="form-control">
            </div>
            <div>
              <label class="form-label">Before Lunch</label>
              <input v-model.number="generateSettings.break_period_rules.periods_before_lunch" type="number" min="1" class="form-control">
            </div>
            <div>
              <label class="form-label">Before Evening Break</label>
              <input v-model.number="generateSettings.break_period_rules.periods_before_afternoon_break" type="number" min="1" class="form-control">
            </div>
            <div>
              <label class="form-label">After Evening Break</label>
              <input v-model.number="generateSettings.break_period_rules.periods_after_afternoon_break" type="number" min="0" class="form-control">
            </div>
            <div>
              <label class="form-label">Morning Break Minutes</label>
              <input v-model.number="generateSettings.break_period_rules.morning_break_minutes" type="number" min="1" class="form-control">
            </div>
            <div>
              <label class="form-label">Lunch Minutes</label>
              <input v-model.number="generateSettings.break_period_rules.lunch_break_minutes" type="number" min="1" class="form-control">
            </div>
            <div>
              <label class="form-label">Evening Break Minutes</label>
              <input v-model.number="generateSettings.break_period_rules.afternoon_break_minutes" type="number" min="1" class="form-control">
            </div>
          </fieldset>
        </article>

        <article class="panel-card">
          <div class="panel-heading compact">
            <span class="panel-icon activity-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M7 6v14M17 6v14M5 20h14M9 10h6M9 14h6"/></svg>
            </span>
            <div>
              <h2>Shared Activities</h2>
              <p>Assembly, exams, or events placed across selected classes.</p>
            </div>
            <button class="btn-secondary" type="button" @click="addSharedActivity">Add Activity</button>
          </div>

          <div v-if="!sharedActivities.length" class="shared-empty">No shared activities added.</div>

          <div v-for="(activity, index) in sharedActivities" :key="activity.id" class="shared-activity-row">
            <div>
              <label class="form-label">Activity</label>
              <input v-model="activity.activity_name" type="text" class="form-control" placeholder="Assembly">
            </div>
            <div>
              <label class="form-label">Day</label>
              <select v-model="activity.day_of_week" class="form-select">
                <option value="all">All selected days</option>
                <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Start</label>
              <input v-model="activity.start_time" type="time" class="form-control">
            </div>
            <div>
              <label class="form-label">End</label>
              <input v-model="activity.end_time" type="time" class="form-control">
            </div>
            <button class="btn-danger" type="button" @click="removeSharedActivity(index)" title="Remove activity">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </article>
      </section>

      <section class="generation-bar">
        <div>
          <strong>{{ generationSummary }}</strong>
          <span>{{ generateSettings.start_time }} - {{ generateSettings.end_time }} with {{ generateSettings.period_minutes }} minute periods</span>
        </div>
        <button class="btn-success" type="button" @click="generateTimetable" :disabled="loading">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-7 14-2-7-5 0Z"/></svg>
          {{ loading ? 'Generating...' : 'Generate Timetable' }}
        </button>
      </section>

      <section v-if="displayedTimetables.length > 0" class="timetable-output-card">
        <div class="output-toolbar">
          <div>
            <p class="eyebrow">Generated view</p>
            <h2>Class Timetable</h2>
          </div>
          <div class="output-actions">
            <button class="btn-secondary" type="button" @click="copyTimetableSummary">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v13H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"/></svg>
              Copy
            </button>
            <button class="btn-secondary" type="button" @click="printTimetable">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></svg>
              Print
            </button>
            <select v-model="exportFormat" class="form-select export-select" aria-label="Download format">
              <option value="csv">CSV</option>
              <option value="xls">Excel (.xls)</option>
              <option value="doc">Word (.doc)</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="txt">Text</option>
              <option value="html">HTML</option>
            </select>
            <button class="btn-secondary" type="button" @click="downloadTimetable(exportFormat)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>
              Download
            </button>
            <div class="timetable-class-filter">
              <label class="form-label">Display</label>
              <select v-model="selectedTimetableClassId" class="form-select">
                <option value="">All Classes</option>
                <option v-for="cls in classesWithTimetables" :key="cls.class_id" :value="String(cls.class_id)">
                  {{ cls.class_name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-for="group in displayedTimetables" :key="group.class_id" class="timetable-group">
          <div class="timetable-header">
            <div class="timetable-meta">
              <strong>{{ group.class_name }}</strong>
              <span>Level: {{ group.level || 'No level set' }}</span>
              <span>Room: {{ group.room_name || 'No room set' }}</span>
            </div>
            <div class="timetable-actions">
              <span class="badge">{{ group.entries.length }} entries</span>
              <div class="export-dropdown">
                <button class="btn-secondary" @click="toggleExportDropdown(group.class_id)">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 12l-4-4m4 4 4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"/></svg>
                  Export
                </button>
                <div v-if="activeExportDropdown === group.class_id" class="export-menu">
                  <button @click="handleExportPDF(group)">PDF</button>
                  <button @click="handleExportWord(group)">Word</button>
                  <button @click="handlePrint(group)">Print</button>
                  <button @click="handleExportICal(group)">iCal</button>
                </div>
              </div>
            </div>
          </div>
          <div class="table-responsive">
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
                <tr v-for="row in buildTimetableGridWithBreaks(group)" :key="row.key" :class="row.type === 'break' ? `break-row ${row.breakType}` : ''">
                  <td class="period-col" :class="row.breakType">
                    <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                    <span v-else>{{ row.period }}</span>
                  </td>
                  <td class="time-col" :class="row.breakType">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                  <td v-if="row.type === 'break'" :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                  <td v-for="day in days" v-else :key="day">
                    <div
                      v-if="row.entriesByDay[day]"
                      class="module-cell"
                      :class="{ 'activity-cell': row.entriesByDay[day].entry_type === 'activity' }"
                      :data-module="row.entriesByDay[day].module_name"
                    >
                      <strong>{{ row.entriesByDay[day].module_name }}</strong>
                      <small>{{ row.entriesByDay[day].teacher_name || (row.entriesByDay[day].entry_type === 'activity' ? 'Shared activity' : '') }}</small>
                      <span v-if="row.entriesByDay[day].entry_type !== 'activity'" class="room-badge">{{ row.entriesByDay[day].room_name || row.entriesByDay[day].room || group.room_name || 'TBA' }}</span>
                    </div>
                    <span v-else class="empty-slot"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-else class="empty-state">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 8h3v3H9z"/></svg>
        <h2>No timetable generated yet</h2>
        <p>Add assignments, confirm your generation rules, then create a timetable.</p>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'
import { exportToPDF, exportToWord, exportToICal, printTimetable as printClassTimetable } from '@/utils/exportTimetable'
import { downloadTimetablePdf } from '@/utils/timetablePdf'

const loading = ref(false)
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const timetableEntries = ref([])
const assignmentMessage = ref('')
const selectedTimetableClassId = ref('')
const sharedActivities = ref([])
const showAssignmentForm = ref(false)
const activeExportDropdown = ref(null)
const exportFormat = ref('csv')
let sharedActivityId = 0

const emptyAssignment = () => ({
  class_id: '',
  teacher_id: '',
  module_id: '',
  academic_year: defaultAcademicYear(),
  term: 'Term 1'
})

const assignment = ref(emptyAssignment())

const generateSettings = ref({
  class_id: '',
  level: '',
  start_time: '08:00',
  end_time: '19:45',
  period_minutes: 60,
  teacher_changeover_minutes: 5,
  replace_existing: true,
  selected_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  status: 'draft',
  break_period_rules: {
    enabled: true,
    periods_before_morning_break: 3,
    periods_before_lunch: 2,
    periods_before_afternoon_break: 3,
    periods_after_afternoon_break: 2,
    morning_break_minutes: 30,
    lunch_break_minutes: 45,
    afternoon_break_minutes: 30
  }
})

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function defaultAcademicYear() {
  const today = new Date()
  const startYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

const messageTone = computed(() => {
  const text = assignmentMessage.value.toLowerCase()
  return text.includes('error') ? 'error' : 'success'
})

const generationSummary = computed(() => {
  const scope = generateSettings.value.class_id
    ? classes.value.find(cls => String(cls.class_id) === String(generateSettings.value.class_id))?.class_name || 'Selected class'
    : 'All classes'
  const daysCount = generateSettings.value.selected_days.length
  return `${scope} across ${daysCount} day${daysCount === 1 ? '' : 's'}`
})

const cleanMessage = (message) => {
  return String(message || '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/^\s*(Adding|Generating)?\s*/, '')
    .trim()
}

const getApiErrorMessage = (error, fallback = 'Request failed.') => {
  const data = error.response?.data
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map(item => item.msg).filter(Boolean).join(', ')
  }
  return data?.message || error.message || fallback
}

const openAssignmentForm = () => {
  assignment.value = emptyAssignment()
  showAssignmentForm.value = true
}

const closeAssignmentForm = () => {
  showAssignmentForm.value = false
  assignment.value = emptyAssignment()
}

const addSharedActivity = () => {
  sharedActivities.value.push({
    id: ++sharedActivityId,
    activity_name: '',
    day_of_week: 'all',
    start_time: '08:00',
    end_time: '09:00'
  })
}

const removeSharedActivity = (index) => {
  sharedActivities.value.splice(index, 1)
}

const buildSharedActivitiesPayload = () => {
  return sharedActivities.value.flatMap((activity) => {
    const activityName = activity.activity_name.trim()
    if (!activityName || !activity.start_time || !activity.end_time) return []

    const activityDays = activity.day_of_week === 'all'
      ? generateSettings.value.selected_days
      : [activity.day_of_week]

    return activityDays
      .filter((day) => days.includes(day))
      .map((day) => ({
        activity_name: activityName,
        day_of_week: day,
        start_time: activity.start_time,
        end_time: activity.end_time
      }))
  })
}

const availableLevels = computed(() => {
  const levels = new Set()
  classes.value.forEach(cls => {
    if (cls.level) levels.add(cls.level)
  })
  return Array.from(levels).sort()
})

const groupedTimetables = computed(() => {
  const groups = new Map()
  timetableEntries.value.forEach(entry => {
    if (!entry.module_name || entry.module_name === 'continue') return
    const classId = entry.class_id
    const classRecord = classes.value.find(cls => String(cls.class_id) === String(classId))
    if (!groups.has(classId)) {
      groups.set(classId, {
        class_id: classId,
        class_name: entry.class_name || classRecord?.class_name,
        level: entry.level || classRecord?.level,
        room_name: entry.room_name || entry.room || classRecord?.room_name,
        entries: []
      })
    }
    const group = groups.get(classId)
    if (!group.room_name && (entry.room_name || entry.room || classRecord?.room_name)) {
      group.room_name = entry.room_name || entry.room || classRecord?.room_name
    }
    groups.get(classId).entries.push(entry)
  })
  return Array.from(groups.values())
})

const classesWithTimetables = computed(() => {
  return groupedTimetables.value
    .map(group => ({
      class_id: group.class_id,
      class_name: group.class_name || `Class ${group.class_id}`
    }))
    .sort((a, b) => String(a.class_name).localeCompare(String(b.class_name)))
})

const displayedTimetables = computed(() => {
  const selectedId = selectedTimetableClassId.value || classesWithTimetables.value[0]?.class_id
  if (!selectedId) return []
  return groupedTimetables.value.filter(group => String(group.class_id) === String(selectedId))
})

const ensureSelectedTimetableClass = () => {
  const availableClasses = classesWithTimetables.value
  if (!availableClasses.length) {
    selectedTimetableClassId.value = ''
    return
  }

  const hasSelectedClass = availableClasses.some(cls => String(cls.class_id) === String(selectedTimetableClassId.value))
  if (!hasSelectedClass) {
    selectedTimetableClassId.value = String(availableClasses[0].class_id)
  }
}

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  const s = start ? start.slice(0, 5) : ''
  const e = end ? end.slice(0, 5) : ''
  return `${s} - ${e}`
}

const isBreakEntry = (entry) => {
  return entry.entry_type === 'break' || String(entry.module_name || '').toLowerCase().includes('break')
}

const toggleExportDropdown = (classId) => {
  activeExportDropdown.value = activeExportDropdown.value === classId ? null : classId
}

const withGroupRoomFallback = (rows, group) => {
  return rows.map((row) => {
    if (row.type === 'break') return row
    const entriesByDay = {}
    days.forEach((day) => {
      const entry = row.entriesByDay?.[day]
      entriesByDay[day] = entry
        ? { ...entry, room_name: entry.room_name || entry.room || group.room_name }
        : entry
    })
    return { ...row, entriesByDay }
  })
}

const getExportOptions = (group) => ({
  rows: withGroupRoomFallback(buildTimetableGridWithBreaks(group), group),
  level: group.level,
  roomName: group.room_name
})

const handleExportPDF = (group) => {
  exportToPDF(group.entries, group.class_name, getExportOptions(group))
  activeExportDropdown.value = null
}

const handleExportWord = (group) => {
  exportToWord(group.entries, group.class_name, getExportOptions(group))
  activeExportDropdown.value = null
}

const handlePrint = (group) => {
  printClassTimetable(group.entries, group.class_name, getExportOptions(group))
  activeExportDropdown.value = null
}

const handleExportICal = (group) => {
  exportToICal(group.entries, group.class_name)
  activeExportDropdown.value = null
}

const getBreakType = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('morning')) return 'morning-break'
  if (normalized.includes('lunch')) return 'lunch-break'
  return 'evening-break'
}

const getBreakLabel = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('morning')) return 'MORNING BREAK'
  if (normalized.includes('lunch')) return 'LUNCH BREAK'
  return 'EVENING BREAK'
}

const buildTimetableGridRows = (group) => {
  const timeSlots = new Map()
  group.entries.filter(entry => !isBreakEntry(entry)).forEach(entry => {
    const start = entry.start_time?.slice(0, 5)
    const end = entry.end_time?.slice(0, 5)
    if (start && end) {
      const key = `${start}-${end}`
      if (!timeSlots.has(key)) {
        timeSlots.set(key, { key, type: 'period', start_time: start, end_time: end, entriesByDay: {} })
      }
      timeSlots.get(key).entriesByDay[entry.day_of_week] = entry
    }
  })
  const rows = Array.from(timeSlots.values())
  rows.sort((a, b) => a.start_time.localeCompare(b.start_time))
  return rows.map((row, index) => ({ ...row, period: index + 1 }))
}

const buildBreakRows = (group) => {
  const breakSlots = new Map()

  group.entries.filter(isBreakEntry).forEach(entry => {
    const start = entry.start_time?.slice(0, 5)
    const end = entry.end_time?.slice(0, 5)
    if (!start || !end) return

    const label = getBreakLabel(entry.module_name)
    const key = `break-${label}-${start}-${end}`
    if (!breakSlots.has(key)) {
      breakSlots.set(key, {
        key,
        type: 'break',
        breakType: getBreakType(label),
        label,
        start_time: start,
        end_time: end,
        entriesByDay: {},
        latestId: 0
      })
    }
    breakSlots.get(key).latestId = Math.max(
      breakSlots.get(key).latestId,
      Number(entry.timetable_id) || 0
    )
  })

  const latestByLabel = new Map()
  Array.from(breakSlots.values()).forEach((row) => {
    const current = latestByLabel.get(row.label)
    if (!current || row.latestId > current.latestId) {
      latestByLabel.set(row.label, row)
    }
  })

  return Array.from(latestByLabel.values()).sort((a, b) => a.start_time.localeCompare(b.start_time))
}

const buildTimetableGridWithBreaks = (group) => {
  const allRows = buildTimetableGridRows(group)
  const rules = generateSettings.value.break_period_rules

  if (!rules.enabled) {
    const savedBreakRows = buildBreakRows(group)
    const combinedRows = [...allRows, ...savedBreakRows].sort((a, b) => {
      const timeDiff = a.start_time.localeCompare(b.start_time)
      if (timeDiff !== 0) return timeDiff
      if (a.type === b.type) return 0
      return a.type === 'break' ? -1 : 1
    })

    let period = 0
    return combinedRows.map((row) => {
      if (row.type === 'break') return row
      period += 1
      return { ...row, period }
    })
  }

  const resultRows = []
  const morningAfter = Number(rules.periods_before_morning_break) || 3
  const periodsBeforeLunch = Number(rules.periods_before_lunch) || 2
  const periodsBeforeEvening = Number(rules.periods_before_afternoon_break) || 3
  const periodsAfterEvening = Number(rules.periods_after_afternoon_break) || 0
  const lunchAfter = morningAfter + periodsBeforeLunch
  const eveningAfter = lunchAfter + periodsBeforeEvening
  const totalRulePeriods = eveningAfter + periodsAfterEvening
  const rows = allRows.slice(0, totalRulePeriods)
  const formattedBreakPoints = [
    { after: morningAfter, breakType: 'morning-break', label: 'MORNING BREAK' },
    { after: lunchAfter, breakType: 'lunch-break', label: 'LUNCH BREAK' },
    { after: eveningAfter, breakType: 'evening-break', label: 'EVENING BREAK' }
  ]

  rows.forEach((row, index) => {
    resultRows.push(row)

    formattedBreakPoints.forEach(bp => {
      const nextRow = rows[index + 1]
      if (index + 1 === bp.after && nextRow) {
        resultRows.push({
          key: `${bp.breakType}-${row.end_time}-${nextRow.start_time}`,
          type: 'break',
          breakType: bp.breakType,
          label: bp.label,
          start_time: row.end_time,
          end_time: nextRow.start_time,
          entriesByDay: {}
        })
      }
    })
  })

  return resultRows
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const buildTimetableExportRows = () => {
  const rows = [['Class', 'Period', 'Time', ...days]]

  displayedTimetables.value.forEach((group) => {
    buildTimetableGridWithBreaks(group).forEach((row) => {
      if (row.type === 'break') {
        rows.push([
          group.class_name || `Class ${group.class_id}`,
          row.label,
          formatTimeRange(row.start_time, row.end_time),
          ...days.map(() => row.label)
        ])
        return
      }

      rows.push([
        group.class_name || `Class ${group.class_id}`,
        row.period,
        formatTimeRange(row.start_time, row.end_time),
        ...days.map((day) => {
          const entry = row.entriesByDay[day]
          if (!entry) return 'Free'
          const room = entry.entry_type === 'activity' ? 'Shared activity' : (entry.room_name || entry.room || 'TBA')
          return `${entry.module_name || 'Untitled'} - ${entry.teacher_name || 'No teacher'} - ${room}`
        })
      ])
    })
  })

  return rows
}

const buildTimetableCsv = () => {
  const rows = buildTimetableExportRows()
  return rows.map(row => row.map(escapeCsvValue).join(',')).join('\n')
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const buildTimetableHtml = () => {
  const header = ['Time', ...days].map(cell => `<th>${escapeHtml(cell)}</th>`).join('')
  const body = displayedTimetables.value.map((group) => {
    const groupHeader = `<tr class="class-row"><td colspan="${days.length + 1}">${escapeHtml(group.class_name || `Class ${group.class_id}`)}</td></tr>`
    const rows = buildTimetableGridWithBreaks(group).map((row) => {
      if (row.type === 'break') {
        return `<tr class="break-row ${row.breakType}"><td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td><td colspan="${days.length}">${escapeHtml(row.label)}</td></tr>`
      }

      const cells = days.map((day) => {
        const entry = row.entriesByDay[day]
        if (!entry) return '<td class="empty-cell"></td>'
        const room = entry.entry_type === 'activity' ? 'Shared activity' : (entry.room_name || entry.room || 'TBA')
        return `<td><div class="module-cell ${entry.entry_type === 'activity' ? 'activity-cell' : ''}">
          <strong>${escapeHtml(entry.module_name || 'Untitled')}</strong>
          <span>${escapeHtml(entry.teacher_name || 'No teacher')}</span>
          <small>${escapeHtml(room)}</small>
        </div></td>`
      }).join('')
      return `<tr><td class="time-cell">${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>${cells}</tr>`
    }).join('')
    return groupHeader + rows
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Class Timetables</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; vertical-align: top; height: 54px; }
    th { background: #0f2f5f; color: white; text-align: left; }
    .class-row td { background: #dbeafe; font-weight: 800; font-size: 14px; }
    .time-cell { background: #f8fafc; font-weight: 700; }
    .empty-cell { background: #ffffff; }
    .module-cell { min-height: 42px; padding: 6px; border-left: 5px solid #2563eb; background: #eff6ff; border-radius: 6px; }
    .module-cell.activity-cell { border-left-color: #16a34a; background: #f0fdf4; }
    .module-cell strong, .module-cell span, .module-cell small { display: block; }
    .break-row td { background: #e8f7e9; font-weight: 700; text-align: center; }
    .break-row.lunch-break td { background: #fff4c7; }
    .break-row.evening-break td { background: #e9f2ff; }
  </style>
</head>
<body>
  <h1>Class Timetables</h1>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`
}

const buildPdfRows = () => {
  const rows = []
  displayedTimetables.value.forEach((group) => {
    rows.push({
      type: 'group',
      cells: [
        { text: group.class_name || `Class ${group.class_id}`, fill: '#dbeafe', bold: true },
        ...days.map(() => ({ text: '', fill: '#dbeafe' }))
      ]
    })

    buildTimetableGridWithBreaks(group).forEach((row) => {
      if (row.type === 'break') {
        const fill = row.breakType === 'lunch-break' ? '#fff4c7' : row.breakType === 'evening-break' ? '#e9f2ff' : '#e8f7e9'
        rows.push({
          type: 'break',
          cells: [
            { text: formatTimeRange(row.start_time, row.end_time), fill, bold: true },
            ...days.map(() => ({ text: row.label, fill, bold: true }))
          ]
        })
        return
      }

      rows.push({
        type: 'period',
        cells: [
          { text: formatTimeRange(row.start_time, row.end_time), fill: '#f8fafc', bold: true },
          ...days.map((day) => {
            const entry = row.entriesByDay[day]
            if (!entry) return { text: '', fill: '#ffffff' }
            const room = entry.entry_type === 'activity' ? 'Shared activity' : (entry.room_name || entry.room || 'TBA')
            return {
              text: `${entry.module_name || 'Untitled'}\n${entry.teacher_name || 'No teacher'}\n${room}`,
              fill: entry.entry_type === 'activity' ? '#f0fdf4' : '#eff6ff',
              bold: true
            }
          })
        ]
      })
    })
  })
  return rows
}

const getExportBaseName = () => {
  const scope = selectedTimetableClassId.value
    ? classesWithTimetables.value.find(cls => String(cls.class_id) === selectedTimetableClassId.value)?.class_name || 'selected-class'
    : 'all-classes'
  return `timetable-${String(scope).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const openPdfPrintWindow = () => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) {
    assignmentMessage.value = 'Allow pop-ups to export PDF, then choose Save as PDF.'
    return
  }

  printWindow.document.write(buildTimetableHtml())
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const downloadTimetable = (format = 'csv') => {
  if (!displayedTimetables.value.length) {
    assignmentMessage.value = 'Generate or load a timetable before downloading.'
    return
  }

  const baseName = getExportBaseName()
  const rows = buildTimetableExportRows()
  const html = buildTimetableHtml()
  const selectedFormat = String(format || 'csv').toLowerCase()

  if (selectedFormat === 'pdf') {
    downloadTimetablePdf({
      title: 'Class Timetables',
      headers: ['Time', ...days],
      rows: buildPdfRows(),
      filename: `${baseName}.pdf`
    })
    assignmentMessage.value = 'PDF timetable downloaded.'
  } else if (selectedFormat === 'xls') {
    downloadBlob(html, `${baseName}.xls`, 'application/vnd.ms-excel;charset=utf-8')
    assignmentMessage.value = 'Excel timetable downloaded.'
  } else if (selectedFormat === 'doc') {
    downloadBlob(html, `${baseName}.doc`, 'application/msword;charset=utf-8')
    assignmentMessage.value = 'Word timetable downloaded.'
  } else if (selectedFormat === 'json') {
    downloadBlob(JSON.stringify(displayedTimetables.value, null, 2), `${baseName}.json`, 'application/json;charset=utf-8')
    assignmentMessage.value = 'JSON timetable downloaded.'
  } else if (selectedFormat === 'txt') {
    downloadBlob(rows.map(row => row.join(' | ')).join('\n'), `${baseName}.txt`, 'text/plain;charset=utf-8')
    assignmentMessage.value = 'Text timetable downloaded.'
  } else if (selectedFormat === 'html') {
    downloadBlob(html, `${baseName}.html`, 'text/html;charset=utf-8')
    assignmentMessage.value = 'HTML timetable downloaded.'
  } else {
    downloadBlob(buildTimetableCsv(), `${baseName}.csv`, 'text/csv;charset=utf-8')
    assignmentMessage.value = 'CSV timetable downloaded.'
  }

  setTimeout(() => { assignmentMessage.value = '' }, 3000)
}

const printTimetable = () => {
  if (!displayedTimetables.value.length) {
    assignmentMessage.value = 'Generate or load a timetable before printing.'
    return
  }

  window.print()
}

const copyTimetableSummary = async () => {
  if (!displayedTimetables.value.length) {
    assignmentMessage.value = 'Generate or load a timetable before copying.'
    return
  }

  const summary = displayedTimetables.value.map((group) => {
    const lines = [`${group.class_name || `Class ${group.class_id}`} (${group.entries.length} entries)`]
    buildTimetableGridWithBreaks(group).forEach((row) => {
      if (row.type === 'break') {
        lines.push(`${formatTimeRange(row.start_time, row.end_time)}: ${row.label}`)
        return
      }

      const lessons = days
        .map((day) => {
          const entry = row.entriesByDay[day]
          return entry ? `${day}: ${entry.module_name} (${entry.teacher_name || 'No teacher'})` : ''
        })
        .filter(Boolean)
        .join('; ')
      lines.push(`Period ${row.period} ${formatTimeRange(row.start_time, row.end_time)}: ${lessons || 'Free'}`)
    })
    return lines.join('\n')
  }).join('\n\n')

  try {
    await navigator.clipboard.writeText(summary)
    assignmentMessage.value = 'Timetable summary copied to clipboard.'
  } catch (error) {
    assignmentMessage.value = 'Copy failed, but download and print are available.'
  }
  setTimeout(() => { assignmentMessage.value = '' }, 3000)
}

const addAssignment = async () => {
  loading.value = true
  try {
    await api.post('/assignments', assignment.value)
    assignmentMessage.value = 'Assignment added successfully.'
    closeAssignmentForm()
    await loadSetupData()
    await loadTimetable()
    setTimeout(() => { assignmentMessage.value = '' }, 3000)
  } catch (error) {
    assignmentMessage.value = 'Error: ' + getApiErrorMessage(error, 'Failed to add assignment.')
  } finally {
    loading.value = false
  }
}

const generateTimetable = async () => {
  loading.value = true
  try {
    const rules = generateSettings.value.break_period_rules
    const payload = {
      ...generateSettings.value,
      replace_existing: true,
      days: generateSettings.value.selected_days,
      break_period_rules: rules,
      shared_activities: buildSharedActivitiesPayload()
    }

    if (rules.enabled) {
      payload.before_morning_break = rules.periods_before_morning_break
      payload.after_break_period = rules.periods_before_lunch
      payload.after_lunch_period = rules.periods_before_afternoon_break
      payload.after_noon_break_period = rules.periods_after_afternoon_break
      payload.morning_break_length = rules.morning_break_minutes
      payload.lunch_length = rules.lunch_break_minutes
      payload.noon_break_length = rules.afternoon_break_minutes
    }

    const response = await api.post('/timetable/generate', payload)
    assignmentMessage.value = 'Timetable generated. ' + (response.data.generated_count || 0) + ' entries created.'
    await loadTimetable()
    if (generateSettings.value.class_id) {
      selectedTimetableClassId.value = String(generateSettings.value.class_id)
    }
    setTimeout(() => { assignmentMessage.value = '' }, 3000)
  } catch (error) {
    assignmentMessage.value = 'Error: ' + getApiErrorMessage(error, 'Failed to generate timetable.')
  } finally {
    loading.value = false
  }
}

const loadClasses = async () => {
  try {
    const res = await api.get('/classes')
    classes.value = res.data.classes || []
  } catch (e) { console.error(e) }
}

const loadTeachers = async () => {
  try {
    const res = await api.get('/teachers')
    teachers.value = res.data.teachers || []
  } catch (e) { console.error(e) }
}

const loadModules = async () => {
  try {
    const res = await api.get('/modules')
    modules.value = res.data.modules || []
  } catch (e) { console.error(e) }
}

const loadSetupData = async () => {
  await Promise.all([loadClasses(), loadTeachers(), loadModules()])
}

const loadTimetable = async () => {
  try {
    const res = await api.get('/timetable')
    timetableEntries.value = res.data.timetables || []
    ensureSelectedTimetableClass()
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await loadSetupData()
  await loadTimetable()
})
</script>

<style scoped>
.timetable-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 0 2rem;
  color: #0f172a;
}

svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.studio-header,
.panel-card,
.generation-bar,
.timetable-output-card,
.empty-state {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.studio-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: center;
  padding: 1.35rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: #2563eb;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.studio-header h1,
.output-toolbar h2 {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: 0;
}

.studio-subtitle {
  max-width: 740px;
  margin: 0.45rem 0 0;
  color: #52627a;
  font-size: 0.98rem;
}

.studio-actions,
.panel-footer {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  justify-content: flex-end;
}

.icon-button,
.btn-primary,
.btn-success,
.btn-secondary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.icon-button {
  width: 42px;
  color: #0f172a;
  background: #eef2f7;
}

.btn-primary,
.btn-success {
  padding: 0.6rem 1rem;
  color: #fff;
  background: #2563eb;
}

.btn-success {
  background: #15803d;
}

.btn-secondary {
  padding: 0.55rem 0.85rem;
  color: #075985;
  background: #e0f2fe;
}

.btn-danger {
  width: 42px;
  color: #991b1b;
  background: #fee2e2;
}

.btn-primary:hover,
.btn-success:hover,
.btn-secondary:hover,
.icon-button:hover,
.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
  transform: none;
  box-shadow: none;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 86px;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
}

.metric-icon,
.panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  color: #1d4ed8;
  background: #dbeafe;
}

.teacher-icon { color: #047857; background: #d1fae5; }
.module-icon { color: #b45309; background: #fef3c7; }
.schedule-icon { color: #7c3aed; background: #ede9fe; }
.generate-icon { color: #047857; background: #d1fae5; }
.rules-icon { color: #b45309; background: #fef3c7; }
.activity-icon { color: #0f766e; background: #ccfbf1; }

.metric-card strong {
  display: block;
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 900;
}

.metric-card span:not(.metric-icon) {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-message {
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-weight: 750;
}

.status-message.success {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.status-message.error {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.assignment-modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
}

.control-grid,
.advanced-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-grid {
  grid-template-columns: 1fr;
}

.advanced-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  padding: 1rem;
}

.panel-heading {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: start;
  margin-bottom: 1rem;
}

.panel-heading.compact {
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.panel-heading h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 850;
}

.panel-heading p {
  margin: 0.22rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.4;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.form-label {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

.field-link {
  margin-bottom: 0.35rem;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: none;
}

.field-link:hover {
  text-decoration: underline;
}

.form-control,
.form-select {
  width: 100%;
  min-height: 42px;
  padding: 0.55rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  background-color: #fff;
  font-size: 0.9rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.panel-footer {
  margin-top: 1rem;
}

.day-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.day-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  background: #f8fafc;
  font-size: 0.8rem;
  font-weight: 850;
  cursor: pointer;
}

.day-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.day-chip.active {
  color: #fff;
  border-color: #2563eb;
  background: #2563eb;
}

.replace-toggle {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin: 0.9rem 0 0;
  color: #475569;
  font-size: 0.86rem;
  font-weight: 700;
}

.form-switch {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.form-switch input {
  width: 50px;
  height: 28px;
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  position: relative;
}

.form-switch input::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  top: 2px;
  left: 2px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
  transition: transform 0.18s ease;
}

.form-switch input:checked {
  background: #2563eb;
}

.form-switch input:checked::before {
  transform: translateX(22px);
}

.form-switch label {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.period-rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 0;
  padding: 0;
  border: 0;
}

fieldset:disabled {
  opacity: 0.55;
}

.shared-empty {
  display: grid;
  min-height: 88px;
  place-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  font-weight: 750;
}

.shared-activity-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.7fr 0.7fr auto;
  gap: 0.7rem;
  align-items: end;
  margin-top: 0.75rem;
}

.generation-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f8fafc;
}

.generation-bar strong {
  display: block;
  font-weight: 900;
}

.generation-bar span {
  color: #64748b;
  font-size: 0.88rem;
}

.timetable-output-card {
  padding: 1rem;
}

.output-toolbar {
  display: grid;
  grid-template-columns: 1fr minmax(420px, auto);
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.output-actions {
  display: flex;
  align-items: end;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.timetable-class-filter {
  min-width: 220px;
}

.export-select {
  width: auto;
  min-width: 132px;
}

.timetable-group {
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
}

.timetable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #dbe3ef;
  background: #f8fafc;
}

.timetable-header strong {
  display: block;
  font-size: 1rem;
  font-weight: 900;
}

.timetable-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.75rem;
}

.timetable-meta strong {
  flex-basis: 100%;
}

.timetable-header span:not(.badge) {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  color: #fff;
  background: #2563eb;
  font-size: 0.72rem;
  font-weight: 850;
}

.table-responsive {
  overflow-x: auto;
  background: #fff;
}

.timetable-grid {
  width: 100%;
  min-width: 980px;
  table-layout: fixed;
  border-collapse: collapse;
  background: #fff;
}

.timetable-grid th {
  padding: 0.78rem 0.55rem;
  border: 1px solid #b8c2d1;
  color: #fff;
  background: #0f2f5f;
  font-size: 0.84rem;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
}

.timetable-grid th:first-child {
  width: 10%;
}

.timetable-grid th:nth-child(2) {
  width: 13%;
}

.timetable-grid td {
  height: 64px;
  padding: 0.45rem;
  border: 1px solid #cbd5e1;
  text-align: center;
  vertical-align: middle;
}

.period-col,
.time-col {
  color: #0f172a;
  background: #f8fafc;
  font-weight: 900;
  white-space: nowrap;
}

.time-col {
  font-size: 0.9rem;
}

.break-label {
  display: block;
  color: #0f2f5f;
  font-size: 0.78rem;
  font-weight: 950;
}

.period-col.morning-break,
.time-col.morning-break,
.break-fill.morning-break {
  background: #e8f7e9;
}

.period-col.lunch-break,
.time-col.lunch-break,
.break-fill.lunch-break {
  background: #fff4c7;
}

.period-col.evening-break,
.time-col.evening-break,
.break-fill.evening-break {
  background: #e9f2ff;
}

.module-cell {
  min-height: 50px;
  padding: 0.45rem;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  background: #eff6ff;
  text-align: left;
}

.module-cell strong,
.module-cell small {
  display: block;
}

.module-cell strong {
  color: #172554;
  font-size: 0.76rem;
  line-height: 1.2;
}

.module-cell small {
  margin-top: 0.2rem;
  color: #475569;
  font-size: 0.67rem;
}

.module-cell.activity-cell {
  border-left-color: #16a34a;
  background: #f0fdf4;
}

.room-badge {
  display: inline-flex;
  margin-top: 0.28rem;
  padding: 0.08rem 0.38rem;
  border-radius: 999px;
  color: #334155;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.62rem;
  font-weight: 800;
}

.empty-slot {
  display: block;
  min-height: 1rem;
}

.empty-state {
  display: grid;
  place-items: center;
  padding: 2.5rem 1rem;
  text-align: center;
}

.empty-state svg {
  width: 3rem;
  height: 3rem;
  color: #94a3b8;
}

.empty-state h2 {
  margin: 0.8rem 0 0.35rem;
  font-size: 1.25rem;
  font-weight: 900;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

@media (max-width: 1100px) {
  .metrics-grid,
  .control-grid,
  .advanced-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .shared-activity-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .studio-header,
  .output-toolbar,
  .generation-bar,
  .control-grid,
  .advanced-grid,
  .metrics-grid,
  .form-grid,
  .period-rules-grid,
  .panel-heading.compact {
    grid-template-columns: 1fr;
  }

  .studio-header h1 {
    font-size: 1.45rem;
  }

  .studio-actions,
  .generation-bar {
    align-items: stretch;
  }

  .generation-bar,
  .studio-actions,
  .output-actions {
    flex-direction: column;
  }

  .timetable-class-filter {
    width: 100%;
  }

  .shared-activity-row {
    grid-template-columns: 1fr;
  }

  .btn-danger {
    width: 100%;
  }
}

@media print {
  .studio-header,
  .metrics-grid,
  .control-grid,
  .advanced-grid,
  .generation-bar,
  .empty-state,
  .output-actions {
    display: none;
  }

  .timetable-container,
  .timetable-output-card {
    max-width: none;
    padding: 0;
    border: 0;
    box-shadow: none;
  }

  .output-toolbar {
    display: block;
  }

  .timetable-group {
    page-break-inside: avoid;
  }
}
</style>

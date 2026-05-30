<template>
  <AppLayout>
    <div class="timetable-container">
      <section class="studio-card">
      <section class="metrics-grid" aria-label="Timetable summary">
        <div class="metric-card">
          <span class="metric-icon class-icon">
            <BookOpen />
          </span>
          <div><strong>{{ classes.length }}</strong><span>Classes</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon teacher-icon">
            <Users />
          </span>
          <div><strong>{{ teachers.length }}</strong><span>Teachers</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon module-icon">
            <LibraryBig />
          </span>
          <div><strong>{{ modules.length }}</strong><span>Modules</span></div>
        </div>
        <div class="metric-card">
          <span class="metric-icon schedule-icon">
            <CalendarDays />
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
              <X />
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
                <router-link :to="{ path: '/teachers', query: { action: 'add' } }" class="field-link">Add teacher</router-link>
              </div>
              <select v-model="assignment.teacher_id" class="form-select">
                <option value="">Select Teacher</option>
                <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">{{ teacher.name }}</option>
              </select>
            </div>
            <div>
              <div class="field-label-row">
                <label class="form-label">Module</label>
                <router-link :to="{ path: '/modules', query: { action: 'add' } }" class="field-link">Add module</router-link>
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
            <button class="btn-primary" type="button" @click="addAssignment" :disabled="loading || !isAssignmentFormValid">
              <Plus />
              {{ loading ? 'Adding...' : 'Add Assignment' }}
            </button>
          </div>
        </div>
      </div>

      <section class="control-grid">
        <article ref="generationPanel" class="panel-card" :class="{ 'floating-form-card': showGenerationRules }">
          <div class="panel-heading">
            <span class="panel-icon generate-icon">
              <RefreshCw />
            </span>
            <div>
              <h2>Generation Rules</h2>
              <p>Choose scope and period length.</p>
            </div>
            <button class="icon-button panel-icon-button" type="button" title="Use generation fields" aria-label="Use generation fields" @click="showGenerationRules = !showGenerationRules">
              <Pencil />
            </button>
          </div>

          <template v-if="showGenerationRules">
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
                <input v-model.number="generateSettings.period_minutes" type="number" class="form-control" min="1" max="180">
              </div>
              <div>
                <label class="form-label">Slots</label>
                <input :value="slotCountLabel" type="text" class="form-control" readonly>
              </div>
            </div>

            <div class="day-picker" aria-label="Generation days">
              <label v-for="day in days" :key="day" class="day-chip" :class="{ active: generateSettings.selected_days.includes(day) }">
                <input v-model="generateSettings.selected_days" :value="day" type="checkbox" disabled>
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

            <div class="document-settings">
              <div class="logo-upload-row">
                <div class="school-logo-preview">
                  <img v-if="resolvedSchoolLogoUrl" :src="resolvedSchoolLogoUrl" alt="School logo">
                  <span v-else>Logo</span>
                </div>
                <label class="btn-secondary upload-logo-button">
                  <Upload />
                  {{ logoUploading ? 'Uploading...' : 'Upload School Logo' }}
                  <input type="file" accept="image/png,image/jpeg" :disabled="logoUploading" @change="handleSchoolLogoUpload">
                </label>
              </div>
              <div class="form-grid">
                <div>
                  <label class="form-label">Prepared By</label>
                  <input v-model.trim="generateSettings.prepared_by" type="text" class="form-control" placeholder="Name or title">
                </div>
                <div>
                  <label class="form-label">Approved By</label>
                  <input v-model.trim="generateSettings.approved_by" type="text" class="form-control" placeholder="Name or title">
                </div>
                <div>
                  <label class="form-label">Header Position</label>
                  <select v-model="generateSettings.header_position" class="form-select">
                    <option value="left">Logo and class on left</option>
                    <option value="center">Logo and class centered</option>
                    <option value="right">Logo and class on right</option>
                  </select>
                </div>
                <div class="form-grid-full">
                  <label class="form-label">Extra Header Content</label>
                  <textarea
                    v-model.trim="generateSettings.custom_header_content"
                    class="form-control custom-content-input"
                    rows="3"
                    maxlength="1000"
                    placeholder="Add any extra text to show in the downloaded timetable"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer inline-form-footer">
              <button class="btn-primary" type="button" @click="showGenerationRules = false">
                Done
              </button>
            </div>
          </template>
          <div v-else class="collapsed-panel-summary">
            <div>
              <strong>{{ generationSummary }}</strong>
              <span>{{ generateSettings.start_time }} - {{ generateSettings.end_time }} · {{ generateSettings.period_minutes }} minute periods · {{ generateSettings.status }}</span>
            </div>
            <span class="summary-pill">{{ slotCountLabel }}</span>
          </div>
        </article>
      </section>

      <section class="break-rules-section">
        <article class="panel-card break-rules-card" :class="{ 'floating-form-card': showBreakRuleFields }">
          <div class="rules-card-header">
            <div>
              <h2>Period-Based Break Rules</h2>
              <p>Break placement by teaching period count.</p>
            </div>
            <div class="rules-header-actions">
              <button class="icon-button panel-icon-button" type="button" title="Use break rule fields" aria-label="Use break rule fields" @click="showBreakRuleFields = !showBreakRuleFields">
                <Pencil />
              </button>
              <div class="form-switch">
                <input id="periodRulesEnabled" v-model="generateSettings.break_period_rules.enabled" type="checkbox">
                <label for="periodRulesEnabled">{{ generateSettings.break_period_rules.enabled ? 'On' : 'Off' }}</label>
              </div>
            </div>
          </div>

          <fieldset v-if="showBreakRuleFields" :disabled="!generateSettings.break_period_rules.enabled" class="period-rules-grid">
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
          <div v-if="showBreakRuleFields" class="inline-form-footer period-rules-footer">
            <button class="btn-primary" type="button" @click="showBreakRuleFields = false">
              Done
            </button>
          </div>
          <div v-if="!showBreakRuleFields" class="collapsed-panel-summary">
            <div>
              <strong>{{ generateSettings.break_period_rules.enabled ? 'Period rules active' : 'Period rules disabled' }}</strong>
              <span>
                {{ generateSettings.break_period_rules.periods_before_morning_break }} before morning ·
                {{ generateSettings.break_period_rules.periods_before_lunch }} before lunch ·
                {{ generateSettings.break_period_rules.periods_after_afternoon_break }} after evening
              </span>
            </div>
            <span class="summary-pill">{{ slotCountLabel }}</span>
          </div>
        </article>

        <article class="panel-card">
          <div class="panel-heading compact">
            <span class="panel-icon activity-icon">
              <PanelTop />
            </span>
            <div>
              <h2>Shared Activities</h2>
              <p>Assembly, exams, or events placed across selected classes.</p>
            </div>
            <button class="icon-button panel-icon-button" type="button" title="Add shared activity" aria-label="Add shared activity" @click="addSharedActivity">
              <Plus />
            </button>
          </div>

          <div v-if="!sharedActivities.length" class="shared-empty">No shared activities added</div>

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
              <X />
            </button>
          </div>
        </article>
      </section>

      <section class="generation-bar">
        <div>
          <strong>{{ generationSummary }}</strong>
          <span>{{ generateSettings.start_time }} - {{ generateSettings.end_time }} with {{ generateSettings.period_minutes }} minute periods</span>
        </div>
        <button class="icon-button success-icon" type="button" title="Generate timetable" aria-label="Generate timetable" @click="generateTimetable" :disabled="loading">
          <Send />
        </button>
      </section>
      </section>

      <section v-if="displayedTimetables.length > 0" class="timetable-output-card">
        <div class="output-toolbar">
          <div>
            <p class="eyebrow">Generated view</p>
            <h2>Class Timetable</h2>
          </div>
          <div class="output-actions">
            <button class="btn-secondary" type="button" @click="copyTimetableSummary">
              <Copy />
              Copy
            </button>
            <button class="btn-secondary" type="button" @click="printTimetable">
              <Printer />
              Print
            </button>
            <select v-model="exportFormat" class="form-select export-select" aria-label="Download format">
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </select>
            <button class="btn-secondary" type="button" @click="downloadTimetable(exportFormat)">
              <Download />
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
                  <Download />
                  Export
                </button>
                <div v-if="activeExportDropdown === group.class_id" class="export-menu">
                  <button @click="handleExportPDF(group)">PDF</button>
                  <button @click="handleExportWord(group)">Word</button>
                  <button @click="handlePrint(group)">Print</button>
                </div>
              </div>
            </div>
          </div>
          <div class="table-responsive">
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
                <tr v-for="row in buildDisplayTimetableGrid(group)" :key="row.key" :class="row.type === 'break' ? `break-row ${row.breakType}` : ''">
                  <td class="period-col" :class="row.breakType">
                    <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                    <span v-else>{{ row.period }}</span>
                  </td>
                  <td class="time-col" :class="row.breakType">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                  <td v-if="row.type === 'break'" :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                  <template v-else>
                    <template v-for="day in days" :key="day">
                      <td v-if="!row.cellsByDay?.[day]?.skip" :rowspan="row.cellsByDay?.[day]?.rowspan || 1">
                        <div
                          v-if="row.cellsByDay?.[day]?.entry"
                          class="module-cell"
                          :class="{ 'activity-cell': row.cellsByDay[day].entry.entry_type === 'activity' }"
                          :data-module="row.cellsByDay[day].entry.module_name"
                        >
                          <strong>{{ row.cellsByDay[day].entry.module_name }}</strong>
                          <small>{{ row.cellsByDay[day].entry.teacher_name || (row.cellsByDay[day].entry.entry_type === 'activity' ? 'Shared activity' : '') }}</small>
                          <span v-if="row.cellsByDay[day].entry.entry_type !== 'activity'" class="room-badge">{{ row.cellsByDay[day].entry.room_name || row.cellsByDay[day].entry.room || group.room_name || 'TBA' }}</span>
                        </div>
                        <span v-else class="empty-slot"></span>
                      </td>
                    </template>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-else class="empty-state">
        <CalendarDays />
        <h2>No timetable generated yet</h2>
        <p>Add assignments, confirm your generation rules, then create a timetable.</p>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'
import { exportToPDF, exportMultipleTimetablesToPDF } from '@/utils/exportTimetable'
import { FIXED_DAYS, buildFixedTimetableRows } from '@/utils/fixedTimetableStructure'
import { resolveAssetUrl } from '@/utils/assetUrl'
import {
  BookOpen,
  CalendarDays,
  Copy,
  Download,
  LibraryBig,
  PanelTop,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Send,
  Upload,
  Users,
  X
} from '@lucide/vue'

const route = useRoute()
const loading = ref(false)
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const timetableEntries = ref([])
const assignmentMessage = ref('')
const generationPanel = ref(null)
const selectedTimetableClassId = ref('')
const showAssignmentForm = ref(false)
const showGenerationRules = ref(false)
const showBreakRuleFields = ref(false)
const activeExportDropdown = ref(null)
const exportFormat = ref('pdf')
const timetableSettings = ref(null)
const sharedActivities = ref([])
const logoUploading = ref(false)
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
  end_time: '17:15',
  period_minutes: 45,
  teacher_changeover_minutes: 0,
  replace_existing: true,
  selected_days: [...FIXED_DAYS],
  status: 'draft',
  school_logo_url: '',
  prepared_by: '',
  approved_by: '',
  header_position: 'left',
  custom_header_content: '',
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

const days = FIXED_DAYS

function defaultAcademicYear() {
  const today = new Date()
  const startYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

const messageTone = computed(() => {
  const text = assignmentMessage.value.toLowerCase()
  return text.includes('error') ? 'error' : 'success'
})

const isAssignmentFormValid = computed(() => {
  return !!(
    assignment.value.class_id &&
    assignment.value.teacher_id &&
    assignment.value.module_id &&
    assignment.value.academic_year &&
    assignment.value.term
  )
})

const generationSummary = computed(() => {
  const scope = generateSettings.value.class_id
    ? classes.value.find(cls => String(cls.class_id) === String(generateSettings.value.class_id))?.class_name || 'Selected class'
    : 'All classes'
  const daysCount = generateSettings.value.selected_days.length
  return `${scope} across ${daysCount} day${daysCount === 1 ? '' : 's'}`
})

const slotCountLabel = computed(() => {
  const rules = generateSettings.value.break_period_rules
  const totalSlots = rules.enabled
    ? Number(rules.periods_before_morning_break || 0)
      + Number(rules.periods_before_lunch || 0)
      + Number(rules.periods_before_afternoon_break || 0)
      + Number(rules.periods_after_afternoon_break || 0)
    : 10

  return `${totalSlots || 0} slot${totalSlots === 1 ? '' : 's'}`
})

const resolvedSchoolLogoUrl = computed(() => resolveAssetUrl(generateSettings.value.school_logo_url))

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

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
    end_time: '08:45'
  })
}

const removeSharedActivity = (index) => {
  sharedActivities.value.splice(index, 1)
}

const getSharedActivityPayload = () => {
  return sharedActivities.value.flatMap((activity) => {
    const name = String(activity.activity_name || '').trim()
    if (!name || !activity.start_time || !activity.end_time) return []

    const selectedDays = activity.day_of_week === 'all'
      ? [...FIXED_DAYS]
      : [activity.day_of_week].filter((day) => FIXED_DAYS.includes(day))

    return selectedDays.map((day) => ({
      activity_name: name,
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
    if (entry.module_name === 'continue') return
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
  roomName: group.room_name,
  logoUrl: resolvedSchoolLogoUrl.value,
  preparedBy: generateSettings.value.prepared_by,
  approvedBy: generateSettings.value.approved_by,
  headerPosition: generateSettings.value.header_position,
  customContent: generateSettings.value.custom_header_content
})

const handleExportPDF = (group) => {
  downloadTimetable('pdf', [group])
  activeExportDropdown.value = null
}

const handleExportWord = (group) => {
  downloadTimetable('docx', [group])
  activeExportDropdown.value = null
}

const handlePrint = (group) => {
  openPdfPrintWindow([group])
  activeExportDropdown.value = null
}

const getTimetableSettingsPayload = () => ({
  start_time: generateSettings.value.start_time,
  end_time: generateSettings.value.end_time,
  period_minutes: generateSettings.value.period_minutes,
  teacher_changeover_minutes: generateSettings.value.teacher_changeover_minutes,
  break_period_rules: { ...generateSettings.value.break_period_rules },
  school_logo_url: generateSettings.value.school_logo_url,
  prepared_by: generateSettings.value.prepared_by,
  approved_by: generateSettings.value.approved_by,
  header_position: generateSettings.value.header_position,
  custom_header_content: generateSettings.value.custom_header_content
})

const saveTimetableSettings = async () => {
  const response = await api.put('/settings/timetable', getTimetableSettingsPayload())
  timetableSettings.value = response.data.settings || timetableSettings.value
}

const handleSchoolLogoUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    assignmentMessage.value = 'Error: Upload a PNG or JPG school logo.'
    event.target.value = ''
    return
  }

  logoUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    generateSettings.value.school_logo_url = response.data.file?.path || response.data.file?.url || ''
    await saveTimetableSettings()
    assignmentMessage.value = 'School logo uploaded and saved.'
  } catch (error) {
    assignmentMessage.value = 'Error: ' + getApiErrorMessage(error, 'Failed to upload school logo.')
  } finally {
    logoUploading.value = false
    event.target.value = ''
  }
}

const getBreakType = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('morning')) return 'morning-break'
  if (normalized.includes('lunch')) return 'lunch-break'
  return 'evening-break'
}

const getBreakLabel = (label) => {
  const rawLabel = String(label || 'Break').trim()
  const readableName = rawLabel.replace(/\s*break\s*/ig, ' ').trim() || rawLabel
  return readableName
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .split('')
    .filter((char) => char !== ' ')
    .join(' ')
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
  return buildFixedTimetableRows(group.entries, days, {
    ...timetableSettings.value,
    start_time: generateSettings.value.start_time,
    period_minutes: generateSettings.value.period_minutes
  })
}

const areSameDisplayBlock = (first, second) => {
  if (!first || !second) return false
  if ((first.entry_type || 'lesson') !== (second.entry_type || 'lesson')) return false
  if (String(first.assignment_id || '') && String(second.assignment_id || '')) {
    return String(first.assignment_id) === String(second.assignment_id)
  }
  return String(first.module_name || '') === String(second.module_name || '')
    && String(first.teacher_id || first.teacher_name || '') === String(second.teacher_id || second.teacher_name || '')
    && String(first.room_id || first.room_name || first.room || '') === String(second.room_id || second.room_name || second.room || '')
}

const buildDisplayTimetableGrid = (group) => {
  const rows = buildTimetableGridWithBreaks(group)
  return rows.map((row) => {
    if (row.type === 'break') return row

    const cellsByDay = {}
    days.forEach((day) => {
      const entry = row.entriesByDay?.[day]
      cellsByDay[day] = { entry: entry || null, rowspan: 1, skip: false }
    })

    return { ...row, cellsByDay }
  })
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}


const buildTimetableExportRows = (groups = displayedTimetables.value) => {
  const rows = [['Class', 'Period', 'Time', ...days]]




  groups.forEach((group) => {
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
          return [
            entry.module_name || 'Untitled',
            entry.teacher_name || 'No teacher',
            room
          ].join('\n')
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

const timetableCellHtml = (entry, group) => {
  if (!entry) return '<td class="empty-cell"></td>'

  const room = entry.entry_type === 'activity'
    ? 'Shared activity'
    : (entry.room_name || entry.room || group?.room_name || 'TBA')
  const lines = [
    entry.module_name || 'Untitled',
    entry.teacher_name || 'No teacher',
    room
  ]

  return `<td class="${entry.entry_type === 'activity' ? 'activity-cell' : ''}">${lines.map(escapeHtml).join('<br>')}</td>`
}

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Unable to read logo file'))
  reader.readAsDataURL(blob)
})

const logoDataUrlPromises = new Map()

const getLogoDataUrl = async (logoUrl = '') => {
  const source = String(logoUrl || '').trim()
  if (!source) return ''
  if (source.startsWith('data:image/')) return source

  if (!logoDataUrlPromises.has(source)) {
    logoDataUrlPromises.set(source, fetch(source)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? blobToDataUrl(blob) : ''))
      .catch(() => ''))
  }

  return logoDataUrlPromises.get(source)
}

const buildTimetableHtml = async (groups = displayedTimetables.value, options = {}) => {
  const today = new Date().toLocaleDateString()
  const logoUrl = options.logoSrc !== undefined
    ? options.logoSrc
    : await getLogoDataUrl(resolvedSchoolLogoUrl.value)
  const preparedBy = generateSettings.value.prepared_by || '________________'
  const approvedBy = generateSettings.value.approved_by || '________________'
  const headerPosition = ['left', 'center', 'right'].includes(generateSettings.value.header_position)
    ? generateSettings.value.header_position
    : 'left'
  const customHeaderContent = String(generateSettings.value.custom_header_content || '').trim()
  const body = groups.map((group) => {
    const className = group.class_name || `Class ${group.class_id}`
    const level = group.level || 'No level set'
    const room = group.room_name || 'No room set'
    const rows = buildTimetableGridWithBreaks(group).map((row) => {
      if (row.type === 'break') {
        return `<tr class="break-row ${row.breakType}">
          <td class="period-cell">${escapeHtml(row.label)}</td>
          <td class="time-cell">${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
          <td colspan="${days.length}" class="break-label">${escapeHtml(row.label)}</td>
        </tr>`
      }

      const cells = days.map((day) => {
        const entry = row.entriesByDay[day]
        return timetableCellHtml(entry, group)
      }).join('')
      return `<tr>
        <td class="period-cell">${escapeHtml(row.period || '')}</td>
        <td class="time-cell">${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
        ${cells}
      </tr>`
    }).join('')

    return `<section class="timetable-page">
      <header class="document-header header-${escapeHtml(headerPosition)}">
        ${logoUrl ? `<img class="document-logo" src="${escapeHtml(logoUrl)}" width="42" height="42" style="width:42px;height:42px;max-width:42px;max-height:42px;object-fit:contain;" alt="School logo">` : '<div class="document-logo-placeholder"></div>'}
        <div>
          <h1>${escapeHtml(className)} - Timetable</h1>
          <p class="meta">Level: ${escapeHtml(level)} &nbsp;&nbsp; Room: ${escapeHtml(room)}</p>
          <p class="generated">Generated on ${escapeHtml(today)}</p>
          ${customHeaderContent ? `<p class="custom-header-content">${escapeHtml(customHeaderContent).replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      </header>
      <table>
        <colgroup>
          <col class="period-col">
          <col class="time-col">
          ${days.map(() => '<col class="day-col">').join('')}
        </colgroup>
        <thead>
          <tr>
            <th>Period</th>
            <th></th>
            ${days.map((day) => `<th>${escapeHtml(day)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="signature-footer-row">
            <td colspan="3">
              <span>Prepared by</span>
              <strong>${escapeHtml(preparedBy)}</strong>
            </td>
            <td colspan="4">
              <span>Approved by</span>
              <strong>${escapeHtml(approvedBy)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </section>`
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Class Timetables</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; font-family: Arial, sans-serif; color: #111827; }
    .timetable-page { width: 100%; padding: 0; page-break-after: always; page-break-inside: avoid; break-inside: avoid; mso-page-break-inside: avoid; }
    .timetable-page:last-child { page-break-after: auto; }
    .document-header { display: flex; align-items: center; gap: 9px; margin-bottom: 5px; page-break-after: avoid; break-after: avoid; }
    .document-header.header-left { justify-content: flex-start; text-align: left; }
    .document-header.header-center { justify-content: center; text-align: center; }
    .document-header.header-right { justify-content: flex-end; text-align: right; }
    .document-logo,
    .document-logo-placeholder { display: block; width: 42px !important; height: 42px !important; max-width: 42px !important; max-height: 42px !important; min-width: 42px; min-height: 42px; border: 1px solid #d8e4f5; border-radius: 5px; object-fit: contain; background: #ffffff; }
    h1 { font-size: 16px; line-height: 1.1; margin: 0 0 3px; font-weight: 700; }
    .meta,
    .generated { margin: 0 0 2px; font-size: 8px; color: #111827; line-height: 1.15; }
    .generated { margin-bottom: 3px; }
    .custom-header-content { margin: 0; font-size: 8px; line-height: 1.2; color: #1f2937; white-space: pre-line; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; mso-page-break-inside: avoid; }
    .period-col { width: 6%; }
    .time-col { width: 10%; }
    .day-col { width: 16.8%; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th, td { border: 1px solid #d8e4f5; padding: 2px 3px; font-size: 6px; line-height: 1; vertical-align: top; height: 18px; }
    th { background: #2563eb; color: white; text-align: center; font-size: 6px; font-weight: 700; padding: 2px 2px; height: 14px; }
    td strong,
    td span,
    td small { display: block; font-weight: 400; color: #374151; }
    td strong { color: #374151; }
    td small { font-size: 5px; text-transform: uppercase; }
    .period-cell,
    .time-cell { text-align: center; vertical-align: middle; color: #374151; }
    .period-cell { font-weight: 500; }
    .time-cell { white-space: nowrap; }
    .empty-cell { background: #ffffff; }
    .activity-cell { background: #f0fdf4; }
    .break-row td { background: #eef4ff; font-weight: 700; text-align: center; vertical-align: middle; height: 14px; }
    .break-row .period-cell { word-break: break-word; font-size: 5px; }
    .break-label { letter-spacing: 0; }
    .signature-footer-row td { height: auto; padding: 4px 18px 0; border: 0; background: #ffffff; vertical-align: top; }
    .signature-footer-row span { display: block; margin-bottom: 3px; color: #334155; font-size: 5px; font-weight: 700; text-transform: uppercase; }
    .signature-footer-row strong { display: block; min-height: 8px; padding-top: 2px; border-top: 1px solid #94a3b8; font-size: 6px; font-weight: 500; }
    @page { size: A4 landscape; margin: 3mm; mso-page-orientation: landscape; }
    @media print {
      html, body { width: 291mm; min-height: 204mm; }
      .document-logo,
      .document-logo-placeholder { width: 13mm !important; height: 13mm !important; max-width: 13mm !important; max-height: 13mm !important; min-width: 13mm; min-height: 13mm; }
      .document-header { margin-bottom: 2.5mm; }
      .timetable-page { page-break-after: always; }
      .timetable-page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  ${body}
</body>
</html>`
}

const getDataUrlParts = (dataUrl = '') => {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    mimeType: match[1],
    base64: match[2].replace(/\s/g, '')
  }
}

const wrapBase64 = (value = '') => String(value).match(/.{1,76}/g)?.join('\r\n') || ''

const getLogoExtension = (mimeType = 'image/png') => {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg'
  if (mimeType.includes('gif')) return 'gif'
  if (mimeType.includes('webp')) return 'webp'
  return 'png'
}

const buildWordTimetableDocument = async (groups = displayedTimetables.value) => {
  const logoDataUrl = await getLogoDataUrl(resolvedSchoolLogoUrl.value)
  const logoParts = getDataUrlParts(logoDataUrl)
  const logoFileName = logoParts ? `school-logo.${getLogoExtension(logoParts.mimeType)}` : ''
  const html = await buildTimetableHtml(groups, { logoSrc: logoFileName })

  if (!logoParts) return html

  const boundary = `----=_TimetableWord_${Date.now()}`
  return [
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: 8bit',
    'Content-Location: timetable.html',
    '',
    html,
    '',
    `--${boundary}`,
    `Content-Type: ${logoParts.mimeType}`,
    'Content-Transfer-Encoding: base64',
    `Content-Location: ${logoFileName}`,
    '',
    wrapBase64(logoParts.base64),
    '',
    `--${boundary}--`
  ].join('\r\n')
}

const getExportBaseName = (groups = displayedTimetables.value) => {
  const scope = groups.length === 1
    ? groups[0].class_name || `Class ${groups[0].class_id}`
    : selectedTimetableClassId.value
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

const openPdfPrintWindow = async (groups = displayedTimetables.value) => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) {
    assignmentMessage.value = 'Allow pop-ups to export PDF, then choose Save as PDF.'
    return
  }

  printWindow.document.write(await buildTimetableHtml(groups))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const downloadTimetable = async (format = 'pdf', groups = displayedTimetables.value) => {
  if (!groups.length) {
    assignmentMessage.value = 'Generate or load a timetable before downloading.'
    return
  }

  const baseName = getExportBaseName(groups)
  const selectedFormat = String(format || 'pdf').toLowerCase()

  if (selectedFormat === 'pdf') {
    if (groups.length === 1) {
      const group = groups[0]
      exportToPDF(
        group.entries,
        group.class_name || `Class ${group.class_id}`,
        getExportOptions(group)
      )
    } else {
      exportMultipleTimetablesToPDF(
        groups,
        getExportBaseName(groups),
        groups.map((group) => getExportOptions(group))
      )
    }
    assignmentMessage.value = groups.length > 1 ? 'PDF timetables downloaded.' : 'PDF timetable downloaded.'
  } else if (selectedFormat === 'doc') {
    const wordDocument = await buildWordTimetableDocument(groups)
    downloadBlob(wordDocument, `${baseName}.doc`, 'application/msword;charset=utf-8')
    assignmentMessage.value = 'Word timetable downloaded.'
  } else {
    assignmentMessage.value = 'Only PDF and Word downloads are available.'
  }

  setTimeout(() => { assignmentMessage.value = '' }, 3000)
}

const printTimetable = () => {
  if (!displayedTimetables.value.length) {
    assignmentMessage.value = 'Generate or load a timetable before printing.'
    return
  }

  openPdfPrintWindow()
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
  // Validation: Check all required fields are selected
  if (!assignment.value.class_id) {
    assignmentMessage.value = 'Error: Please select a class.'
    return
  }
  if (!assignment.value.teacher_id) {
    assignmentMessage.value = 'Error: Please select a teacher.'
    return
  }
  if (!assignment.value.module_id) {
    assignmentMessage.value = 'Error: Please select a module.'
    return
  }
  if (!assignment.value.academic_year) {
    assignmentMessage.value = 'Error: Please enter academic year.'
    return
  }
  if (!assignment.value.term) {
    assignmentMessage.value = 'Error: Please select a term.'
    return
  }

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
    const startMinutes = timeToMinutes(generateSettings.value.start_time)
    const endMinutes = timeToMinutes(generateSettings.value.end_time)
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      assignmentMessage.value = 'Error: End time must be after start time.'
      return
    }

    const payload = {
      class_id: generateSettings.value.class_id,
      level: generateSettings.value.level,
      replace_existing: generateSettings.value.replace_existing,
      start_time: generateSettings.value.start_time,
      period_minutes: generateSettings.value.period_minutes,
      days: [...FIXED_DAYS],
      end_time: generateSettings.value.end_time,
      status: generateSettings.value.status,
      teacher_changeover_minutes: generateSettings.value.teacher_changeover_minutes,
      break_period_rules: { ...generateSettings.value.break_period_rules },
      shared_activities: getSharedActivityPayload()
    }

    await saveTimetableSettings()

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

const loadTimetableSettings = async () => {
  try {
    const res = await api.get('/settings/timetable')
    timetableSettings.value = res.data.settings || null
    if (timetableSettings.value) {
      generateSettings.value.start_time = timetableSettings.value.start_time || generateSettings.value.start_time
      generateSettings.value.end_time = timetableSettings.value.end_time || generateSettings.value.end_time
      generateSettings.value.period_minutes = Number(timetableSettings.value.period_minutes || generateSettings.value.period_minutes)
      generateSettings.value.teacher_changeover_minutes = Number(timetableSettings.value.teacher_changeover_minutes || 0)
      generateSettings.value.school_logo_url = timetableSettings.value.school_logo_url || ''
      generateSettings.value.prepared_by = timetableSettings.value.prepared_by || ''
      generateSettings.value.approved_by = timetableSettings.value.approved_by || ''
      generateSettings.value.header_position = timetableSettings.value.header_position || 'left'
      generateSettings.value.custom_header_content = timetableSettings.value.custom_header_content || ''
      generateSettings.value.break_period_rules = {
        ...generateSettings.value.break_period_rules,
        ...(timetableSettings.value.break_period_rules || {})
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const loadSetupData = async () => {
  await Promise.all([loadClasses(), loadTeachers(), loadModules(), loadTimetableSettings()])
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
  if (route.query.action === 'generate') {
    showGenerationRules.value = true
    await nextTick()
    generationPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else if (route.query.action === 'assignment') {
    openAssignmentForm()
  }
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

.studio-card {
  display: grid;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.studio-card .studio-header,
.studio-card .panel-card,
.studio-card .generation-bar {
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.studio-card .studio-header {
  padding: 0 0 0.8rem;
  border-bottom: 1px solid #dbe3ef;
}

.studio-card .metric-card,
.studio-card .collapsed-panel-summary {
  background: #f8fbff;
}

.studio-card .control-grid,
.studio-card .break-rules-section,
.studio-card .metrics-grid {
  margin-bottom: 0;
}

.studio-card .generation-bar {
  padding: 0.8rem 0 0;
  border-top: 1px solid #dbe3ef;
}

.studio-card .floating-form-card {
  border: 1px solid #dbe3ef;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.studio-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem;
  margin-bottom: 0.8rem;
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
  font-size: 1.45rem;
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: 0;
}

.studio-subtitle {
  max-width: 740px;
  margin: 0.35rem 0 0;
  color: #52627a;
  font-size: 0.9rem;
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

.primary-icon {
  color: #fff;
  background: #2563eb;
}

.success-icon {
  color: #fff;
  background: #15803d;
}

.panel-icon-button {
  width: 38px;
  min-height: 38px;
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
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 70px;
  padding: 0.8rem;
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
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #1d4ed8;
  background: #dbeafe;
}

.teacher-icon { color: #047857; background: #d1fae5; }
.module-icon { color: #b45309; background: #fef3c7; }
.schedule-icon { color: #7c3aed; background: #ede9fe; }
.generate-icon { color: #047857; background: #d1fae5; }

.metric-card strong {
  display: block;
  font-size: 1.25rem;
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
  width: min(680px, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

.settings-modal,
.floating-form-card {
  width: min(760px, calc(100vw - 2rem));
}

.floating-form-card {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 60;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  transform: translate(-50%, -50%);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.floating-form-card::before {
  content: '';
  position: fixed;
  inset: -100vh -100vw;
  z-index: -1;
  background: rgba(15, 23, 42, 0.45);
}

.inline-form-footer {
  margin-top: 1rem;
}

.period-rules-footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
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
.break-rules-section {
  display: grid;
  gap: 0.9rem;
  margin-bottom: 0.9rem;
}

.control-grid {
  grid-template-columns: 1fr;
}

.break-rules-section {
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  align-items: stretch;
}

.panel-card {
  padding: 0.85rem 1rem;
}

.panel-heading {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 0.65rem;
}

.panel-heading.compact {
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.panel-heading h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 850;
}

.panel-heading p {
  margin: 0.22rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.4;
}

.panel-toggle-button {
  align-self: center;
  white-space: nowrap;
  min-height: 42px;
  padding-inline: 0.95rem;
}

.collapsed-panel-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid #dbe7f5;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.45;
}

.collapsed-panel-summary strong,
.collapsed-panel-summary span {
  display: block;
}

.collapsed-panel-summary strong {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.collapsed-panel-summary > div > span {
  margin-top: 0.2rem;
  color: #475569;
}

.summary-pill {
  flex: 0 0 auto;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 0.78rem;
  font-weight: 900;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.form-grid-full {
  grid-column: 1 / -1;
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

.custom-content-input {
  min-height: 86px;
  resize: vertical;
  line-height: 1.35;
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
  font-size: 0.8rem;
  font-weight: 700;
}

.document-settings {
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dbe7f5;
}

.logo-upload-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.school-logo-preview {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  font-size: 0.72rem;
  font-weight: 900;
}

.school-logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-logo-button {
  position: relative;
  overflow: hidden;
}

.upload-logo-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
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

.break-rules-card {
  padding: 1rem 1.1rem;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
}

.rules-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.rules-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rules-card-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.12rem;
  line-height: 1.15;
  font-weight: 900;
}

.rules-card-header p {
  margin: 0.24rem 0 0;
  color: #475569;
  font-size: 0.86rem;
  line-height: 1.4;
}

.break-rules-card .form-label {
  color: #334155;
  font-size: 0.8rem;
  font-weight: 900;
}

.break-rules-card .form-control {
  min-height: 50px;
  border-color: #cfe0f5;
  border-radius: 8px;
  font-size: 0.95rem;
}

.period-rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.3rem 1rem;
  margin: 0;
  padding: 0;
  border: 0;
}

fieldset:disabled {
  opacity: 0.55;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 50px;
  height: 100%;
  width: 100%;
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
  .control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .studio-header,
  .output-toolbar,
  .generation-bar,
  .control-grid,
  .break-rules-section,
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

  .btn-danger {
    width: 100%;
  }
}

@media print {
  .studio-header,
  .metrics-grid,
  .control-grid,
  .break-rules-section,
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

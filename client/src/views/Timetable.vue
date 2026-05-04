<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">📅</div>
          <h1 class="h2 mb-0">Timetable Management</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">A</div>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.path"
            class="nav-item-custom d-block mb-2"
            :class="{ active: $route.path === item.path }"
          >
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <main class="flex-grow-1 p-4">
        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 class="h3 fw-semibold text-dark mb-1">Assign Module To Teacher</h2>
              <p class="text-muted mb-0">Choose the teacher and module for a class before generating its timetable.</p>
            </div>
            <button class="btn btn-outline-secondary" :disabled="loadingSetup" @click="loadSetupData">Refresh</button>
          </div>

          <div v-if="assignmentMessage" class="alert alert-danger" role="alert">
            {{ assignmentMessage }}
          </div>

          <form class="row g-3" @submit.prevent="addAssignment">
            <div class="col-md-3">
              <label for="setupClass" class="form-label">Class *</label>
              <select id="setupClass" v-model.number="assignmentForm.class_id" class="form-select" required>
                <option value="">Select class</option>
                <option v-for="classItem in classes" :key="classItem.class_id" :value="classItem.class_id">
                  {{ classItem.class_name }} - {{ classItem.level }} - {{ classItem.shift_name || 'No shift' }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <label for="setupTeacher" class="form-label">Teacher *</label>
              <select id="setupTeacher" v-model.number="assignmentForm.teacher_id" class="form-select" required>
                <option value="">Select teacher</option>
                <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                  {{ teacher.name }} - {{ teacher.department || 'SSOD' }}
                </option>
              </select>
            </div>

            <div class="col-md-3">
              <label for="setupModule" class="form-label">Module *</label>
              <select id="setupModule" v-model.number="assignmentForm.module_id" class="form-select" required>
                <option value="">Select module</option>
                <option v-for="module in modules" :key="module.module_id" :value="module.module_id">
                  {{ module.module_name }} - {{ module.department || 'SSOD' }}
                </option>
              </select>
            </div>

            <div class="col-md-2">
              <label for="setupTerm" class="form-label">Term *</label>
              <select id="setupTerm" v-model="assignmentForm.term" class="form-select" required>
                <option value="">Select term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div class="col-md-1 d-flex align-items-end">
              <button type="submit" class="btn btn-primary-custom w-100" :disabled="savingAssignment">
                Add
              </button>
            </div>

            <div class="col-md-3">
              <label for="setupYear" class="form-label">Academic Year *</label>
              <input id="setupYear" v-model="assignmentForm.academic_year" class="form-control" required placeholder="2024-2025">
            </div>
          </form>

          <div class="table-responsive mt-4">
            <table class="table table-custom">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Module</th>
                  <th>Teacher</th>
                  <th>Shift</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in visibleAssignments" :key="assignment.assignment_id">
                  <td>{{ assignment.class_name }}</td>
                  <td>{{ assignment.module_name }}</td>
                  <td>{{ assignment.teacher_name }}</td>
                  <td>{{ assignment.shift_name || 'No shift' }}</td>
                  <td>{{ assignment.term }}</td>
                </tr>
                <tr v-if="!visibleAssignments.length">
                  <td colspan="5" class="text-center text-muted py-4">No teacher-module assignments yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-custom mb-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 class="h3 fw-semibold text-dark mb-1">Generate Timetable</h2>
              <p class="text-muted mb-0">Generate one timetable per class. Classes with the same level stay separate.</p>
            </div>
            <span class="badge bg-primary fs-6">{{ timetableEntries.length }} entries</span>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Teacher Changeover</div>
                <div class="fw-semibold">{{ settings.teacher_changeover_minutes }} min</div>
              </div>
            </div>
            <div class="col-md-8">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">{{ settings.break_period_rules.enabled ? 'Automatic Breaks' : 'Breaks Respected' }}</div>
                <div class="d-flex flex-wrap gap-2 mt-1">
                  <span v-for="breakTime in visibleBreaks" :key="`${breakTime.break_name}-${breakTime.start_time}`" class="badge bg-secondary">
                    {{ breakTime.break_name }} {{ breakTime.start_time }}-{{ breakTime.end_time }}
                  </span>
                  <span v-if="!visibleBreaks.length" class="text-muted">No breaks set</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="formMessage" class="alert alert-danger" role="alert">
            {{ formMessage }}
          </div>

          <form @submit.prevent="generateTimetable">
            <div class="row g-3">
              <div class="col-md-4">
                <label for="classSelect" class="form-label">Class</label>
                <select id="classSelect" v-model="form.class_id" class="form-select">
                  <option value="">All classes</option>
                  <option v-for="classItem in classes" :key="classItem.class_id" :value="classItem.class_id">
                    {{ classItem.class_name }} - {{ classItem.level }}
                  </option>
                </select>
              </div>

              <div class="col-md-2">
                <label for="startTime" class="form-label">Day Start *</label>
                <input id="startTime" v-model="form.start_time" type="time" class="form-control" required>
              </div>

              <div class="col-md-2">
                <label for="endTime" class="form-label">Day End *</label>
                <input id="endTime" v-model="form.end_time" type="time" class="form-control" required>
              </div>

              <div class="col-md-2">
                <label for="periodMinutes" class="form-label">Period Minutes *</label>
                <input
                  id="periodMinutes"
                  v-model.number="form.period_minutes"
                  type="number"
                  min="1"
                  step="1"
                  class="form-control"
                  required
                >
              </div>

              <div class="col-md-2 d-flex align-items-end">
                <div class="form-check mb-2">
                  <input id="replaceExisting" v-model="form.replace_existing" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="replaceExisting">Replace existing</label>
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
              <div v-for="day in days" :key="day" class="form-check">
                <input
                  :id="`day-${day}`"
                  v-model="form.days"
                  class="form-check-input"
                  type="checkbox"
                  :value="day"
                >
                <label class="form-check-label" :for="`day-${day}`">{{ day }}</label>
              </div>
            </div>

            <div class="border rounded p-3 mt-4">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h3 class="h5 fw-semibold text-dark mb-1">Layout Rules</h3>
                  <p class="text-muted small mb-0">Set how many periods happen before each break.</p>
                </div>
                <div class="form-check form-switch">
                  <input id="layoutEnabled" v-model="layoutForm.enabled" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="layoutEnabled">Use layout</label>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <label for="layoutMorningPeriods" class="form-label">Before Morning Break</label>
                  <div class="input-group">
                    <input id="layoutMorningPeriods" v-model.number="layoutForm.periods_before_morning_break" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">periods</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutMorningMinutes" class="form-label">Morning Break Length</label>
                  <div class="input-group">
                    <input id="layoutMorningMinutes" v-model.number="layoutForm.morning_break_minutes" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">min</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutLunchPeriods" class="form-label">Before Lunch Break</label>
                  <div class="input-group">
                    <input id="layoutLunchPeriods" v-model.number="layoutForm.periods_before_lunch" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">periods</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutLunchMinutes" class="form-label">Lunch Break Length</label>
                  <div class="input-group">
                    <input id="layoutLunchMinutes" v-model.number="layoutForm.lunch_break_minutes" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">min</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutEveningPeriods" class="form-label">Before Evening Break</label>
                  <div class="input-group">
                    <input id="layoutEveningPeriods" v-model.number="layoutForm.periods_before_afternoon_break" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">periods</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutEveningMinutes" class="form-label">Evening Break Length</label>
                  <div class="input-group">
                    <input id="layoutEveningMinutes" v-model.number="layoutForm.afternoon_break_minutes" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">min</span>
                  </div>
                </div>

                <div class="col-md-3">
                  <label for="layoutPostEveningPeriods" class="form-label">Periods after Afternoon Break</label>
                  <div class="input-group">
                    <input id="layoutPostEveningPeriods" v-model.number="layoutForm.periods_after_afternoon_break" type="number" min="1" step="1" class="form-control" :disabled="!layoutForm.enabled">
                    <span class="input-group-text">periods</span>
                  </div>
                </div>

                <div class="col-md-3"></div>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-outline-secondary" :disabled="savingLayout || generating" @click="applyReferenceTimetableLayout">
                <span v-if="savingLayout">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Applying...
                </span>
                <span v-else>Use 3-2-3 Layout</span>
              </button>
              <button type="submit" class="btn btn-primary-custom" :disabled="generating">
                <span v-if="generating">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating...
                </span>
                <span v-else>Generate Timetable</span>
              </button>
            </div>
          </form>
        </div>

        <div v-if="skippedItems.length" class="alert alert-warning" role="alert">
          <strong>Skipped:</strong>
          <ul class="mb-0 mt-2">
            <li v-for="(item, index) in skippedItems.slice(0, 8)" :key="index">
              {{ item.class_name }}: {{ item.reason }}
            </li>
          </ul>
        </div>

        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h3 fw-semibold text-dark mb-0">Generated Timetables</h2>
            <button class="btn btn-outline-secondary" :disabled="loading" @click="loadTimetable">
              Refresh
            </button>
          </div>

          <div v-if="loading" class="text-center text-muted py-5">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading timetable...
          </div>

          <div v-else-if="!groupedTimetables.length" class="text-center text-muted py-5">
            No timetable entries generated yet
          </div>

          <div v-else class="accordion" id="timetableAccordion">
            <div v-for="group in groupedTimetables" :key="group.class_id" class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="`#class-${group.class_id}`">
                  {{ group.class_name }} - {{ group.level }} ({{ group.entries.length }} entries, {{ group.moduleCount }} modules)
                </button>
              </h2>
              <div :id="`class-${group.class_id}`" class="accordion-collapse collapse" data-bs-parent="#timetableAccordion">
                <div class="accordion-body">
                  <div class="table-responsive">
                    <table class="table table-custom timetable-grid">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Time</th>
                          <th v-for="day in days" :key="day">{{ day }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="(row, rowIndex) in buildTimetableGridRows(group)" :key="rowIndex">
                          <tr v-if="row.type === 'break'" class="text-center timetable-break-row" :class="row.breakClass">
                            <td class="text-uppercase">{{ row.breakName }}</td>
                            <td>{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                            <td :colspan="days.length">
                              <strong>{{ row.breakName }}</strong>
                            </td>
                          </tr>
                          <tr v-else>
                            <td class="text-center fw-bold">{{ row.period }}</td>
                            <td>{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                            <td v-for="day in days" :key="day">
                              <div v-if="row.entriesByDay[day]">
                                <div class="fw-semibold">{{ row.entriesByDay[day].module_name }}</div>
                                <div class="text-muted small">{{ row.entriesByDay[day].teacher_name }}</div>
                              </div>
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Teachers', path: '/teachers', icon: '👥' },
  { name: 'Modules', path: '/modules', icon: '📚' },
  { name: 'Classes', path: '/classes', icon: '🏫' },
  { name: 'Sections', path: '/sections', icon: '🏛️' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Assignments', path: '/assignments', icon: '📋' },
  { name: 'Timetable', path: '/timetable', icon: '📅' }
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const assignments = ref([])
const timetableEntries = ref([])
const skippedItems = ref([])
const loading = ref(false)
const loadingSetup = ref(false)
const generating = ref(false)
const savingAssignment = ref(false)
const savingLayout = ref(false)
const formMessage = ref('')
const assignmentMessage = ref('')
const referenceBreakRules = {
  enabled: true,
  periods_before_morning_break: 3,
  periods_before_lunch: 2,
  periods_before_afternoon_break: 3,
  periods_after_afternoon_break: 1,
  morning_break_minutes: 30,
  lunch_break_minutes: 45,
  afternoon_break_minutes: 30
}
const settings = ref({
  teacher_changeover_minutes: 5,
  timetable_breaks: [],
  break_period_rules: { ...referenceBreakRules, enabled: false }
})

const form = ref({
  class_id: '',
  start_time: '08:00',
  end_time: '19:45',
  period_minutes: 60,
  replace_existing: true,
  days: [...days]
})

const layoutForm = ref({ ...referenceBreakRules })

const assignmentForm = ref({
  class_id: '',
  teacher_id: '',
  module_id: '',
  academic_year: '2024-2025',
  term: ''
})

const dayOrder = days.reduce((order, day, index) => {
  order[day] = index
  return order
}, {})

const buildTimetableGridRows = (group) => {
  const entryMap = new Map()

  group.entries.forEach((entry) => {
    const timeKey = normalizeTime(entry.start_time)
    entryMap.set(`${entry.day_of_week}|${timeKey}`, entry)
  })

  const sortedPeriods = buildDisplayPeriods()
  const sortedBreaks = visibleBreaks.value
    .map((breakTime) => ({
      ...breakTime,
      start_time: normalizeTime(breakTime.start_time),
      end_time: normalizeTime(breakTime.end_time)
    }))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const rows = []
  let breakIndex = 0
  let periodNumber = 1

  sortedPeriods.forEach((period) => {
    while (breakIndex < sortedBreaks.length && sortedBreaks[breakIndex].start_time <= period.start_time) {
      const breakTime = sortedBreaks[breakIndex]
      rows.push({
        type: 'break',
        breakName: breakTime.break_name,
        breakClass: getBreakClass(breakTime.break_name),
        start_time: breakTime.start_time,
        end_time: breakTime.end_time
      })
      breakIndex += 1
    }

    const entriesByDay = {}
    days.forEach((day) => {
      entriesByDay[day] = entryMap.get(`${day}|${period.start_time}`) || null
    })

    rows.push({
      type: 'period',
      period: periodNumber,
      start_time: period.start_time,
      end_time: period.end_time,
      entriesByDay
    })
    periodNumber += 1
  })

  while (breakIndex < sortedBreaks.length) {
    const breakTime = sortedBreaks[breakIndex]
    rows.push({
      type: 'break',
      breakName: breakTime.break_name,
      breakClass: getBreakClass(breakTime.break_name),
      start_time: breakTime.start_time,
      end_time: breakTime.end_time
    })
    breakIndex += 1
  }

  return rows
}

const overlaps = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB
}

const buildDisplayPeriods = () => {
  const dayStart = timeToMinutes(form.value.start_time)
  const dayEnd = timeToMinutes(form.value.end_time)
  const periodMinutes = positiveInteger(form.value.period_minutes, 60)
  const changeoverMinutes = nonNegativeInteger(settings.value.teacher_changeover_minutes, 0)
  const breaks = visibleBreaks.value
  const periods = []
  let cursor = dayStart
  let teachingSinceLastChangeover = 0

  while (cursor + periodMinutes <= dayEnd) {
    const slotStart = cursor
    const slotEnd = cursor + periodMinutes
    const hitBreaks = breaks.filter((breakTime) => {
      return overlaps(
        slotStart,
        slotEnd,
        timeToMinutes(breakTime.start_time),
        timeToMinutes(breakTime.end_time)
      )
    })

    if (!hitBreaks.length) {
      periods.push({
        start_time: minutesToTime(slotStart),
        end_time: minutesToTime(slotEnd)
      })
      teachingSinceLastChangeover += periodMinutes
      cursor = slotEnd

      if (changeoverMinutes > 0 && teachingSinceLastChangeover >= 60) {
        cursor += changeoverMinutes
        teachingSinceLastChangeover = 0
      }
    } else {
      cursor = Math.max(...hitBreaks.map((breakTime) => timeToMinutes(breakTime.end_time)))
      teachingSinceLastChangeover = 0
    }
  }

  return periods
}

const groupedTimetables = computed(() => {
  const groups = new Map()

  timetableEntries.value.forEach((entry) => {
    if (!groups.has(entry.class_id)) {
      groups.set(entry.class_id, {
        class_id: entry.class_id,
        class_name: entry.class_name,
        level: entry.level,
        entries: [],
        moduleNames: new Set()
      })
    }

    groups.get(entry.class_id).entries.push(entry)
    groups.get(entry.class_id).moduleNames.add(entry.module_name)
  })

  return Array.from(groups.values()).map((group) => ({
    ...group,
    moduleCount: group.moduleNames.size,
    entries: group.entries.sort((a, b) => {
      const dayDiff = (dayOrder[a.day_of_week] ?? 99) - (dayOrder[b.day_of_week] ?? 99)
      if (dayDiff) return dayDiff
      return normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
    })
  })).sort((a, b) => `${a.level}${a.class_name}`.localeCompare(`${b.level}${b.class_name}`))
})

const visibleAssignments = computed(() => {
  if (!form.value.class_id) return assignments.value.slice(0, 8)
  return assignments.value.filter((assignment) => assignment.class_id === form.value.class_id)
})

const normalizeTime = (time) => {
  return (time || '').toString().slice(0, 5)
}

const timeToMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0')
  const mins = String(normalized % 60).padStart(2, '0')
  return `${hours}:${mins}`
}

const positiveInteger = (value, fallback) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

const nonNegativeInteger = (value, fallback) => {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : fallback
}

const addPeriods = (startMinutes, periodCount) => {
  const periodMinutes = positiveInteger(form.value.period_minutes, 60)
  const changeoverMinutes = nonNegativeInteger(settings.value.teacher_changeover_minutes, 0)
  const totalTeachingMinutes = periodCount * periodMinutes
  const changeoverCount = changeoverMinutes > 0 ? Math.floor(totalTeachingMinutes / 60) : 0
  return startMinutes + totalTeachingMinutes + (changeoverCount * changeoverMinutes)
}

const buildAutomaticBreaks = () => {
  const rules = layoutForm.value.enabled ? layoutForm.value : (settings.value.break_period_rules || {})
  const dayEnd = timeToMinutes(form.value.end_time)
  let cursor = timeToMinutes(form.value.start_time)
  const breaks = []
  const segments = [
    {
      break_name: 'Morning Break',
      periods: positiveInteger(rules.periods_before_morning_break, 3),
      duration: positiveInteger(rules.morning_break_minutes, 30)
    },
    {
      break_name: 'Lunch Break',
      periods: positiveInteger(rules.periods_before_lunch, 2),
      duration: positiveInteger(rules.lunch_break_minutes, 45)
    },
    {
      break_name: 'Evening Break',
      periods: positiveInteger(rules.periods_before_afternoon_break, 3),
      duration: positiveInteger(rules.afternoon_break_minutes, 30)
    }
  ]

  segments.forEach((segment) => {
    const breakStart = addPeriods(cursor, segment.periods)
    const breakEnd = breakStart + segment.duration
    if (breakStart >= dayEnd || breakEnd >= dayEnd) return

    breaks.push({
      break_name: segment.break_name,
      start_time: minutesToTime(breakStart),
      end_time: minutesToTime(breakEnd)
    })
    cursor = breakEnd
  })

  return breaks
}

const visibleBreaks = computed(() => {
  if (layoutForm.value.enabled || settings.value.break_period_rules?.enabled) {
    return buildAutomaticBreaks()
  }

  return settings.value.timetable_breaks
})

const formatTime = (time) => {
  const normalized = normalizeTime(time)
  if (!normalized) return '-'

  const [hours, minutes] = normalized.split(':').map(Number)
  const displayHours = hours > 12 ? hours - 12 : hours
  return `${displayHours}:${String(minutes).padStart(2, '0')}`
}

const formatTimeRange = (startTime, endTime) => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

const getBreakClass = (breakName) => {
  const normalized = String(breakName || '').toLowerCase()
  if (normalized.includes('morning')) return 'timetable-break-morning'
  if (normalized.includes('lunch')) return 'timetable-break-lunch'
  if (normalized.includes('evening') || normalized.includes('afternoon')) return 'timetable-break-evening'
  return 'timetable-break-default'
}

const validateGenerateForm = () => {
  formMessage.value = ''

  if (!form.value.days.length) {
    formMessage.value = 'Select at least one day.'
    return false
  }

  if (!Number.isInteger(form.value.period_minutes) || form.value.period_minutes < 1) {
    formMessage.value = 'Period minutes must be at least 1.'
    return false
  }

  if (form.value.end_time <= form.value.start_time) {
    formMessage.value = 'Day end must be after day start.'
    return false
  }

  if (!validateLayoutForm()) {
    return false
  }

  return true
}

const sanitizeLayoutRules = (rules) => {
  return {
    enabled: Boolean(rules.enabled),
    periods_before_morning_break: positiveInteger(rules.periods_before_morning_break, 3),
    periods_before_lunch: positiveInteger(rules.periods_before_lunch, 2),
    periods_before_afternoon_break: positiveInteger(rules.periods_before_afternoon_break, 3),
    periods_after_afternoon_break: positiveInteger(rules.periods_after_afternoon_break, 1),
    morning_break_minutes: positiveInteger(rules.morning_break_minutes, 30),
    lunch_break_minutes: positiveInteger(rules.lunch_break_minutes, 45),
    afternoon_break_minutes: positiveInteger(rules.afternoon_break_minutes, 30)
  }
}

const validateLayoutForm = () => {
  if (!layoutForm.value.enabled) return true

  const values = [
    layoutForm.value.periods_before_morning_break,
    layoutForm.value.periods_before_lunch,
    layoutForm.value.periods_before_afternoon_break,
    layoutForm.value.periods_after_afternoon_break,
    layoutForm.value.morning_break_minutes,
    layoutForm.value.lunch_break_minutes,
    layoutForm.value.afternoon_break_minutes
  ]

  if (values.some((value) => !Number.isInteger(Number(value)) || Number(value) < 1)) {
    formMessage.value = 'Layout values must be whole numbers of at least 1.'
    return false
  }

  return true
}

const saveLayoutSettings = async () => {
  const rules = sanitizeLayoutRules(layoutForm.value)
  const response = await api.put('/settings/timetable', {
    teacher_changeover_minutes: nonNegativeInteger(settings.value.teacher_changeover_minutes, 0),
    break_period_rules: rules
  })
  const data = response.data.settings || {}
  settings.value = {
    teacher_changeover_minutes: data.teacher_changeover_minutes ?? settings.value.teacher_changeover_minutes,
    timetable_breaks: Array.isArray(data.timetable_breaks) ? data.timetable_breaks : settings.value.timetable_breaks,
    break_period_rules: {
      ...rules,
      ...(data.break_period_rules || {})
    }
  }
  layoutForm.value = { ...settings.value.break_period_rules }
}

const generateTimetable = async () => {
  if (!validateGenerateForm()) return

  generating.value = true
  skippedItems.value = []

  try {
    if (layoutForm.value.enabled) {
      await saveLayoutSettings()
    }

    const response = await api.post('/timetable/generate', {
      class_id: form.value.class_id || null,
      days: form.value.days,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      period_minutes: form.value.period_minutes,
      replace_existing: form.value.replace_existing
    })

    skippedItems.value = response.data.skipped || []
    await loadTimetable()
  } catch (error) {
    console.error('Error generating timetable:', error)
    formMessage.value = error.response?.data?.message || 'Failed to generate timetable.'
  } finally {
    generating.value = false
  }
}

const applyReferenceTimetableLayout = async () => {
  savingLayout.value = true
  formMessage.value = ''

  form.value = {
    ...form.value,
    start_time: '08:00',
    end_time: '19:45',
    period_minutes: 60,
    days: [...days]
  }

  try {
    const response = await api.put('/settings/timetable', {
      teacher_changeover_minutes: 0,
      break_period_rules: referenceBreakRules
    })
    const data = response.data.settings || {}
    settings.value = {
      teacher_changeover_minutes: data.teacher_changeover_minutes ?? 0,
      timetable_breaks: Array.isArray(data.timetable_breaks) ? data.timetable_breaks : settings.value.timetable_breaks,
      break_period_rules: {
        ...referenceBreakRules,
        ...(data.break_period_rules || {}),
        enabled: true
      }
    }
    layoutForm.value = { ...settings.value.break_period_rules }
  } catch (error) {
    console.error('Error applying timetable layout:', error)
    settings.value = {
      ...settings.value,
      teacher_changeover_minutes: 0,
      break_period_rules: { ...referenceBreakRules }
    }
    layoutForm.value = { ...referenceBreakRules }
    formMessage.value = error.response?.data?.message || 'Layout applied locally, but saving settings failed.'
  } finally {
    savingLayout.value = false
  }
}

const addAssignment = async () => {
  assignmentMessage.value = ''
  savingAssignment.value = true

  try {
    const response = await api.post('/assignments', assignmentForm.value)
    if (response.data.assignment) {
      assignments.value.unshift(response.data.assignment)
      assignmentForm.value = {
        class_id: assignmentForm.value.class_id,
        teacher_id: '',
        module_id: '',
        academic_year: assignmentForm.value.academic_year,
        term: assignmentForm.value.term
      }
    }
  } catch (error) {
    assignmentMessage.value = error.response?.data?.message || 'Failed to add teacher-module assignment.'
  } finally {
    savingAssignment.value = false
  }
}

const loadClasses = async () => {
  const response = await api.get('/classes')
  classes.value = response.data.classes || []
}

const loadSetupData = async () => {
  loadingSetup.value = true

  try {
    const [teachersResponse, modulesResponse, assignmentsResponse] = await Promise.all([
      api.get('/teachers/active'),
      api.get('/modules'),
      api.get('/assignments')
    ])

    teachers.value = teachersResponse.data.teachers || []
    modules.value = modulesResponse.data.modules || []
    assignments.value = assignmentsResponse.data.assignments || []
  } catch (error) {
    assignmentMessage.value = error.response?.data?.message || 'Failed to load teacher-module setup data.'
  } finally {
    loadingSetup.value = false
  }
}

const loadSettings = async () => {
  const response = await api.get('/settings/timetable')
  const data = response.data.settings || {}
  settings.value = {
    teacher_changeover_minutes: data.teacher_changeover_minutes ?? 5,
    timetable_breaks: Array.isArray(data.timetable_breaks) ? data.timetable_breaks : [],
    break_period_rules: {
      ...settings.value.break_period_rules,
      ...(data.break_period_rules || {}),
      enabled: Boolean(data.break_period_rules?.enabled)
    }
  }
  layoutForm.value = { ...settings.value.break_period_rules }
}

const loadTimetable = async () => {
  loading.value = true

  try {
    const response = await api.get('/timetable')
    timetableEntries.value = response.data.timetables || []
  } catch (error) {
    console.error('Error loading timetable:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadClasses(),
    loadSetupData(),
    loadSettings(),
    loadTimetable()
  ])
})
</script>

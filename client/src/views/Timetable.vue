<template>
  <AppLayout>
    <div class="timetable-container">
      <!-- Assignment Form -->
      <div class="card-custom mb-4">
        <div class="card-body">
          <h2 class="h4 fw-semibold text-dark mb-4">📋 Assign Module to Teacher</h2>
          
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">🏫 Class</label>
              <select v-model="assignment.class_id" class="form-select">
                <option value="">Select Class</option>
                <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">
                  {{ cls.class_name }}
                </option>
              </select>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">👨‍🏫 Teacher</label>
              <select v-model="assignment.teacher_id" class="form-select">
                <option value="">Select Teacher</option>
                <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">📖 Module</label>
              <select v-model="assignment.module_id" class="form-select">
                <option value="">Select Module</option>
                <option v-for="module in modules" :key="module.module_id" :value="module.module_id">
                  {{ module.module_name }}
                </option>
              </select>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">📅 Academic Year</label>
              <input v-model="assignment.academic_year" class="form-control" placeholder="2024-2025">
            </div>

            <div class="col-md-3">
              <label class="form-label">🍂 Term</label>
              <select v-model="assignment.term" class="form-select">
                <option value="">Select Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>
          
          <div class="row mt-3">
            <div class="col-12">
              <button class="btn-primary" @click="addAssignment" :disabled="loading">
                {{ loading ? '⏳ Adding...' : '➕ Add Assignment' }}
              </button>
            </div>
          </div>
          
          <div v-if="assignmentMessage" class="alert alert-info mt-3">
            {{ assignmentMessage }}
          </div>
        </div>
      </div>

      <!-- Generate Timetable -->
      <div class="card-custom mb-4">
        <div class="card-body">
          <h2 class="h4 fw-semibold text-dark mb-4">⚙️ Generate Timetable</h2>
          
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">🏫 Class</label>
              <select v-model="generateSettings.class_id" class="form-select">
                <option value="">All Classes</option>
                <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">
                  {{ cls.class_name }}
                </option>
              </select>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">📊 Level</label>
              <select v-model="generateSettings.level" class="form-select">
                <option value="">All Levels</option>
                <option v-for="level in availableLevels" :key="level" :value="level">
                  Level {{ level }}
                </option>
              </select>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">⏱️ Teacher Changeover (min)</label>
              <input v-model.number="generateSettings.teacher_changeover_minutes" type="number" class="form-control" min="0" max="60">
            </div>
            
            <div class="col-md-3">
              <div class="form-check mt-4">
                <input v-model="generateSettings.replace_existing" class="form-check-input" type="checkbox" id="replaceExisting">
                <label class="form-check-label" for="replaceExisting">🔄 Replace existing</label>
              </div>
            </div>
          </div>
          
          <div class="row g-3 mt-3">
            <div class="col-md-3">
              <label class="form-label">🕐 Start Time</label>
              <input v-model="generateSettings.start_time" type="time" class="form-control">
            </div>
            
            <div class="col-md-3">
              <label class="form-label">🕕 End Time</label>
              <input v-model="generateSettings.end_time" type="time" class="form-control">
            </div>
            
            <div class="col-md-3">
              <label class="form-label">⏲️ Period (minutes)</label>
              <input v-model.number="generateSettings.period_minutes" type="number" class="form-control" min="30" max="180">
            </div>
            
            <div class="col-md-3">
              <label class="form-label">📆 Days</label>
              <div class="d-flex gap-2 flex-wrap">
                <div v-for="day in days" :key="day" class="form-check">
                  <input v-model="generateSettings.selected_days" :value="day" class="form-check-input" type="checkbox">
                  <label class="form-check-label">{{ day.slice(0,3) }}</label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="period-rules-card mt-4">
            <div class="period-rules-header">
              <div>
                <h3 class="period-rules-title">Period-Based Break Rules</h3>
                <p class="period-rules-description">
                  When enabled, breaks are calculated after a number of teaching periods instead of fixed clock times.
                </p>
              </div>
              <div class="form-switch">
                <input
                  id="periodRulesEnabled"
                  v-model="generateSettings.break_period_rules.enabled"
                  type="checkbox"
                >
                <label for="periodRulesEnabled">Enabled</label>
              </div>
            </div>

            <fieldset :disabled="!generateSettings.break_period_rules.enabled" class="period-rules-grid">
              <div>
                <label class="form-label">Periods Before Morning Break</label>
                <input
                  v-model.number="generateSettings.break_period_rules.periods_before_morning_break"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Periods Before Lunch</label>
                <input
                  v-model.number="generateSettings.break_period_rules.periods_before_lunch"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Periods Before Evening Break</label>
                <input
                  v-model.number="generateSettings.break_period_rules.periods_before_afternoon_break"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Periods After Evening Break</label>
                <input
                  v-model.number="generateSettings.break_period_rules.periods_after_afternoon_break"
                  type="number"
                  min="0"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Morning Break Minutes</label>
                <input
                  v-model.number="generateSettings.break_period_rules.morning_break_minutes"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Lunch Break Minutes</label>
                <input
                  v-model.number="generateSettings.break_period_rules.lunch_break_minutes"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
              <div>
                <label class="form-label">Evening Break Minutes</label>
                <input
                  v-model.number="generateSettings.break_period_rules.afternoon_break_minutes"
                  type="number"
                  min="1"
                  class="form-control"
                >
              </div>
            </fieldset>
          </div>

          <div class="shared-activities-card mt-4">
            <div class="shared-activities-header">
              <div>
                <h3 class="period-rules-title">Shared Activities</h3>
                <p class="period-rules-description">
                  Add activities that should appear at the same time across every generated class timetable.
                </p>
              </div>
              <button class="btn-secondary" type="button" @click="addSharedActivity">
                Add Activity
              </button>
            </div>

            <div v-if="!sharedActivities.length" class="shared-empty">
              No shared activities added.
            </div>

            <div v-for="(activity, index) in sharedActivities" :key="activity.id" class="shared-activity-row">
              <div>
                <label class="form-label">Activity Name</label>
                <input
                  v-model="activity.activity_name"
                  type="text"
                  class="form-control"
                  placeholder="Example: Assembly"
                >
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
              <div class="shared-activity-actions">
                <button class="btn-danger" type="button" @click="removeSharedActivity(index)">
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <div class="row mt-4">
            <div class="col-12">
              <button class="btn-success" @click="generateTimetable" :disabled="loading">
                {{ loading ? '⏳ Generating...' : '🚀 Generate Timetable' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timetable Display -->
      <div v-if="displayedTimetables.length > 0" class="card-custom timetable-output-card">
        <div class="card-body">
          <div class="timetable-display-controls">
            <h2 class="timetable-title">TIMETABLE</h2>
            <div class="timetable-class-filter">
              <label class="form-label">Class Timetable</label>
              <select v-model="selectedTimetableClassId" class="form-select">
                <option value="">All Classes</option>
                <option v-for="cls in classesWithTimetables" :key="cls.class_id" :value="String(cls.class_id)">
                  {{ cls.class_name }}
                </option>
              </select>
            </div>
          </div>
          
          <div v-for="group in displayedTimetables" :key="group.class_id" class="timetable-group mb-4">
            <div class="timetable-header">
              <strong>🏫 {{ group.class_name }}</strong>
              <span class="badge">{{ group.entries.length }} entries</span>
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
                    <td class="time-col" :class="row.breakType">
                      {{ formatTimeRange(row.start_time, row.end_time) }}
                    </td>
                    <td v-if="row.type === 'break'" :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                    <td v-for="day in days" v-else :key="day" class="text-center">
                      <div>
                        <div
                          v-if="row.entriesByDay[day]"
                          class="module-cell"
                          :class="{ 'activity-cell': row.entriesByDay[day].entry_type === 'activity' }"
                          :data-module="row.entriesByDay[day].module_name"
                        >
                          <strong>{{ row.entriesByDay[day].module_name }}</strong>
                          <small>{{ row.entriesByDay[day].teacher_name || (row.entriesByDay[day].entry_type === 'activity' ? 'Shared activity' : '') }}</small>
                          <span v-if="row.entriesByDay[day].entry_type !== 'activity'" class="room-badge">{{ row.entriesByDay[day].room || 'TBA' }}</span>
                        </div>
                        <span v-else class="empty-slot"></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const loading = ref(false)
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const timetableEntries = ref([])
const assignmentMessage = ref('')
const selectedTimetableClassId = ref('')
const sharedActivities = ref([])
let sharedActivityId = 0

const assignment = ref({
  class_id: '',
  teacher_id: '',
  module_id: '',
  academic_year: '',
  term: ''
})

const generateSettings = ref({
  class_id: '',
  level: '',
  start_time: '08:00',
  end_time: '19:45',
  period_minutes: 60,
  teacher_changeover_minutes: 5,
  replace_existing: true,
  selected_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
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
    if (!groups.has(classId)) {
      groups.set(classId, {
        class_id: classId,
        class_name: entry.class_name,
        level: entry.level,
        entries: []
      })
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
  if (!selectedTimetableClassId.value) return groupedTimetables.value
  return groupedTimetables.value.filter(group => String(group.class_id) === String(selectedTimetableClassId.value))
})

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  const s = start ? start.slice(0, 5) : ''
  const e = end ? end.slice(0, 5) : ''
  return `${s} - ${e}`
}

const isBreakEntry = (entry) => {
  return entry.entry_type === 'break' || String(entry.module_name || '').toLowerCase().includes('break')
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

const addAssignment = async () => {
  loading.value = true
  try {
    await api.post('/assignments', assignment.value)
    assignmentMessage.value = '✅ Assignment added successfully!'
    assignment.value = { class_id: '', teacher_id: '', module_id: '', academic_year: '', term: '' }
    await loadSetupData()
    await loadTimetable()
    setTimeout(() => { assignmentMessage.value = '' }, 3000)
  } catch (error) {
    assignmentMessage.value = '❌ Error: ' + (error.response?.data?.message || error.message)
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
    assignmentMessage.value = '✅ Timetable generated! ' + (response.data.generated_count || 0) + ' entries created.'
    await loadTimetable()
    if (generateSettings.value.class_id) {
      selectedTimetableClassId.value = String(generateSettings.value.class_id)
    }
    setTimeout(() => { assignmentMessage.value = '' }, 3000)
  } catch (error) {
    assignmentMessage.value = '❌ Error: ' + (error.response?.data?.message || error.message)
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
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await loadSetupData()
  await loadTimetable()
})
</script>

<style scoped>
.timetable-container { max-width: 1400px; margin: 0 auto; }
.card-custom { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
.card-body { padding: 1.25rem; }
.row { display: flex; flex-wrap: wrap; margin: -0.5rem; }
.col-md-3 { flex: 1; padding: 0.5rem; min-width: 180px; }
.btn-primary, .btn-success { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s; }
.btn-primary:hover, .btn-success:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
.btn-secondary, .btn-danger { border: none; padding: 0.55rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
.btn-secondary { background: #e0f2fe; color: #075985; }
.btn-danger { background: #fee2e2; color: #991b1b; }
.form-control, .form-select { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: #1e293b; background-color: white; appearance: auto; }
.form-select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 16px 12px; padding-right: 2.25rem; }
.form-select:hover { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.form-select:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.form-label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.8rem; color: #475569; }
.form-check { display: flex; align-items: center; gap: 0.5rem; }
.form-switch { display: flex; align-items: center; gap: 0.75rem; }
.form-switch input { width: 54px; height: 30px; appearance: none; background: #cbd5e1; border: none; border-radius: 999px; cursor: pointer; position: relative; transition: background 0.2s ease; }
.form-switch input:checked { background: #3b82f6; }
.form-switch input::before { content: ''; position: absolute; width: 26px; height: 26px; left: 2px; top: 2px; background: white; border-radius: 50%; box-shadow: 0 1px 4px rgba(15,23,42,0.2); transition: transform 0.2s ease; }
.form-switch input:checked::before { transform: translateX(24px); }
.form-switch label { color: #0f172a; cursor: pointer; font-size: 0.95rem; }
.badge { background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; }
.alert { padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
.alert-info { background: #e0f2fe; color: #0369a1; }
.period-rules-card, .shared-activities-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; background: #fff; }
.period-rules-header, .shared-activities-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.period-rules-title { margin: 0 0 0.5rem; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
.period-rules-description { margin: 0; max-width: 640px; color: #475569; font-size: 1rem; line-height: 1.6; }
.period-rules-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; border: 0; padding: 0; margin: 0; }
.period-rules-grid .form-label { margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 700; color: #334155; }
.period-rules-grid .form-control { min-height: 58px; padding: 0.75rem; border-radius: 12px; font-size: 1rem; }
.shared-empty { color: #64748b; font-weight: 600; }
.shared-activity-row { display: grid; grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr auto; gap: 1rem; align-items: end; margin-top: 1rem; }
.shared-activity-actions { display: flex; align-items: end; }
fieldset:disabled { opacity: 0.6; }
.table-responsive { overflow-x: auto; border: 1px solid #1f2937; background: #fff; }
.timetable-output-card > .card-body > .h4 { display: none; }
.timetable-display-controls { display: grid; grid-template-columns: 1fr minmax(220px, 320px); gap: 1rem; align-items: end; margin-bottom: 1rem; }
.timetable-title { margin: 0 0 0.85rem; text-align: center; color: #08245f; font-size: 4rem; line-height: 1; font-weight: 900; letter-spacing: 0; text-transform: uppercase; }
.timetable-class-filter { align-self: center; }
.timetable-class-filter .form-label { font-weight: 700; color: #08245f; }
.timetable-grid { width: 100%; min-width: 980px; border-collapse: collapse; table-layout: fixed; font-size: 1rem; background: white; border: 0; }
.timetable-grid th { background: linear-gradient(180deg, #082a68, #061d48); color: white; font-weight: 900; padding: 0.9rem 0.6rem; text-align: center; text-transform: uppercase; font-size: 1.2rem; border: 1px solid #9aa7bd; }
.timetable-grid th:first-child { width: 13%; }
.timetable-grid th:nth-child(2) { width: 14%; }
.timetable-grid td { border: 1px solid #3f3f46; padding: 0.55rem 0.45rem; text-align: center; vertical-align: middle; height: 58px; }
.period-col { background: #fff; color: #020617; font-size: 1.35rem; font-weight: 900; text-transform: uppercase; white-space: nowrap; }
.time-col { background: #fff; font-size: 1.1rem; font-weight: 500; color: #020617; white-space: nowrap; }
.break-label { display: block; color: #08245f; font-size: 1rem; font-weight: 900; text-transform: uppercase; }
.period-col.morning-break, .time-col.morning-break, .break-fill.morning-break { background: linear-gradient(90deg, #e8f4df, #d8eccb); }
.period-col.lunch-break, .time-col.lunch-break, .break-fill.lunch-break { background: linear-gradient(90deg, #fff4bf, #ffe99a); }
.period-col.evening-break, .time-col.evening-break, .break-fill.evening-break { background: linear-gradient(90deg, #e7f1ff, #d5e8ff); }
.period-col.lunch-break .break-label { color: #3f2f00; }
.break-fill { padding: 0; }
.module-cell { background: #f8fafc; border-radius: 8px; padding: 0.4rem; transition: all 0.2s; }
.module-cell:hover { transform: scale(1.02); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.module-cell strong { display: block; font-size: 0.75rem; color: #1e293b; }
.module-cell small { display: block; font-size: 0.6rem; color: #64748b; }
.module-cell.activity-cell { background: #f0fdf4; border-left: 4px solid #16a34a; }
.module-cell[data-module="Mathematics"] { background: #dbeafe; border-left: 4px solid #3b82f6; }
.module-cell[data-module="Physics"] { background: #dcfce7; border-left: 4px solid #22c55e; }
.module-cell[data-module="Chemistry"] { background: #fed7aa; border-left: 4px solid #f97316; }
.module-cell[data-module="English"] { background: #fae8ff; border-left: 4px solid #d946ef; }
.module-cell[data-module="Computer Sci."] { background: #e0e7ff; border-left: 4px solid #6366f1; }
.module-cell[data-module="Extra Class"] { background: #fef3c7; border-left: 4px solid #f59e0b; }
.module-cell[data-module="Library"] { background: #e2e8f0; border-left: 4px solid #64748b; }
.module-cell[data-module="Seminar Hall A"] { background: #ccfbf1; border-left: 4px solid #14b8a6; }
.room-badge { display: inline-block; margin-top: 0.2rem; padding: 0.1rem 0.3rem; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 0.55rem; color: #475569; }
.empty-slot { display: block; min-height: 1rem; }
.timetable-group { border: 0; border-radius: 0; margin-bottom: 1.25rem; overflow: visible; }
.timetable-header { background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.text-center { text-align: center; }
.text-muted { color: #64748b; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 1.5rem; }
@media (max-width: 768px) {
  .col-md-3 { min-width: 100%; }
  .timetable-display-controls { grid-template-columns: 1fr; }
  .timetable-title { font-size: 2.4rem; }
  .period-rules-card { padding: 1rem; }
  .period-rules-grid { grid-template-columns: 1fr; gap: 1rem; }
  .period-rules-description { font-size: 0.95rem; }
  .shared-activities-card { padding: 1rem; }
  .shared-activity-row { grid-template-columns: 1fr; }
}
</style>

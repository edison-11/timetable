<template>
  <div class="min-vh-100 admin-page">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Timetable Management</h1>
        </div>
        <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
          A
        </div>
      </div>
    </header>

    <div class="d-flex admin-page-shell">
      <!-- Sidebar -->
      <AdminSidebar />

      <!-- Main Content -->
      <main class="flex-grow-1 p-4 admin-main">
        <!-- Assignment Form -->
        <div class="card-custom mb-4">
          <div class="card-body">
            <h2 class="h4 fw-semibold text-dark mb-4">Assign Module to Teacher</h2>
            
            <div class="row g-3">
              <div class="col-md-3">
                <label for="classSelect" class="form-label">Class</label>
                <select v-model="assignment.class_id" class="form-select" id="classSelect">
                  <option value="">Select Class</option>
                  <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">
                    {{ cls.class_name }}
                  </option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="teacherSelect" class="form-label">Teacher</label>
                <select v-model="assignment.teacher_id" class="form-select" id="teacherSelect">
                  <option value="">Select Teacher</option>
                  <option v-for="teacher in teachers" :key="teacher.teacher_id" :value="teacher.teacher_id">
                    {{ teacher.name }}
                  </option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="moduleSelect" class="form-label">Module</label>
                <select v-model="assignment.module_id" class="form-select" id="moduleSelect">
                  <option value="">Select Module</option>
                  <option v-for="module in modules" :key="module.module_id" :value="module.module_id">
                    {{ module.module_name }}
                  </option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="termSelect" class="form-label">Term</label>
                <select v-model="assignment.term" class="form-select" id="termSelect">
                  <option value="">Select Term</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
            
            <div class="row mt-3">
              <div class="col-12">
                <button @click="addAssignment" class="btn btn-primary-custom" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </span>
                  <span v-else>Add Assignment</span>
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
            <h2 class="h4 fw-semibold text-dark mb-4">Generate Timetable</h2>
            
            <div class="row g-3">
              <div class="col-md-3">
                <label for="classSelect" class="form-label">Class</label>
                <select v-model="generateSettings.class_id" class="form-select" id="classSelect" @change="onClassChange">
                  <option value="">All Classes</option>
                  <option v-for="cls in classes" :key="cls.class_id" :value="cls.class_id">
                    {{ cls.class_name }}
                  </option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="levelSelect" class="form-label">Level</label>
                <select v-model="generateSettings.level" class="form-select" id="levelSelect" @change="onLevelChange">
                  <option value="">All Levels</option>
                  <option v-for="level in availableLevels" :key="level" :value="level">
                    Level {{ level }}
                  </option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="changeoverMinutes" class="form-label">Teacher Changeover (minutes)</label>
                <input v-model.number="generateSettings.teacher_changeover_minutes" type="number" class="form-control" id="changeoverMinutes" min="0" max="60">
              </div>
              
              <div class="col-md-3">
                <label for="replaceExisting" class="form-label">Replace Existing</label>
                <div class="form-check">
                  <input v-model="generateSettings.replace_existing" class="form-check-input" type="checkbox" id="replaceExisting">
                  <label class="form-check-label" for="replaceExisting">
                    Replace existing timetable entries
                  </label>
                </div>
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label for="academicYear" class="form-label">Academic Year</label>
                <select v-model="generateSettings.academic_year" class="form-select" id="academicYear">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
              
              <div class="col-md-3">
                <label for="termSelect" class="form-label">Term</label>
                <select v-model="generateSettings.term" class="form-select" id="termSelect">
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label for="dailyStartTime" class="form-label">Daily Start Time</label>
                <input v-model="generateSettings.start_time" type="time" class="form-control" id="dailyStartTime" placeholder="08:00">
              </div>
              
              <div class="col-md-3">
                <label for="dailyEndTime" class="form-label">Daily End Time</label>
                <input v-model="generateSettings.end_time" type="time" class="form-control" id="dailyEndTime" placeholder="17:30">
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label for="beforeMorningBreak" class="form-label">Before Morning Break (periods)</label>
                <input v-model.number="generateSettings.before_morning_break" type="number" class="form-control" id="beforeMorningBreak" min="1" max="6" placeholder="3">
              </div>
              
              <div class="col-md-3">
                <label for="morningBreakLength" class="form-label">Morning Break Length (minutes)</label>
                <input v-model.number="generateSettings.morning_break_length" type="number" class="form-control" id="morningBreakLength" min="5" max="60" placeholder="15">
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label for="afterBreakPeriod" class="form-label">After Break Period (periods)</label>
                <input v-model.number="generateSettings.after_break_period" type="number" class="form-control" id="afterBreakPeriod" min="1" max="6" placeholder="2">
              </div>
              
              <div class="col-md-3">
                <label for="lunchLength" class="form-label">Lunch Length (minutes)</label>
                <input v-model.number="generateSettings.lunch_length" type="number" class="form-control" id="lunchLength" min="15" max="120" placeholder="60">
              </div>
              
              <div class="col-md-3">
                <label for="afterLunchPeriod" class="form-label">After Lunch Period (periods)</label>
                <input v-model.number="generateSettings.after_lunch_period" type="number" class="form-control" id="afterLunchPeriod" min="1" max="6" placeholder="3">
              </div>
              
              <div class="col-md-3">
                <label for="noonBreakLength" class="form-label">Noon Break Length (minutes)</label>
                <input v-model.number="generateSettings.noon_break_length" type="number" class="form-control" id="noonBreakLength" min="5" max="60" placeholder="15">
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label for="afterNoonBreakPeriod" class="form-label">After Noon Break Period (periods)</label>
                <input v-model.number="generateSettings.after_noon_break_period" type="number" class="form-control" id="afterNoonBreakPeriod" min="1" max="6" placeholder="2">
              </div>
              
              <div class="col-md-3">
                <label for="periodMinutes" class="form-label">Period (minutes)</label>
                <input v-model.number="generateSettings.period_minutes" type="number" class="form-control" id="periodMinutes" min="30" max="180">
              </div>
              
              <div class="col-md-3">
                <label for="changeoverMinutes" class="form-label">Teacher Changeover (minutes)</label>
                <input v-model.number="generateSettings.teacher_changeover_minutes" type="number" class="form-control" id="changeoverMinutes" min="0" max="60">
              </div>
              
              <div class="col-md-3">
                <label for="replaceExisting" class="form-label">Replace Existing</label>
                <div class="form-check">
                  <input v-model="generateSettings.replace_existing" class="form-check-input" type="checkbox" id="replaceExisting">
                  <label class="form-check-label" for="replaceExisting">
                    Replace existing timetable entries
                  </label>
                </div>
              </div>
            </div>
            
            <div class="row g-3 mt-1">
              <div class="col-md-3">
                <label class="form-label">Days to Generate</label>
                <div class="d-flex gap-2 flex-wrap">
                  <div v-for="day in days" :key="day" class="form-check">
                    <input v-model="generateSettings.selected_days" :value="day" class="form-check-input" type="checkbox" :id="`day-${day}`">
                    <label class="form-check-label" :for="`day-${day}`">{{ day }}</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-3">
              <div class="col-12">
                <button @click="generateTimetable" class="btn btn-success" :disabled="loading">
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating...
                  </span>
                  <span v-else>Generate Timetable</span>
                </button>
              </div>
            </div>

            <div class="mt-4">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h3 class="h6 fw-semibold text-dark mb-0">Shared Activities</h3>
                <button type="button" class="btn btn-outline-primary btn-sm" @click="addSharedActivity">
                  Add Activity
                </button>
              </div>

              <div v-if="!generateSettings.shared_activities.length" class="text-muted small mt-2">
                No shared activities added.
              </div>

              <div v-for="(activity, index) in generateSettings.shared_activities" :key="index" class="row g-2 align-items-end mt-2">
                <div class="col-md-3">
                  <label class="form-label">Activity</label>
                  <input v-model="activity.activity_name" type="text" class="form-control" placeholder="Assembly" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Day</label>
                  <select v-model="activity.day_of_week" class="form-select" required>
                    <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Start</label>
                  <input v-model="activity.start_time" type="time" class="form-control" required>
                </div>
                <div class="col-md-2">
                  <label class="form-label">End</label>
                  <input v-model="activity.end_time" type="time" class="form-control" required>
                </div>
                <div class="col-md-2">
                  <button type="button" class="btn btn-outline-danger w-100" @click="removeSharedActivity(index)">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timetable Display -->
        <div v-if="groupedTimetables.length > 0" class="card-custom">
          <div class="card-body">
            <h2 class="h4 fw-semibold text-dark mb-4">Generated Timetables</h2>
            
            <div class="accordion" id="timetableAccordion">
              <div v-for="group in groupedTimetables" :key="group.class_id" class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="`#class-${group.class_id}`" aria-expanded="false" :aria-controls="`class-${group.class_id}`">
                    <div class="d-flex justify-content-between align-items-center w-100">
                      <div>
                        <strong>{{ group.class_name }}</strong>
                        <div class="small text-muted">Level {{ group.level }}</div>
                      </div>
                      <span class="badge bg-primary">{{ group.entries.length }} entries</span>
                    </div>
                  </button>
                </h2>
                
                <div :id="`class-${group.class_id}`" class="accordion-collapse collapse" data-bs-parent="#timetableAccordion">
                  <div class="accordion-body">
                    <div class="table-responsive">
                      <table class="table table-bordered timetable-grid">
                        <thead>
                          <tr>
                            <th class="text-center">Time</th>
                            <th v-for="day in days" :key="day" class="text-center">{{ day }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-for="(row, rowIndex) in buildTimetableGridRows(group)" :key="rowIndex">
                            <tr v-if="row.type === 'break'" class="timetable-break-row text-center">
                              <td class="fw-bold">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                              <td v-for="day in days" :key="day" class="text-center">
                                <strong class="text-uppercase">{{ row.breakName }}</strong>
                              </td>
                            </tr>
                            <tr v-else>
                              <td class="fw-bold time-column">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                              <td v-for="day in days" :key="day" class="text-center module-cell">
                                <div v-if="row.entriesByDay[day] && row.entriesByDay[day].module_name" class="module-content">
                                  <div class="fw-semibold">
                                    {{ row.entriesByDay[day].module_name }}
                                  </div>
                                  <div v-if="row.entriesByDay[day].entry_type === 'activity'" class="fw-normal text-primary small">
                                    Shared activity
                                  </div>
                                  <div v-else class="fw-normal text-muted small">
                                    {{ row.entriesByDay[day].teacher_name }}
                                  </div>
                                </div>
                                <div v-else class="module-content">
                                  <div class="fw-semibold text-muted">
                                    -
                                  </div>
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
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/stores/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const route = useRoute()

// Navigation

// State
const loading = ref(false)
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const timetableEntries = ref([])
const assignmentMessage = ref('')

// Assignment form
const assignment = ref({
  class_id: '',
  teacher_id: '',
  module_id: '',
  term: ''
})

// Generate settings
const generateSettings = ref({
  class_id: '',
  level: '',
  academic_year: '2024-2025',
  term: 'Fall',
  start_time: '',
  end_time: '',
  before_morning_break: 3,
  morning_break_length: 15,
  after_break_period: 2,
  lunch_length: 60,
  after_lunch_period: 3,
  noon_break_length: 15,
  after_noon_break_period: 2,
  period_minutes: 60,
  teacher_changeover_minutes: 5,
  replace_existing: false,
  shared_activities: [],
  selected_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
})

// Days of week
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Computed properties
const availableLevels = computed(() => {
  const levels = new Set()
  classes.value.forEach(cls => {
    if (cls.level) {
      levels.add(cls.level)
    }
  })
  return Array.from(levels).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
})

const groupedTimetables = computed(() => {
  const groups = new Map()
  
  timetableEntries.value.forEach(entry => {
    // Filter out any entries with 'continue' in module_name
    if (!entry.module_name || entry.module_name === 'continue') {
      return
    }
    
    const classId = entry.class_id
    const className = entry.class_name
    const classLevel = entry.level
    
    if (!groups.has(classId)) {
      groups.set(classId, {
        class_id: classId,
        class_name: className,
        level: classLevel,
        entries: []
      })
    }
    
    groups.get(classId).entries.push(entry)
  })
  
  return Array.from(groups.values())
})

// Methods
const formatTime = (time) => {
  if (!time) return ''
  return time.slice(0, 5)
}

const formatTimeRange = (startTime, endTime) => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

const convertTo24Hour = (time12h) => {
  if (!time12h) return time12h
  
  // If already in 24-hour format (HH:MM), return as is
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time12h)) {
    return time12h
  }
  
  // Convert 12-hour format to 24-hour format
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':')
  
  if (hours.length === 1) {
    hours = '0' + hours
  }
  
  if (modifier === 'PM' && hours !== '12') {
    hours = String(parseInt(hours, 10) + 12).padStart(2, '0')
  } else if (modifier === 'AM' && hours === '12') {
    hours = '00'
  }
  
  return `${hours}:${minutes}`
}

const addAssignment = async () => {
  loading.value = true
  assignmentMessage.value = ''
  
  try {
    await api.post('/assignments', assignment.value)
    assignmentMessage.value = 'Assignment added successfully!'
    
    // Reset form
    assignment.value = {
      class_id: '',
      teacher_id: '',
      module_id: '',
      term: ''
    }
    
    // Reload data
    await loadSetupData()
    await loadTimetable()
  } catch (error) {
    assignmentMessage.value = 'Error adding assignment: ' + (error.response?.data?.message || error.message)
  } finally {
    loading.value = false
  }
}

const onClassChange = () => {
  // When class is selected, clear level selection
  generateSettings.value.level = ''
}

const onLevelChange = () => {
  // When level is selected, clear class selection
  generateSettings.value.class_id = ''
}

const addSharedActivity = () => {
  generateSettings.value.shared_activities.push({
    activity_name: 'Assembly',
    day_of_week: generateSettings.value.selected_days[0] || 'Monday',
    start_time: '10:00',
    end_time: '11:00'
  })
}

const removeSharedActivity = (index) => {
  generateSettings.value.shared_activities.splice(index, 1)
}

const getApiErrorMessage = (error) => {
  const data = error.response?.data

  if (data?.message) {
    return data.message
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => item.msg).filter(Boolean).join(', ')
  }

  return error.message
}

const generateTimetable = async () => {
  loading.value = true
  assignmentMessage.value = ''
  
  try {
    // Prepare request data with period settings
    const requestData = {
      class_id: generateSettings.value.class_id || null,
      level: generateSettings.value.level || null,
      academic_year: generateSettings.value.academic_year,
      term: generateSettings.value.term,
      start_time: generateSettings.value.start_time ? generateSettings.value.start_time : null,
      end_time: generateSettings.value.end_time ? generateSettings.value.end_time : null,
      before_morning_break: generateSettings.value.before_morning_break,
      morning_break_length: generateSettings.value.morning_break_length,
      after_break_period: generateSettings.value.after_break_period,
      lunch_length: generateSettings.value.lunch_length,
      after_lunch_period: generateSettings.value.after_lunch_period,
      noon_break_length: generateSettings.value.noon_break_length,
      after_noon_break_period: generateSettings.value.after_noon_break_period,
      period_minutes: generateSettings.value.period_minutes,
      days: generateSettings.value.selected_days,
      replace_existing: generateSettings.value.replace_existing,
      teacher_changeover_minutes: generateSettings.value.teacher_changeover_minutes,
      shared_activities: generateSettings.value.shared_activities.map((activity) => ({
        activity_name: activity.activity_name.trim(),
        day_of_week: activity.day_of_week,
        start_time: convertTo24Hour(activity.start_time),
        end_time: convertTo24Hour(activity.end_time)
      }))
    }
    
    const response = await api.post('/timetable/generate', requestData)
    const generatedCount = response.data.generated_count ?? response.data.generated?.length ?? 0
    assignmentMessage.value = `Timetable generated successfully! ${generatedCount} entries created.`
    
    await loadTimetable()
  } catch (error) {
    console.error('Generation error:', error.response?.data)
    assignmentMessage.value = 'Error generating timetable: ' + getApiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const generateInternalTimetableFormat = async () => {
  try {
    // Get all timetable data
    const response = await api.get('/timetable')
    const timetableData = response.data.timetables || []
    
    // Group by class and create internal admin layout format
    const internalFormat = {}
    
    timetableData.forEach(entry => {
      const classKey = `${entry.class_name}_${entry.level || 'General'}`
      
      if (!internalFormat[classKey]) {
        internalFormat[classKey] = {
          class_name: entry.class_name,
          level: entry.level || 'General',
          academic_year: entry.academic_year || '2024-2025',
          term: entry.term || 'Fall',
          layout_pattern: 'admin_fixed',
          time_blocks: {
            morning_session: {
              duration_hours: 3,
              break_after: true,
              description: '3 hours before morning break'
            },
            after_morning_break: {
              duration_hours: 2,
              break_after: true,
              description: '2 hours after morning break'
            },
            after_lunch: {
              duration_hours: 3,
              break_after: true,
              description: '3 hours after lunch'
            },
            after_noon_break: {
              duration_hours: 2,
              break_after: false,
              description: '2 hours after noon break'
            }
          },
          daily_schedule: {}
        }
      }
      
      const dayKey = entry.day_of_week
      if (!internalFormat[classKey].daily_schedule[dayKey]) {
        internalFormat[classKey].daily_schedule[dayKey] = []
      }
      
      // Categorize sessions by time blocks
      const timeBlock = categorizeTimeBlock(entry.start_time, entry.end_time)
      
      internalFormat[classKey].daily_schedule[dayKey].push({
        start_time: entry.start_time,
        end_time: entry.end_time,
        teacher_name: entry.teacher_name,
        module_name: entry.module_name,
        room: entry.room || 'TBA',
        activity_type: entry.activity_type || 'Regular',
        time_block: timeBlock
      })
    })
    
    // Export as JSON file
    const blob = new Blob([JSON.stringify(internalFormat, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin_layout_timetable_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    assignmentMessage.value += ' Admin layout timetable downloaded!'
  } catch (error) {
    console.error('Error generating internal format:', error)
    assignmentMessage.value += ' Failed to generate admin layout format.'
  }
}

const categorizeTimeBlock = (startTime, endTime) => {
  const startHour = parseInt(startTime.split(':')[0])
  
  if (startHour >= 8 && startHour < 11) {
    return 'morning_session' // 3 hours before morning break
  } else if (startHour >= 11 && startHour < 13) {
    return 'after_morning_break' // 2 hours after morning break
  } else if (startHour >= 13 && startHour < 16) {
    return 'after_lunch' // 3 hours after lunch
  } else if (startHour >= 16 && startHour < 18) {
    return 'after_noon_break' // 2 hours after noon break
  }
  
  return 'other'
}

const getWeekNumber = (dayOfWeek) => {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const dayIndex = weekDays.indexOf(dayOfWeek)
  
  // 3-2-3-2 pattern: Week 1 (Mon-Wed), Week 2 (Thu-Fri), Week 3 (Mon-Tue), Week 4 (Wed-Thu), Week 5 (Fri-Mon)...
  if (dayIndex <= 2) return 'Week 1'  // Mon, Tue, Wed
  if (dayIndex <= 4) return 'Week 2'  // Thu, Fri
  return 'Week 1' // Default
}

const getWeekPattern = (weekNumber) => {
  const patterns = {
    'Week 1': '3-2-3-2',
    'Week 2': '3-2-3-2',
    'Week 3': '3-2-3-2',
    'Week 4': '3-2-3-2',
    'Week 5': '3-2-3-2'
  }
  return patterns[weekNumber] || '3-2-3-2'
}

const buildTimetableGridRows = (group) => {
  const entriesByDay = new Map()
  
  // Group entries by day
  group.entries.forEach(entry => {
    const dayEntries = entriesByDay.get(entry.day_of_week) || []
    dayEntries.push({
      ...entry,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5)
    })
    entriesByDay.set(entry.day_of_week, dayEntries)
  })
  
  const timeSlotMap = new Map()

  group.entries.forEach(entry => {
    const startTime = entry.start_time.slice(0, 5)
    const endTime = entry.end_time.slice(0, 5)
    timeSlotMap.set(`${startTime}-${endTime}`, {
      start_time: startTime,
      end_time: endTime
    })
  })

  const timeSlots = Array.from(timeSlotMap.values()).sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  })
  
  // Build rows
  const rows = []
  
  timeSlots.forEach(slot => {
    const rowEntriesByDay = {}
    
    days.forEach(day => {
      const dayEntries = entriesByDay.get(day) || []
      
      // First try to find exact time match
      let entry = dayEntries.find(item => item.start_time === slot.start_time)
      
      if (!entry) {
        // Check if this time slot is covered by a previous entry that spans multiple periods
        entry = dayEntries.find(item => {
          const itemStart = timeToMinutes(item.start_time)
          const itemEnd = timeToMinutes(item.end_time)
          const slotStart = timeToMinutes(slot.start_time)
          const slotEnd = timeToMinutes(slot.end_time)
          return itemStart < slotStart && itemEnd > slotStart
        })
      }
      
      if (!entry) {
        // Check if this time slot falls within an activity (activities can have custom times)
        entry = dayEntries.find(item => {
          const itemStart = timeToMinutes(item.start_time)
          const itemEnd = timeToMinutes(item.end_time)
          const slotStart = timeToMinutes(slot.start_time)
          const slotEnd = timeToMinutes(slot.end_time)
          // Entry overlaps with this time slot
          return item.entry_type === 'activity' && 
                 itemStart <= slotStart && 
                 itemEnd >= slotEnd
        })
      }
      
      rowEntriesByDay[day] = entry || null
    })
    
    const rowEntries = Object.values(rowEntriesByDay).filter(Boolean)
    const isBreak = rowEntries.length > 0 && rowEntries.every(entry => entry.entry_type === 'break')
    const breakEntry = rowEntries[0]
    
    if (isBreak) {
      rows.push({
        type: 'break',
        breakName: breakEntry.module_name || 'Break',
        start_time: slot.start_time,
        end_time: slot.end_time,
        entriesByDay: rowEntriesByDay
      })
    } else {
      rows.push({
        type: 'period',
        start_time: slot.start_time,
        end_time: slot.end_time,
        entriesByDay: rowEntriesByDay
      })
    }
  })
  
  return rows
}

const timeToMinutes = (time) => {
  const [hours, minutes] = (time || '00:00').split(':').map(Number)
  return hours * 60 + minutes
}

// Data loading
const loadClasses = async () => {
  try {
    const response = await api.get('/classes')
    classes.value = response.data.classes || []
  } catch (error) {
    console.error('Error loading classes:', error)
  }
}

const loadTeachers = async () => {
  try {
    const response = await api.get('/teachers')
    teachers.value = response.data.teachers || []
  } catch (error) {
    console.error('Error loading teachers:', error)
  }
}

const loadModules = async () => {
  try {
    const response = await api.get('/modules')
    modules.value = response.data.modules || []
  } catch (error) {
    console.error('Error loading modules:', error)
  }
}

const loadSetupData = async () => {
  await Promise.all([
    loadClasses(),
    loadTeachers(),
    loadModules()
  ])
}

const loadTimetable = async () => {
  try {
    const response = await api.get('/timetable')
    timetableEntries.value = response.data.timetables || []
  } catch (error) {
    console.error('Error loading timetable:', error)
  }
}

onMounted(async () => {
  await loadSetupData()
  await loadTimetable()
})
</script>

<style scoped>
.header-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-custom {
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
}

.nav-item-custom {
  color: #495057;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item-custom:hover {
  background-color: #e9ecef;
  color: #495057;
}

.nav-item-custom.active {
  background-color: #007bff;
  color: white;
}

.card-custom {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1rem;
}

.card-body {
  padding: 1.5rem;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.btn-primary-custom:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}

.timetable-grid {
  font-size: 0.875rem;
  border-collapse: collapse;
  width: 100%;
  border: 2px solid #dee2e6;
}

.timetable-grid th {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  color: #495057;
}

.timetable-grid td {
  border: 2px solid #dee2e6;
  padding: 0.75rem;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
  min-width: 120px;
  height: 50px;
}

.timetable-grid .time-column {
  font-weight: bold;
  background: #e9ecef !important;
  min-width: 100px;
  color: #495057;
}

.timetable-grid .module-cell {
  background: #ffffff !important;
  color: #212529;
}

.timetable-grid .module-content {
  font-weight: 600;
  font-size: 0.9rem;
}

.timetable-break-row {
  background: #fff3cd !important;
}

.timetable-break-row td {
  font-style: italic;
  color: #6c757d !important;
  font-weight: bold;
  background: #fff3cd !important;
  text-transform: uppercase;
}

.accordion-button {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: #495057;
}

.accordion-button:hover {
  background-color: #f8f9fa;
}

.accordion-collapse {
  border: none;
}

/* Accordion button fixes */
.accordion-button {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: #495057;
  position: relative;
}

.accordion-button .w-100 {
  width: 100%;
}

.accordion-button:not(.collapsed) {
  background-color: #f8f9fa;
  color: #212529;
}

.accordion-button:focus {
  box-shadow: none;
  border-color: rgba(0,0,0,.125);
}

.accordion-button::after {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-left: auto;
  content: "";
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23212529'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: 1.25rem;
  transition: transform .2s ease-in-out;
}

.accordion-button:not(.collapsed)::after {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%230c63e4'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  transform: rotate(-180deg);
}


</style>

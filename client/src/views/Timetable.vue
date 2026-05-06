<template>
  <div class="min-vh-100">
    <!-- Header -->
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            📅
          </div>
          <h1 class="h2 mb-0">Timetable Management</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="text-light opacity-75">Welcome, Admin</span>
          <router-link to="/dashboard" class="btn btn-outline-light btn-sm">
            <i class="bi bi-arrow-left me-1"></i>
            Back to Dashboard
          </router-link>
        </div>
      </div>
    </header>

    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar-custom" style="width: 250px;">
        <div class="p-3">
          <router-link 
            v-for="item in navigation" 
            :key="item.name"
            :to="item.path"
            class="nav-item-custom d-block mb-2"
            :class="{ 'active': route.path === item.path }"
          >
            <span class="fs-5">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow-1 p-4">
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
                <label for="startTime" class="form-label">Start Time</label>
                <input v-model="generateSettings.start_time" type="time" class="form-control" id="startTime">
              </div>
              
              <div class="col-md-3">
                <label for="endTime" class="form-label">End Time</label>
                <input v-model="generateSettings.end_time" type="time" class="form-control" id="endTime">
              </div>
              
              <div class="col-md-3">
                <label for="periodMinutes" class="form-label">Period (minutes)</label>
                <input v-model.number="generateSettings.period_minutes" type="number" class="form-control" id="periodMinutes" min="30" max="180">
              </div>
              
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
                                  <div class="fw-normal text-muted small">
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

const router = useRouter()
const route = useRoute()

// Navigation
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
  start_time: '08:00',
  end_time: '19:00',
  period_minutes: 60,
  teacher_changeover_minutes: 5,
  replace_existing: false,
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
  return Array.from(levels).sort((a, b) => a - b)
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

const generateTimetable = async () => {
  loading.value = true
  
  try {
    // Prepare request data with only the fields the backend expects
    const requestData = {
      class_id: generateSettings.value.class_id || null,
      start_time: generateSettings.value.start_time,
      end_time: generateSettings.value.end_time,
      period_minutes: generateSettings.value.period_minutes,
      days: generateSettings.value.selected_days,
      replace_existing: generateSettings.value.replace_existing,
      teacher_changeover_minutes: generateSettings.value.teacher_changeover_minutes
    }
    
    const response = await api.post('/timetable/generate', requestData)
    assignmentMessage.value = `Timetable generated successfully! ${response.data.generated || 0} entries created.`
    
    await loadTimetable()
  } catch (error) {
    console.error('Generation error:', error.response?.data)
    assignmentMessage.value = 'Error generating timetable: ' + (error.response?.data?.message || error.message)
  } finally {
    loading.value = false
  }
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
  
  // Create time slots
  const timeSlots = []
  const startTimes = ['08:00', '09:00', '10:00', '11:00', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:00']
  
  startTimes.forEach(startTime => {
    const endTime = getNextTime(startTime)
    timeSlots.push({
      start_time: startTime,
      end_time: endTime
    })
  })
  
  // Build rows
  const rows = []
  
  timeSlots.forEach(slot => {
    const rowEntriesByDay = {}
    
    days.forEach(day => {
      const dayEntries = entriesByDay.get(day) || []
      const entry = dayEntries.find(item => item.start_time === slot.start_time)
      
      if (entry) {
        rowEntriesByDay[day] = entry
      } else {
        // Check if this time slot is covered by a previous entry that spans multiple periods
        const coveringEntry = dayEntries.find(item => {
          const itemStart = timeToMinutes(item.start_time)
          const itemEnd = timeToMinutes(item.end_time)
          const slotStart = timeToMinutes(slot.start_time)
          const slotEnd = timeToMinutes(slot.end_time)
          return itemStart < slotStart && itemEnd > slotStart
        })
        rowEntriesByDay[day] = coveringEntry || null
      }
    })
    
    // Check if it's a break time
    const isBreak = slot.start_time === '11:00' || slot.start_time === '13:30' || slot.start_time === '17:30'
    
    if (isBreak) {
      rows.push({
        type: 'break',
        breakName: slot.start_time === '11:00' ? 'BREAK' : slot.start_time === '13:30' ? 'LUNCH' : 'BREAK',
        start_time: slot.start_time,
        end_time: slot.end_time,
        entriesByDay: {}
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

const getNextTime = (currentTime) => {
  const timeMap = {
    '08:00': '09:00',
    '09:00': '10:00',
    '10:00': '11:00',
    '11:00': '11:30',
    '11:30': '12:30',
    '12:30': '13:30',
    '13:30': '14:30',
    '14:30': '15:30',
    '15:30': '16:30',
    '16:30': '17:30',
    '17:30': '18:00',
    '18:00': '19:00'
  }
  return timeMap[currentTime] || '19:00'
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
  padding: 1rem;
  border-radius: 0.5rem;
}

.sidebar-custom {
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  min-height: calc(100vh - 80px);
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

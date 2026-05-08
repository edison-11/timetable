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
      <div v-if="groupedTimetables.length > 0" class="card-custom">
        <div class="card-body">
          <h2 class="h4 fw-semibold text-dark mb-4">📅 Generated Timetables</h2>
          
          <div v-for="group in groupedTimetables" :key="group.class_id" class="timetable-group mb-4">
            <div class="timetable-header">
              <strong>🏫 {{ group.class_name }}</strong>
              <span class="badge">{{ group.entries.length }} entries</span>
            </div>
            <div class="table-responsive">
              <table class="timetable-grid">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in buildTimetableGridRows(group)" :key="row.start_time">
                    <td class="time-col">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                    <td v-for="day in days" :key="day" class="text-center">
                      <div v-if="row.entriesByDay[day]" class="module-cell" :data-module="row.entriesByDay[day].module_name">
                        <strong>{{ row.entriesByDay[day].module_name }}</strong>
                        <small>{{ row.entriesByDay[day].teacher_name }}</small>
                        <span class="room-badge">{{ row.entriesByDay[day].room || 'TBA' }}</span>
                      </div>
                      <span v-else class="text-muted empty-slot">—</span>
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
  end_time: '16:00',
  period_minutes: 60,
  teacher_changeover_minutes: 5,
  replace_existing: false,
  selected_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
})

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

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

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  const s = start ? start.slice(0, 5) : ''
  const e = end ? end.slice(0, 5) : ''
  return `${s} - ${e}`
}

const buildTimetableGridRows = (group) => {
  const timeSlots = new Map()
  group.entries.forEach(entry => {
    const start = entry.start_time?.slice(0, 5)
    const end = entry.end_time?.slice(0, 5)
    if (start && end) {
      const key = `${start}-${end}`
      if (!timeSlots.has(key)) {
        timeSlots.set(key, { start_time: start, end_time: end, entriesByDay: {} })
      }
      timeSlots.get(key).entriesByDay[entry.day_of_week] = entry
    }
  })
  const rows = Array.from(timeSlots.values())
  rows.sort((a, b) => a.start_time.localeCompare(b.start_time))
  return rows
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
    const response = await api.post('/timetable/generate', generateSettings.value)
    assignmentMessage.value = '✅ Timetable generated! ' + (response.data.generated_count || 0) + ' entries created.'
    await loadTimetable()
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
.form-control, .form-select { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; }
.form-label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.8rem; color: #475569; }
.form-check { display: flex; align-items: center; gap: 0.5rem; }
.badge { background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; }
.alert { padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
.alert-info { background: #e0f2fe; color: #0369a1; }
.table-responsive { overflow-x: auto; }
.timetable-grid { width: 100%; border-collapse: collapse; font-size: 0.7rem; border-radius: 12px; overflow: hidden; }
.timetable-grid th { background: linear-gradient(135deg, #1e293b, #0f172a); color: white; font-weight: 600; padding: 0.75rem; text-align: center; }
.timetable-grid td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: center; vertical-align: middle; }
.time-col { background: #f1f5f9; font-weight: 700; color: #1e293b; }
.module-cell { background: #f8fafc; border-radius: 8px; padding: 0.4rem; transition: all 0.2s; }
.module-cell:hover { transform: scale(1.02); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.module-cell strong { display: block; font-size: 0.75rem; color: #1e293b; }
.module-cell small { display: block; font-size: 0.6rem; color: #64748b; }
.module-cell[data-module="Mathematics"] { background: #dbeafe; border-left: 4px solid #3b82f6; }
.module-cell[data-module="Physics"] { background: #dcfce7; border-left: 4px solid #22c55e; }
.module-cell[data-module="Chemistry"] { background: #fed7aa; border-left: 4px solid #f97316; }
.module-cell[data-module="English"] { background: #fae8ff; border-left: 4px solid #d946ef; }
.module-cell[data-module="Computer Sci."] { background: #e0e7ff; border-left: 4px solid #6366f1; }
.module-cell[data-module="Extra Class"] { background: #fef3c7; border-left: 4px solid #f59e0b; }
.module-cell[data-module="Library"] { background: #e2e8f0; border-left: 4px solid #64748b; }
.module-cell[data-module="Seminar Hall A"] { background: #ccfbf1; border-left: 4px solid #14b8a6; }
.room-badge { display: inline-block; margin-top: 0.2rem; padding: 0.1rem 0.3rem; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 0.55rem; color: #475569; }
.empty-slot { color: #cbd5e1; font-size: 0.8rem; }
.timetable-group { border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1rem; overflow: hidden; }
.timetable-header { background: #f8fafc; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.text-center { text-align: center; }
.text-muted { color: #64748b; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 1.5rem; }
@media (max-width: 768px) { .col-md-3 { min-width: 100%; } }
</style>
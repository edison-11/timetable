<template>
  <div class="min-vh-100">
    <header class="header-custom">
      <div class="container-fluid px-4 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center justify-center bg-primary rounded" style="width: 40px; height: 40px; font-size: 20px;">
            S
          </div>
          <h1 class="h2 mb-0">Settings</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <router-link to="/dashboard" class="text-light opacity-75 text-decoration-none">Dashboard</router-link>
          <div class="d-flex align-items-center justify-center bg-primary rounded-circle" style="width: 40px; height: 40px;">
            A
          </div>
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
        <div class="card-custom">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 class="h3 fw-semibold text-dark mb-1">Timetable Settings</h2>
              <p class="text-muted mb-0">These values are used when generating class timetables.</p>
            </div>
            <button class="btn btn-outline-secondary" :disabled="loading" @click="loadSettings">
              Refresh
            </button>
          </div>

          <div v-if="message" class="alert" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'" role="alert">
            {{ message }}
          </div>

          <div v-if="loading" class="text-muted py-4">
            Loading settings...
          </div>

          <form v-else @submit.prevent="saveSettings">
            <div class="row g-4">
              <div class="col-12 col-lg-5">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body">
                    <h5 class="card-title">General</h5>

                    <div class="mt-3">
                      <label for="teacherChangeover" class="form-label">Teacher Changeover Minutes</label>
                      <input
                        id="teacherChangeover"
                        v-model.number="settings.teacher_changeover_minutes"
                        type="number"
                        min="0"
                        class="form-control"
                        required
                      >
                    </div>

                    <div class="row g-3 mt-1">
                      <div class="col-md-6">
                        <label for="breakStart" class="form-label">Default Break Start</label>
                        <input id="breakStart" v-model="settings.break_start_time" type="time" class="form-control" required>
                      </div>
                      <div class="col-md-6">
                        <label for="breakEnd" class="form-label">Default Break End</label>
                        <input id="breakEnd" v-model="settings.break_end_time" type="time" class="form-control" required>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-7">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5 class="card-title mb-0">Fixed Breaks</h5>
                      <button type="button" class="btn btn-outline-primary btn-sm" @click="addBreak">
                        Add Break
                      </button>
                    </div>

                    <div v-if="!settings.timetable_breaks.length" class="text-muted mt-3">
                      No breaks added.
                    </div>

                    <div v-for="(breakItem, index) in settings.timetable_breaks" :key="index" class="row g-2 align-items-end mt-2">
                      <div class="col-md-5">
                        <label class="form-label">Name</label>
                        <input v-model="breakItem.break_name" type="text" class="form-control" required>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label">Start</label>
                        <input v-model="breakItem.start_time" type="time" class="form-control" required>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label">End</label>
                        <input v-model="breakItem.end_time" type="time" class="form-control" required>
                      </div>
                      <div class="col-md-1">
                        <button type="button" class="btn btn-outline-danger w-100" @click="removeBreak(index)">
                          X
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm mt-4">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h5 class="card-title mb-1">Period-Based Break Rules</h5>
                    <p class="text-muted mb-0">When enabled, breaks are calculated after a number of teaching periods instead of fixed clock times.</p>
                  </div>
                  <div class="form-check form-switch">
                    <input id="periodRulesEnabled" v-model="settings.break_period_rules.enabled" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="periodRulesEnabled">Enabled</label>
                  </div>
                </div>

                <fieldset :disabled="!settings.break_period_rules.enabled" class="row g-3 mt-2">
                  <div class="col-md-4">
                    <label for="periodsMorning" class="form-label">Periods Before Morning Break</label>
                    <input id="periodsMorning" v-model.number="settings.break_period_rules.periods_before_morning_break" type="number" min="1" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="periodsLunch" class="form-label">Periods Before Lunch</label>
                    <input id="periodsLunch" v-model.number="settings.break_period_rules.periods_before_lunch" type="number" min="1" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="periodsAfternoon" class="form-label">Periods Before Afternoon Break</label>
                    <input id="periodsAfternoon" v-model.number="settings.break_period_rules.periods_before_afternoon_break" type="number" min="1" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="morningMinutes" class="form-label">Morning Break Minutes</label>
                    <input id="morningMinutes" v-model.number="settings.break_period_rules.morning_break_minutes" type="number" min="1" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="lunchMinutes" class="form-label">Lunch Break Minutes</label>
                    <input id="lunchMinutes" v-model.number="settings.break_period_rules.lunch_break_minutes" type="number" min="1" class="form-control">
                  </div>
                  <div class="col-md-4">
                    <label for="afternoonMinutes" class="form-label">Afternoon Break Minutes</label>
                    <input id="afternoonMinutes" v-model.number="settings.break_period_rules.afternoon_break_minutes" type="number" min="1" class="form-control">
                  </div>
                </fieldset>
              </div>
            </div>

            <div class="d-flex justify-content-end mt-4">
              <button class="btn btn-primary-custom btn-lg" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/stores/api'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: '▦' },
  { name: 'Teachers', path: '/teachers', icon: '◉' },
  { name: 'Modules', path: '/modules', icon: '▤' },
  { name: 'Classes', path: '/classes', icon: '⌂' },
  { name: 'Sections', path: '/sections', icon: '▥' },
  { name: 'Shifts', path: '/shifts', icon: '◷' },
  { name: 'Assignments', path: '/assignments', icon: '☑' },
  { name: 'Timetable', path: '/timetable', icon: '□' },
  { name: 'Settings', path: '/settings', icon: '⚙' }
]

const defaultSettings = () => ({
  teacher_changeover_minutes: 5,
  break_start_time: '10:00',
  break_end_time: '10:15',
  timetable_breaks: [
    { break_name: 'Morning Break', start_time: '10:00', end_time: '10:15' }
  ],
  break_period_rules: {
    enabled: false,
    periods_before_morning_break: 3,
    periods_before_lunch: 2,
    periods_before_afternoon_break: 3,
    morning_break_minutes: 30,
    lunch_break_minutes: 45,
    afternoon_break_minutes: 30
  }
})

const settings = ref(defaultSettings())
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const messageType = ref('success')

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
}

const normalizeSettings = (value) => {
  const defaults = defaultSettings()
  return {
    ...defaults,
    ...value,
    timetable_breaks: Array.isArray(value?.timetable_breaks)
      ? value.timetable_breaks
      : defaults.timetable_breaks,
    break_period_rules: {
      ...defaults.break_period_rules,
      ...(value?.break_period_rules || {})
    }
  }
}

const loadSettings = async () => {
  loading.value = true
  message.value = ''

  try {
    const response = await api.get('/settings/timetable')
    settings.value = normalizeSettings(response.data.settings)
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to load settings.', 'danger')
  } finally {
    loading.value = false
  }
}

const addBreak = () => {
  settings.value.timetable_breaks.push({
    break_name: 'New Break',
    start_time: '10:00',
    end_time: '10:15'
  })
}

const removeBreak = (index) => {
  settings.value.timetable_breaks.splice(index, 1)
}

const saveSettings = async () => {
  saving.value = true
  message.value = ''

  try {
    const payload = {
      ...settings.value,
      timetable_breaks: settings.value.timetable_breaks.map((breakItem) => ({
        break_name: breakItem.break_name.trim(),
        start_time: breakItem.start_time,
        end_time: breakItem.end_time
      }))
    }

    const response = await api.put('/settings/timetable', payload)
    settings.value = normalizeSettings(response.data.settings)
    showMessage('Settings saved successfully.')
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save settings.', 'danger')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

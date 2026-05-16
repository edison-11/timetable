<template>
  <AppLayout>
    <div class="settings-container">
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 class="h3 fw-semibold text-dark mb-1">Timetable Settings</h2>
            <p class="text-muted mb-0">These values are used when generating class timetables.</p>
          </div>
          <button class="btn-outline-secondary" :disabled="loading" @click="loadSettings">
            Refresh
          </button>
        </div>

        <div v-if="message" class="alert" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'">
          {{ message }}
        </div>

        <div v-if="loading" class="text-muted py-4">
          Loading settings...
        </div>

        <form v-else @submit.prevent="saveSettings">
          <div class="row g-4">
            <!-- General Settings -->
            <div class="col-12 col-lg-5">
              <div class="settings-card">
                <div class="settings-card-body">
                  <h5 class="card-title">General</h5>

                  <div class="mt-3">
                    <label class="form-label">Teacher Changeover Minutes</label>
                    <input
                      v-model.number="settings.teacher_changeover_minutes"
                      type="number"
                      min="0"
                      class="form-control"
                      required
                    >
                  </div>

                  <div class="row g-3 mt-2">
                    <div class="col-md-6">
                      <label class="form-label">Default Break Start</label>
                      <input v-model="settings.break_start_time" type="time" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Default Break End</label>
                      <input v-model="settings.break_end_time" type="time" class="form-control" required>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Breaks -->
            <div class="col-12 col-lg-7">
              <div class="settings-card">
                <div class="settings-card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Fixed Breaks</h5>
                    <button type="button" class="btn-outline-primary btn-sm" @click="addBreak">
                      Add Break
                    </button>
                  </div>

                  <div v-if="!settings.timetable_breaks.length" class="text-muted mt-3">
                    No breaks added.
                  </div>

                  <div v-for="(breakItem, index) in settings.timetable_breaks" :key="index" class="break-row">
                    <div class="break-fields">
                      <div class="break-field">
                        <label class="form-label">Name</label>
                        <input v-model="breakItem.break_name" type="text" class="form-control" required>
                      </div>
                      <div class="break-field">
                        <label class="form-label">Start</label>
                        <input v-model="breakItem.start_time" type="time" class="form-control" required>
                      </div>
                      <div class="break-field">
                        <label class="form-label">End</label>
                        <input v-model="breakItem.end_time" type="time" class="form-control" required>
                      </div>
                      <div class="break-remove">
                        <button type="button" class="btn-outline-danger" @click="removeBreak(index)">✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Period-Based Break Rules -->
          <div class="settings-card mt-4">
            <div class="settings-card-body">
              <div class="period-rules-header">
                <div>
                  <h5 class="card-title mb-1">Period-Based Break Rules</h5>
                  <p class="text-muted mb-0">When enabled, breaks are calculated after a number of teaching periods instead of fixed clock times.</p>
                </div>
                <div class="form-switch">
                  <input id="periodRulesEnabled" v-model="settings.break_period_rules.enabled" type="checkbox">
                  <label for="periodRulesEnabled">Enabled</label>
                </div>
              </div>

              <fieldset :disabled="!settings.break_period_rules.enabled" class="period-rules-grid">
                <div>
                  <label class="form-label">Periods Before Morning Break</label>
                  <input v-model.number="settings.break_period_rules.periods_before_morning_break" type="number" min="1" class="form-control">
                </div>
                <div>
                  <label class="form-label">Periods Before Lunch</label>
                  <input v-model.number="settings.break_period_rules.periods_before_lunch" type="number" min="1" class="form-control">
                </div>
                <div>
                  <label class="form-label">Periods Before Evening Break</label>
                  <input v-model.number="settings.break_period_rules.periods_before_afternoon_break" type="number" min="1" class="form-control">
                </div>
                <div>
                  <label class="form-label">Periods After Evening Break</label>
                  <input v-model.number="settings.break_period_rules.periods_after_afternoon_break" type="number" min="0" class="form-control">
                </div>
                <div>
                  <label class="form-label">Morning Break Minutes</label>
                  <input v-model.number="settings.break_period_rules.morning_break_minutes" type="number" min="1" class="form-control">
                </div>
                <div>
                  <label class="form-label">Lunch Break Minutes</label>
                  <input v-model.number="settings.break_period_rules.lunch_break_minutes" type="number" min="1" class="form-control">
                </div>
                <div>
                  <label class="form-label">Evening Break Minutes</label>
                  <input v-model.number="settings.break_period_rules.afternoon_break_minutes" type="number" min="1" class="form-control">
                </div>
              </fieldset>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary btn-lg" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const defaultSettings = () => ({
  teacher_changeover_minutes: 5,
  break_start_time: '11:00',
  break_end_time: '11:30',
  timetable_breaks: [
    { break_name: 'Morning Break', start_time: '11:00', end_time: '11:30' },
    { break_name: 'Lunch Break', start_time: '13:30', end_time: '14:15' },
    { break_name: 'Evening Break', start_time: '17:15', end_time: '17:45' }
  ],
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

const settings = ref(defaultSettings())
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const messageType = ref('success')

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3000)
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
    start_time: '11:00',
    end_time: '11:30'
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

<style scoped>
.settings-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-custom {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.settings-card-body {
  padding: 1.25rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-lg {
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid #64748b;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-outline-primary {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  font-size: 0.75rem;
  color: #475569;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-switch input {
  width: 36px;
  height: 20px;
  appearance: none;
  background: #cbd5e1;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.form-switch input:checked {
  background: #3b82f6;
}

.form-switch input::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.form-switch input:checked::before {
  transform: translateX(16px);
}

.form-switch label {
  font-size: 0.8rem;
  cursor: pointer;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: -0.5rem;
}

.g-3 { gap: 1rem; }
.g-4 { gap: 1.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-4 { margin-bottom: 1.5rem; }

.col-12 { width: 100%; padding: 0.5rem; }
.col-lg-5 { width: 41.666%; padding: 0.5rem; }
.col-lg-7 { width: 58.333%; padding: 0.5rem; }
.col-md-6 { width: 50%; padding: 0.5rem; }
.col-md-4 { width: 33.333%; padding: 0.5rem; }
.col-md-5 { width: 41.666%; padding: 0.5rem; }
.col-md-3 { width: 25%; padding: 0.5rem; }
.col-md-1 { width: 8.333%; padding: 0.5rem; }

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
}

.alert-danger {
  background: #fee2e2;
  color: #dc2626;
}

.text-muted {
  color: #64748b;
}

.fw-semibold {
  font-weight: 600;
}

.break-row {
  margin-top: 0.5rem;
}

.break-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-end;
}

.break-field {
  flex: 1;
  min-width: 100px;
}

.break-remove {
  flex-shrink: 0;
}

.period-rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.period-rules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

fieldset:disabled {
  opacity: 0.6;
}

@media (max-width: 992px) {
  .col-lg-5, .col-lg-7 {
    width: 100%;
  }
  .period-rules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .period-rules-grid {
    grid-template-columns: 1fr;
  }
  .break-fields {
    flex-direction: column;
  }
  .break-field {
    width: 100%;
  }
}
</style>

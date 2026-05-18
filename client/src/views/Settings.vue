<template>
  <AppLayout>
    <div class="settings-page">
      <header class="settings-header">
        <div>
          <span class="eyebrow">Admin settings</span>
          <h1>System Settings</h1>
          <p>Control your school profile, timetable rules, dashboard behavior, and export defaults.</p>
        </div>
        <button class="icon-button secondary" type="button" :disabled="loading" @click="loadSettings">
          <span class="button-icon">R</span>
          <span>Refresh</span>
        </button>
      </header>

      <div class="settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          class="settings-tab"
          :class="{ active: activeTab === 'institution' }"
          role="tab"
          :aria-selected="activeTab === 'institution'"
          @click="activeTab = 'institution'"
        >
          Institution
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ active: activeTab === 'timetable' }"
          role="tab"
          :aria-selected="activeTab === 'timetable'"
          @click="activeTab = 'timetable'"
        >
          Timetable
        </button>
        <button
          type="button"
          class="settings-tab"
          :class="{ active: activeTab === 'admin' }"
          role="tab"
          :aria-selected="activeTab === 'admin'"
          @click="activeTab = 'admin'"
        >
          Admin
        </button>
      </div>

      <div v-if="message" class="settings-alert" :class="messageType === 'success' ? 'success' : 'danger'">
        {{ message }}
      </div>

      <div v-if="loading" class="loading-panel">
        <div class="loading-spinner"></div>
        <span>Loading settings...</span>
      </div>

      <form v-else-if="activeTab === 'institution'" class="settings-content" @submit.prevent="saveInstitutionSettings">
        <section class="overview-grid">
          <div class="overview-card blue">
            <div class="overview-icon">S</div>
            <span>School</span>
            <strong>{{ institutionSettings.school_name || 'Not set' }}</strong>
          </div>
          <div class="overview-card green">
            <div class="overview-icon">P</div>
            <span>Principal</span>
            <strong>{{ institutionSettings.principal_name || 'Not set' }}</strong>
          </div>
          <div class="overview-card amber">
            <div class="overview-icon">D</div>
            <span>Studies</span>
            <strong>{{ institutionSettings.director_studies_name || 'Not set' }}</strong>
          </div>
          <div class="overview-card rose">
            <div class="overview-icon">C</div>
            <span>Access code</span>
            <strong>{{ institutionSettings.school_code || 'Not set' }}</strong>
          </div>
        </section>

        <section class="settings-panel">
          <div class="panel-heading">
            <div>
              <h2>Institution Profile</h2>
              <p>School identity and teacher access.</p>
            </div>
          </div>

          <div class="form-grid two">
            <label class="field">
              <span>School Name</span>
              <input v-model="institutionSettings.school_name" type="text" required>
            </label>
            <label class="field">
              <span>Principal Name</span>
              <input v-model="institutionSettings.principal_name" type="text">
            </label>
            <label class="field">
              <span>Director of Studies</span>
              <input v-model="institutionSettings.director_studies_name" type="text">
            </label>
            <label class="field">
              <span>School Access Code</span>
              <input v-model="institutionSettings.school_code" type="text" placeholder="SCH1234">
            </label>
          </div>
        </section>

        <div class="sticky-actions">
          <button type="submit" class="icon-button primary" :disabled="saving">
            <span class="button-icon">S</span>
            <span>{{ saving ? 'Saving...' : 'Save Institution' }}</span>
          </button>
        </div>
      </form>

      <form v-else-if="activeTab === 'timetable'" class="settings-content" @submit.prevent="saveTimetableSettings">
        <section class="overview-grid">
          <div class="overview-card blue">
            <div class="overview-icon">M</div>
            <span>Changeover</span>
            <strong>{{ timetableSettings.teacher_changeover_minutes }} min</strong>
          </div>
          <div class="overview-card green">
            <div class="overview-icon">B</div>
            <span>Breaks</span>
            <strong>{{ timetableSettings.timetable_breaks.length }}</strong>
          </div>
          <div class="overview-card amber">
            <div class="overview-icon">R</div>
            <span>Rules</span>
            <strong>{{ timetableSettings.break_period_rules.enabled ? 'Enabled' : 'Off' }}</strong>
          </div>
          <div class="overview-card rose">
            <div class="overview-icon">T</div>
            <span>Default break</span>
            <strong>{{ timetableSettings.break_start_time }}-{{ timetableSettings.break_end_time }}</strong>
          </div>
        </section>

        <div class="content-grid">
          <section class="settings-panel">
            <div class="panel-heading">
              <div>
                <h2>Timing Defaults</h2>
                <p>Period spacing and default break window.</p>
              </div>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Teacher Changeover Minutes</span>
                <input v-model.number="timetableSettings.teacher_changeover_minutes" type="number" min="0" required>
              </label>
              <div class="inline-fields">
                <label class="field">
                  <span>Break Start</span>
                  <input v-model="timetableSettings.break_start_time" type="time" required>
                </label>
                <label class="field">
                  <span>Break End</span>
                  <input v-model="timetableSettings.break_end_time" type="time" required>
                </label>
              </div>
            </div>
          </section>

          <section class="settings-panel">
            <div class="panel-heading compact">
              <div>
                <h2>Fixed Breaks</h2>
                <p>Named breaks shown in timetable output.</p>
              </div>
              <button type="button" class="icon-button ghost small" @click="addBreak">
                <span class="button-icon">+</span>
                <span>Add</span>
              </button>
            </div>

            <div v-if="!timetableSettings.timetable_breaks.length" class="empty-state">
              No breaks added.
            </div>

            <div v-else class="break-list">
              <div v-for="(breakItem, index) in timetableSettings.timetable_breaks" :key="index" class="break-item">
                <label class="field">
                  <span>Name</span>
                  <input v-model="breakItem.break_name" type="text" required>
                </label>
                <label class="field time-field">
                  <span>Start</span>
                  <input v-model="breakItem.start_time" type="time" required>
                </label>
                <label class="field time-field">
                  <span>End</span>
                  <input v-model="breakItem.end_time" type="time" required>
                </label>
                <button
                  type="button"
                  class="remove-button"
                  aria-label="Remove break"
                  @click="removeBreak(index)"
                >
                  x
                </button>
              </div>
            </div>
          </section>
        </div>

        <section class="settings-panel">
          <div class="panel-heading compact">
            <div>
              <h2>Period-Based Break Rules</h2>
              <p>Break placement by teaching period count.</p>
            </div>
            <label class="switch">
              <input id="periodRulesEnabled" v-model="timetableSettings.break_period_rules.enabled" type="checkbox">
              <span></span>
              <em>{{ timetableSettings.break_period_rules.enabled ? 'On' : 'Off' }}</em>
            </label>
          </div>

          <fieldset :disabled="!timetableSettings.break_period_rules.enabled" class="form-grid rules-grid">
            <label class="field">
              <span>Before Morning Break</span>
              <input v-model.number="timetableSettings.break_period_rules.periods_before_morning_break" type="number" min="1">
            </label>
            <label class="field">
              <span>Before Lunch</span>
              <input v-model.number="timetableSettings.break_period_rules.periods_before_lunch" type="number" min="1">
            </label>
            <label class="field">
              <span>Before Evening Break</span>
              <input v-model.number="timetableSettings.break_period_rules.periods_before_afternoon_break" type="number" min="1">
            </label>
            <label class="field">
              <span>After Evening Break</span>
              <input v-model.number="timetableSettings.break_period_rules.periods_after_afternoon_break" type="number" min="0">
            </label>
            <label class="field">
              <span>Morning Break Minutes</span>
              <input v-model.number="timetableSettings.break_period_rules.morning_break_minutes" type="number" min="1">
            </label>
            <label class="field">
              <span>Lunch Break Minutes</span>
              <input v-model.number="timetableSettings.break_period_rules.lunch_break_minutes" type="number" min="1">
            </label>
            <label class="field">
              <span>Evening Break Minutes</span>
              <input v-model.number="timetableSettings.break_period_rules.afternoon_break_minutes" type="number" min="1">
            </label>
          </fieldset>
        </section>

        <div class="sticky-actions">
          <button type="submit" class="icon-button primary" :disabled="saving">
            <span class="button-icon">S</span>
            <span>{{ saving ? 'Saving...' : 'Save Timetable' }}</span>
          </button>
        </div>
      </form>

      <form v-else class="settings-content" @submit.prevent="saveAdminSettings">
        <section class="overview-grid">
          <div class="overview-card blue">
            <div class="overview-icon">L</div>
            <span>Landing</span>
            <strong>{{ adminSettings.default_landing_page }}</strong>
          </div>
          <div class="overview-card green">
            <div class="overview-icon">D</div>
            <span>Density</span>
            <strong>{{ adminSettings.dashboard_density }}</strong>
          </div>
          <div class="overview-card amber">
            <div class="overview-icon">A</div>
            <span>Refresh</span>
            <strong>{{ adminSettings.auto_refresh_minutes }} min</strong>
          </div>
          <div class="overview-card rose">
            <div class="overview-icon">N</div>
            <span>Alerts</span>
            <strong>{{ adminSettings.notification_retention_days }} days</strong>
          </div>
        </section>

        <div class="content-grid">
          <section class="settings-panel">
            <div class="panel-heading">
              <div>
                <h2>Workspace</h2>
                <p>Admin landing and dashboard behavior.</p>
              </div>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Default Landing Page</span>
                <select v-model="adminSettings.default_landing_page">
                  <option value="/dashboard">Dashboard</option>
                  <option value="/timetable">Timetable Studio</option>
                  <option value="/teachers">Teachers</option>
                  <option value="/settings">Settings</option>
                </select>
              </label>
              <label class="field">
                <span>Dashboard Density</span>
                <select v-model="adminSettings.dashboard_density">
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label class="field">
                <span>Auto Refresh Minutes</span>
                <input v-model.number="adminSettings.auto_refresh_minutes" type="number" min="1" max="60">
              </label>
            </div>
          </section>

          <section class="settings-panel">
            <div class="panel-heading">
              <div>
                <h2>Output</h2>
                <p>Notifications and timetable export defaults.</p>
              </div>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Notification Retention Days</span>
                <input v-model.number="adminSettings.notification_retention_days" type="number" min="1" max="365">
              </label>
              <label class="field">
                <span>Export Filename Prefix</span>
                <input v-model.trim="adminSettings.export_filename_prefix" type="text" maxlength="40" placeholder="timetable">
              </label>
              <label class="check-row">
                <input v-model="adminSettings.show_empty_slots" type="checkbox">
                <span>
                  <strong>Show empty timetable slots</strong>
                  <small>Keep blank slots visible in previews and exports.</small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <section class="settings-panel">
          <div class="panel-heading compact">
            <div>
              <h2>Shortcuts</h2>
              <p>Jump to related settings sections.</p>
            </div>
          </div>
          <div class="shortcut-grid">
            <button type="button" class="shortcut-button blue" @click="activeTab = 'institution'">
              <span>I</span>
              Institution
            </button>
            <button type="button" class="shortcut-button green" @click="activeTab = 'timetable'">
              <span>T</span>
              Timetable
            </button>
            <button type="button" class="shortcut-button amber" @click="loadSettings">
              <span>R</span>
              Reload
            </button>
          </div>
        </section>

        <div class="sticky-actions">
          <button type="submit" class="icon-button primary" :disabled="saving">
            <span class="button-icon">S</span>
            <span>{{ saving ? 'Saving...' : 'Save Admin' }}</span>
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/stores/api'
import AppLayout from '@/components/AppLayout.vue'

const activeTab = ref('institution')

const defaultTimetableSettings = () => ({
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

const defaultInstitutionSettings = () => ({
  school_name: 'My School',
  principal_name: '',
  director_studies_name: '',
  school_code: ''
})

const defaultAdminSettings = () => ({
  default_landing_page: '/dashboard',
  dashboard_density: 'comfortable',
  auto_refresh_minutes: 5,
  notification_retention_days: 30,
  export_filename_prefix: 'timetable',
  show_empty_slots: true
})

const institutionSettings = ref(defaultInstitutionSettings())
const timetableSettings = ref(defaultTimetableSettings())
const adminSettings = ref(defaultAdminSettings())
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

const normalizeTimetableSettings = (value) => {
  const defaults = defaultTimetableSettings()
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
    const [institutionResponse, timetableResponse, adminResponse] = await Promise.all([
      api.get('/settings/institution').catch(() => ({ data: { settings: {} } })),
      api.get('/settings/timetable').catch(() => ({ data: { settings: {} } })),
      api.get('/settings/admin').catch(() => ({ data: { settings: {} } }))
    ])
    institutionSettings.value = { ...defaultInstitutionSettings(), ...institutionResponse.data.settings }
    timetableSettings.value = normalizeTimetableSettings(timetableResponse.data.settings)
    adminSettings.value = { ...defaultAdminSettings(), ...adminResponse.data.settings }
  } catch (error) {
    showMessage(error.response?.data?.message || 'Failed to load settings.', 'danger')
  } finally {
    loading.value = false
  }
}

const addBreak = () => {
  timetableSettings.value.timetable_breaks.push({
    break_name: 'New Break',
    start_time: '11:00',
    end_time: '11:30'
  })
}

const removeBreak = (index) => {
  timetableSettings.value.timetable_breaks.splice(index, 1)
}

const saveInstitutionSettings = async () => {
  saving.value = true
  message.value = ''
  try {
    const response = await api.put('/settings/institution', institutionSettings.value)
    institutionSettings.value = { ...defaultInstitutionSettings(), ...response.data.settings }
    showMessage('Institution settings saved successfully.')
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save settings.', 'danger')
  } finally {
    saving.value = false
  }
}

const saveTimetableSettings = async () => {
  saving.value = true
  message.value = ''
  try {
    const payload = {
      ...timetableSettings.value,
      timetable_breaks: timetableSettings.value.timetable_breaks.map((breakItem) => ({
        break_name: breakItem.break_name.trim(),
        start_time: breakItem.start_time,
        end_time: breakItem.end_time
      }))
    }
    const response = await api.put('/settings/timetable', payload)
    timetableSettings.value = normalizeTimetableSettings(response.data.settings)
    showMessage('Timetable settings saved successfully.')
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save settings.', 'danger')
  } finally {
    saving.value = false
  }
}

const saveAdminSettings = async () => {
  saving.value = true
  message.value = ''
  try {
    const payload = {
      default_landing_page: adminSettings.value.default_landing_page,
      dashboard_density: adminSettings.value.dashboard_density,
      auto_refresh_minutes: Number(adminSettings.value.auto_refresh_minutes) || 5,
      notification_retention_days: Number(adminSettings.value.notification_retention_days) || 30,
      export_filename_prefix: adminSettings.value.export_filename_prefix || 'timetable',
      show_empty_slots: Boolean(adminSettings.value.show_empty_slots)
    }
    const response = await api.put('/settings/admin', payload)
    adminSettings.value = { ...defaultAdminSettings(), ...response.data.settings }
    showMessage('Admin settings saved successfully.')
  } catch (error) {
    const validationMessage = error.response?.data?.errors?.[0]?.msg
    showMessage(validationMessage || error.response?.data?.message || 'Failed to save admin settings.', 'danger')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-bottom: 1rem;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
  padding: 1.35rem;
  border: 1px solid #d8e6f8;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.96) 52%, rgba(240, 253, 244, 0.92)),
    #ffffff;
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.1);
  position: relative;
  overflow: hidden;
}

.settings-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.35rem;
  background: linear-gradient(180deg, #2563eb, #16a34a, #f59e0b);
}

.settings-header > * {
  position: relative;
  z-index: 1;
}

.eyebrow {
  display: block;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.settings-header h1 {
  margin: 0.1rem 0 0;
  color: #0f172a;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: 0;
}

.settings-header p {
  max-width: 42rem;
  margin: 0.35rem 0 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.5;
}

.settings-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.25rem;
  width: min(100%, 34rem);
  margin-bottom: 1.15rem;
  border: 1px solid #d7e2f0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.settings-tab {
  min-height: 2.4rem;
  padding: 0.45rem 0.85rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font-weight: 800;
}

.settings-tab.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.22);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.overview-card {
  position: relative;
  min-height: 5rem;
  padding: 1rem 1rem 1rem 4.05rem;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.1);
  border-color: #bfd0e6;
}

.overview-icon {
  position: absolute;
  left: 1rem;
  top: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 900;
}

.overview-card span {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.overview-card strong {
  display: block;
  margin-top: 0.35rem;
  color: #0f172a;
  font-size: 1rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.overview-card.blue { border-top: 3px solid #2563eb; }
.overview-card.green { border-top: 3px solid #16a34a; }
.overview-card.amber { border-top: 3px solid #d97706; }
.overview-card.rose { border-top: 3px solid #e11d48; }
.overview-card.blue .overview-icon { background: #dbeafe; color: #1d4ed8; }
.overview-card.green .overview-icon { background: #dcfce7; color: #047857; }
.overview-card.amber .overview-icon { background: #fef3c7; color: #b45309; }
.overview-card.rose .overview-icon { background: #ffe4e6; color: #be123c; }

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
}

.settings-panel {
  padding: 1.15rem;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.98)),
    #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-heading.compact {
  align-items: center;
}

.panel-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.04rem;
  font-weight: 800;
}

.panel-heading p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

.form-grid.two,
.rules-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.rules-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

.field input,
.field select {
  width: 100%;
  min-height: 2.65rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.9rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.13);
}

.inline-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.break-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.break-item {
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) minmax(7rem, 0.45fr) minmax(7rem, 0.45fr) 2.5rem;
  gap: 0.65rem;
  align-items: end;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.remove-button {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  background: #fff1f2;
  color: #be123c;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
}

.remove-button:hover {
  border-color: #e11d48;
  background: #ffe4e6;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.65rem;
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 800;
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.icon-button.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.24);
}

.icon-button.secondary,
.icon-button.ghost {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

.icon-button.secondary:hover,
.icon-button.ghost:hover {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #eff6ff;
}

.icon-button.small {
  min-height: 2.3rem;
  padding: 0.4rem 0.7rem;
}

.button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 0.75rem;
  font-weight: 900;
}

.secondary .button-icon,
.ghost .button-icon {
  background: #eef2ff;
  color: #1d4ed8;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  font-weight: 800;
  color: #475569;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch span {
  position: relative;
  width: 2.5rem;
  height: 1.35rem;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.2s ease;
}

.switch span::after {
  content: "";
  position: absolute;
  top: 0.18rem;
  left: 0.18rem;
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.switch input:checked + span {
  background: #2563eb;
}

.switch input:checked + span::after {
  transform: translateX(1.12rem);
}

.switch em {
  min-width: 1.75rem;
  font-style: normal;
  font-size: 0.8rem;
}

fieldset {
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}

fieldset:disabled {
  opacity: 0.55;
}

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.85rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}

.check-row input {
  margin-top: 0.2rem;
}

.check-row strong,
.check-row small {
  display: block;
}

.check-row strong {
  color: #0f172a;
  font-size: 0.85rem;
}

.check-row small {
  margin-top: 0.15rem;
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.35;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.shortcut-button {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.2rem;
  padding: 0.7rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  color: #0f172a;
  cursor: pointer;
  font-weight: 800;
  text-align: left;
}

.shortcut-button span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.shortcut-button.blue span { background: #dbeafe; color: #1d4ed8; }
.shortcut-button.green span { background: #dcfce7; color: #047857; }
.shortcut-button.amber span { background: #fef3c7; color: #b45309; }

.shortcut-button:hover {
  border-color: #2563eb;
  background: #f8fbff;
}

.settings-alert {
  margin-bottom: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
}

.settings-alert.success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.settings-alert.danger {
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #be123c;
}

.loading-panel,
.empty-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 5rem;
  padding: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
  font-weight: 700;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.sticky-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.9rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  bottom: 1rem;
  z-index: 5;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .overview-grid,
  .rules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .settings-header {
    align-items: stretch;
    flex-direction: column;
  }

  .settings-tabs {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .settings-tab {
    width: 100%;
  }

  .overview-grid,
  .form-grid.two,
  .rules-grid,
  .shortcut-grid,
  .inline-fields {
    grid-template-columns: 1fr;
  }

  .break-item {
    grid-template-columns: 1fr;
  }

  .time-field {
    width: 100%;
  }

  .remove-button {
    width: 100%;
  }

  .sticky-actions {
    position: static;
  }

  .sticky-actions .icon-button {
    width: 100%;
  }
}
</style>

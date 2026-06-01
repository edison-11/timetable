<template>
  <AppLayout>
    <section class="section-page">
      <header>
        <div>
          <span class="eyebrow">Super Admin</span>
          <h1>{{ page.title }}</h1>
          <p>{{ page.description }}</p>
        </div>
        <button type="button" class="ghost-button" @click="loadSection">Refresh</button>
      </header>

      <div class="module-grid">
        <template v-if="loading">
          <article v-for="item in 4" :key="`module-loading-${item}`" class="skeleton-card">
            <span></span>
            <strong></strong>
            <small></small>
          </article>
        </template>
        <template v-else>
          <article v-for="item in page.cards" :key="item.title">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.text }}</small>
          </article>
        </template>
      </div>

      <section v-if="page.key === 'billing'" class="data-panel">
        <div class="panel-head">
          <h2>Schools needing billing follow-up</h2>
          <small v-if="loading">Fetching subscriptions... Calculating balances...</small>
          <router-link v-else to="/super-admin/schools">Manage schools</router-link>
        </div>
        <div v-if="loading" class="panel-skeleton">
          <span v-for="item in 5" :key="item"></span>
        </div>
        <div v-else class="compact-table">
          <article v-for="school in billingSchools" :key="school.school_id">
            <strong>{{ school.school_name }}</strong>
            <span>{{ school.subscription_plan || 'Starter' }} / {{ school.subscription_status || 'trial' }}</span>
            <small>{{ school.subscription_expires_at || 'No expiry date' }}</small>
          </article>
        </div>
      </section>

      <section v-else-if="page.key === 'activity'" class="data-panel">
        <div class="panel-head">
          <h2>Recent audit activity</h2>
          <small v-if="loading">Loading recent activities...</small>
          <router-link v-else to="/super-admin/dashboard">Dashboard</router-link>
        </div>
        <div v-if="loading" class="panel-skeleton timeline">
          <span v-for="item in 6" :key="item"></span>
        </div>
        <div v-else class="activity-list">
          <article v-for="activity in activities" :key="activity.activity_id || activity.created_at">
            <strong>{{ titleCase(String(activity.action || 'activity').replace(/_/g, ' ')) }}</strong>
            <span>{{ activity.message || activity.school_name || 'Platform event' }}</span>
            <small>{{ formatRelative(activity.created_at) }}</small>
          </article>
        </div>
      </section>

      <section v-else-if="page.key === 'reports'" class="data-panel">
        <div class="panel-head">
          <h2>Export center</h2>
          <small>{{ reportStatus }}</small>
        </div>
        <div v-if="exporting" class="report-progress" role="status">
          <span>{{ exportStep }}</span>
          <i :style="{ width: `${exportProgress}%` }"></i>
        </div>
        <div class="action-grid">
          <button type="button" :disabled="exporting || loading" @click="downloadCsv('schools')">Export schools CSV</button>
          <button type="button" :disabled="exporting || loading" @click="downloadCsv('dos')">Export DOS CSV</button>
          <button type="button" :disabled="exporting || loading" @click="downloadCsv('subscriptions')">Export subscriptions CSV</button>
        </div>
      </section>

      <section v-else-if="page.key === 'administration'" class="data-panel">
        <div class="panel-head">
          <h2>Administration workbench</h2>
          <small>Announcements and operational shortcuts</small>
        </div>
        <form class="announcement-composer" @submit.prevent="sendAdministrationAnnouncement">
          <div>
            <label>
              <span>Announcement title</span>
              <input v-model.trim="announcementForm.title" type="text" autocomplete="off" required>
            </label>
            <label>
              <span>Priority</span>
              <select v-model="announcementForm.priority">
                <option>Normal</option>
                <option>Important</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea v-model.trim="announcementForm.message" rows="5" required></textarea>
          </label>
          <div class="composer-actions">
            <span v-if="announcementMessage">{{ announcementMessage }}</span>
            <button type="submit" :disabled="sendingAnnouncement">{{ sendingAnnouncement ? 'Sending announcement...' : 'Send to all schools' }}</button>
          </div>
        </form>
        <div v-if="recentAnnouncements.length" class="compact-table">
          <article v-for="announcement in recentAnnouncements" :key="announcement.announcement_id">
            <strong>{{ announcement.title }}</strong>
            <span>{{ announcement.priority }} / {{ announcement.target_count || 0 }} schools</span>
            <small>{{ formatRelative(announcement.created_at) }}</small>
          </article>
        </div>
        <div class="action-grid">
          <button type="button" @click="router.push('/super-admin/schools?status=pending_approval')">Review approvals</button>
          <button type="button" @click="router.push('/super-admin/dos')">Manage DOS ownership</button>
          <button type="button" @click="router.push('/settings')">Open platform settings</button>
        </div>
      </section>

      <section v-else class="data-panel">
        <div class="panel-head">
          <h2>Database readiness</h2>
          <small :class="databaseStatusTone">{{ databaseStatusLabel }}</small>
        </div>
        <div v-if="loading" class="panel-skeleton">
          <span v-for="item in 5" :key="item"></span>
        </div>
        <div v-else class="compact-table">
          <article v-for="school in databaseSchools" :key="school.school_id">
            <strong>{{ school.school_name }}</strong>
            <span>{{ school.setupProgress || 0 }}% setup</span>
            <small>{{ school.last_activity_at ? `Last activity ${formatRelative(school.last_activity_at)}` : 'No activity yet' }}</small>
          </article>
        </div>
      </section>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const route = useRoute()
const router = useRouter()
const stats = ref({})
const schools = ref([])
const activities = ref([])
const loading = ref(false)
const exporting = ref(false)
const exportStep = ref('')
const exportProgress = ref(0)
const sendingAnnouncement = ref(false)
const announcementMessage = ref('')
const announcementForm = ref({ title: '', priority: 'Normal', message: '' })
const announcements = ref([])

const sectionKey = computed(() => String(route.path.split('/').pop() || 'administration'))
const activeSchools = computed(() => schools.value.filter((school) => school.status === 'active'))
const pendingSchools = computed(() => schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status)))
const billingSchools = computed(() => schools.value.filter((school) => ['past_due', 'expired', 'suspended', 'canceled'].includes(school.subscription_status) || (school.subscription_expires_at && new Date(school.subscription_expires_at) < new Date())).slice(0, 10))
const databaseSchools = computed(() => schools.value.slice().sort((a, b) => Number(a.setupProgress || 0) - Number(b.setupProgress || 0)).slice(0, 10))
const reportStatus = computed(() => exporting.value ? exportStep.value : `${schools.value.length} school records loaded`)
const databaseStatusLabel = computed(() => {
  if (loading.value) return 'Checking connection...'
  return stats.value.total_schools !== undefined ? 'Connected' : 'Connection Lost'
})
const databaseStatusTone = computed(() => {
  if (loading.value) return 'checking'
  return stats.value.total_schools !== undefined ? 'connected' : 'lost'
})
const recentAnnouncements = computed(() => announcements.value.slice(0, 5))

const page = computed(() => {
  const common = {
    databases: {
      key: 'databases',
      title: 'Databases',
      description: 'Monitor school data readiness, timetable coverage, and activity.',
      cards: [
        { label: 'Schools', title: 'Total Schools', value: stats.value.total_schools || schools.value.length, text: 'registered tenants' },
        { label: 'Timetables', title: 'Timetable Coverage', value: stats.value.schools_with_timetables || 0, text: 'schools with generated schedules' },
        { label: 'Entries', title: 'Timetable Entries', value: stats.value.total_timetable_entries || 0, text: 'stored timetable rows' }
      ]
    },
    billing: {
      key: 'billing',
      title: 'Billing',
      description: 'Manage subscriptions, revenue, expiring plans, and payment issues.',
      cards: [
        { label: 'MRR', title: 'Monthly Revenue', value: formatCurrency(stats.value.estimated_monthly_revenue || 0), text: 'estimated recurring revenue' },
        { label: 'Active', title: 'Active Subscriptions', value: stats.value.active_subscriptions || 0, text: 'currently paying/active' },
        { label: 'Expiring', title: 'Expiring Soon', value: stats.value.expiring_subscriptions || 0, text: 'due within 30 days' },
        { label: 'Expired', title: 'Expired', value: stats.value.expired_subscriptions || 0, text: 'need follow-up' }
      ]
    },
    activity: {
      key: 'activity',
      title: 'Activity',
      description: 'Review platform events, audit activity, and administrative changes.',
      cards: [
        { label: 'Events', title: 'Recent Events', value: activities.value.length, text: 'loaded from audit feed' },
        { label: 'Pending', title: 'Pending Schools', value: pendingSchools.value.length, text: 'awaiting admin action' },
        { label: 'Active', title: 'Active Schools', value: activeSchools.value.length, text: 'currently operational' }
      ]
    },
    reports: {
      key: 'reports',
      title: 'Reports',
      description: 'Generate exports and operational reports for platform management.',
      cards: [
        { label: 'Schools', title: 'School Reports', value: schools.value.length, text: 'records available' },
        { label: 'DOS', title: 'DOS Reports', value: stats.value.total_dos || 0, text: 'ownership accounts' },
        { label: 'Teachers', title: 'Teacher Reports', value: stats.value.total_teachers || 0, text: 'teacher accounts' }
      ]
    },
    administration: {
      key: 'administration',
      title: 'Administration',
      description: 'Access platform tools that do not belong on the main dashboard.',
      cards: [
        { label: 'Approvals', title: 'Approval Queue', value: pendingSchools.value.length, text: 'schools waiting review' },
        { label: 'DOS', title: 'DOS Accounts', value: stats.value.total_dos || 0, text: 'ownership accounts' },
        { label: 'Issues', title: 'Suspended Schools', value: stats.value.suspended_schools || 0, text: 'restricted access' }
      ]
    }
  }
  return common[sectionKey.value] || common.administration
})

const loadSection = async () => {
  loading.value = true
  try {
    const [statsResponse, schoolsResponse, announcementsResponse] = await Promise.all([
      api.get('/schools/stats'),
      api.get('/schools', { showGlobalNotification: false }),
      api.get('/announcements?limit=5', { showGlobalNotification: false }).catch(() => ({ data: { announcements: [] } }))
    ])
    stats.value = statsResponse.data.stats || {}
    schools.value = (schoolsResponse.data.schools || []).map((school) => ({
      ...school,
      setupProgress: calculateSetupProgress(school)
    }))
    activities.value = statsResponse.data.activities || []
    announcements.value = announcementsResponse.data.announcements || []
  } catch (error) {
    stats.value = {}
    schools.value = []
    activities.value = []
  } finally {
    loading.value = false
  }
}

const calculateSetupProgress = (school) => {
  const checks = [
    school.school_name,
    school.school_email,
    school.registration_number,
    school.dos_email,
    Number(school.teacher_count || 0) > 0,
    Number(school.student_count || 0) > 0
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

const downloadCsv = async (type) => {
  exporting.value = true
  exportStep.value = 'Generating report...'
  exportProgress.value = 25
  await new Promise((resolve) => setTimeout(resolve, 180))
  exportStep.value = 'Collecting data...'
  exportProgress.value = 55
  await new Promise((resolve) => setTimeout(resolve, 180))
  exportStep.value = 'Preparing CSV...'
  exportProgress.value = 82
  const rows = type === 'dos'
    ? schools.value.map((school) => ({ school: school.school_name, dos: school.dos_name || '', email: school.dos_email || '', status: school.status || '' }))
    : type === 'subscriptions'
      ? schools.value.map((school) => ({ school: school.school_name, plan: school.subscription_plan || '', subscription_status: school.subscription_status || '', expires: school.subscription_expires_at || '' }))
      : schools.value.map((school) => ({ school: school.school_name, email: school.school_email, status: school.status, dos: school.dos_name || '', code: school.school_code || '' }))

  const header = Object.keys(rows[0] || { empty: '' })
  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `super-admin-${type}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  exportStep.value = 'Download ready.'
  exportProgress.value = 100
  window.setTimeout(() => {
    exporting.value = false
    exportStep.value = ''
    exportProgress.value = 0
  }, 800)
}

const sendAdministrationAnnouncement = async () => {
  sendingAnnouncement.value = true
  announcementMessage.value = ''
  try {
    const response = await api.post('/announcements', {
      title: announcementForm.value.title,
      message: announcementForm.value.message,
      priority: announcementForm.value.priority,
      target_school_ids: []
    }, { showGlobalNotification: false })
    const announcement = response.data.announcement
    announcements.value = [announcement, ...announcements.value].filter(Boolean).slice(0, 5)
    announcementForm.value = { title: '', priority: 'Normal', message: '' }
    announcementMessage.value = response.data.message || 'Announcement sent.'
  } catch (error) {
    announcementMessage.value = error.response?.data?.message || 'Could not send announcement.'
  } finally {
    sendingAnnouncement.value = false
  }
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatRelative = (value) => {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const titleCase = (value) => value.replace(/\b\w/g, (char) => char.toUpperCase())

onMounted(loadSection)
watch(() => route.path, loadSection)
</script>

<style scoped>
.section-page {
  --section-surface: rgba(255, 255, 255, 0.96);
  --section-border: rgba(219, 234, 254, 0.9);
  --section-heading: #0f172a;
  --section-muted: #64748b;
  --section-eyebrow: #2563eb;
  --section-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
  width: min(100%, 1480px);
  display: grid;
  gap: 1rem;
  margin: 0 auto;
}

:global(body.admin-dark-mode) .section-page {
  --section-surface: #111827;
  --section-border: #334155;
  --section-heading: #f8fafc;
  --section-muted: #cbd5e1;
  --section-eyebrow: #93c5fd;
  --section-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
}

header,
.module-grid article,
.data-panel {
  border: 1px solid var(--section-border);
  border-radius: 16px;
  background: var(--section-surface);
  box-shadow: var(--section-shadow);
  padding: 1.25rem;
}

header,
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

h1,
h2 {
  margin: 0;
  color: var(--section-heading);
  font-weight: 950;
}

p,
small,
.compact-table span,
.activity-list span {
  color: var(--section-muted);
}

input,
select,
textarea {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--section-border);
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  padding: 0.55rem 0.7rem;
}

textarea {
  resize: vertical;
}

.eyebrow,
.panel-head a {
  color: var(--section-eyebrow);
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.panel-head a {
  text-decoration: none;
}

.ghost-button {
  min-height: 38px;
  border: 1px solid var(--section-border);
  border-radius: 10px;
  background: transparent;
  color: var(--section-heading);
  cursor: pointer;
  font-weight: 900;
  padding: 0 0.85rem;
}

.module-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.module-grid article {
  display: grid;
  gap: 0.35rem;
}

.skeleton-card span,
.skeleton-card strong,
.skeleton-card small,
.panel-skeleton span {
  display: block;
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

.skeleton-card span {
  width: 58%;
  height: 13px;
}

.skeleton-card strong {
  width: 42%;
  height: 28px;
}

.skeleton-card small {
  width: 72%;
  height: 13px;
}

.module-grid span {
  color: var(--section-eyebrow);
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.module-grid strong {
  color: var(--section-heading);
  font-size: 1.45rem;
}

.data-panel {
  display: grid;
  gap: 1rem;
}

.announcement-composer {
  display: grid;
  gap: 0.75rem;
  border: 1px solid var(--section-border);
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.9rem;
}

.announcement-composer > div:first-child {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 0.75rem;
}

.announcement-composer label {
  display: grid;
  gap: 0.35rem;
  color: var(--section-heading);
  font-size: 0.78rem;
  font-weight: 900;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.composer-actions span {
  margin-right: auto;
  color: #16a34a;
  font-weight: 900;
}

.composer-actions button {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-weight: 900;
  padding: 0 0.85rem;
}

.panel-skeleton {
  display: grid;
  gap: 0.65rem;
}

.panel-skeleton span {
  height: 48px;
  border-radius: 12px;
}

.panel-skeleton.timeline span {
  height: 58px;
}

.report-progress {
  display: grid;
  gap: 0.55rem;
  min-height: 46px;
  color: var(--section-eyebrow);
  font-weight: 900;
}

.report-progress::after {
  content: "";
  grid-row: 2;
  height: 8px;
  border-radius: 999px;
  background: #dbeafe;
}

.report-progress i {
  grid-row: 2;
  grid-column: 1;
  z-index: 1;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #22c55e);
  transition: width 0.18s ease;
}

.connected { color: #16a34a; }
.checking { color: #d97706; }
.lost { color: #dc2626; }

.compact-table,
.activity-list {
  display: grid;
  gap: 0.65rem;
}

.compact-table article,
.activity-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid var(--section-border);
  border-radius: 12px;
  padding: 0.75rem;
}

.compact-table strong,
.activity-list strong {
  color: var(--section-heading);
}

.action-grid button {
  min-height: 54px;
  border: 1px solid var(--section-border);
  border-radius: 12px;
  background: transparent;
  color: var(--section-heading);
  cursor: pointer;
  font-weight: 900;
}

.action-grid button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

:global(body.admin-dark-mode) .announcement-composer,
:global(body.admin-dark-mode) input,
:global(body.admin-dark-mode) select,
:global(body.admin-dark-mode) textarea {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

@media (max-width: 760px) {
  header,
  .panel-head {
    flex-direction: column;
  }

  .compact-table article,
  .activity-list article,
  .announcement-composer > div:first-child {
    grid-template-columns: 1fr;
  }
}
</style>

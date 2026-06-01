<template>
  <AppLayout>
    <section class="platform-console">
      <header class="page-title">
        <div>
          <span class="eyebrow">Platform command center</span>
          <h1>Super Admin Dashboard</h1>
          <p>Last updated: {{ lastUpdatedLabel }}</p>
        </div>
        <div class="title-actions">
          <button type="button" class="ghost-button" @click="loadDashboard">Refresh</button>
          <button type="button" class="primary-button" @click="router.push('/super-admin/schools')">Manage Schools</button>
        </div>
      </header>

      <section class="metric-grid" aria-label="Platform metrics">
        <template v-if="loading">
          <article v-for="item in 8" :key="item" class="metric-card metric-loading">
            <span></span>
            <strong></strong>
            <small></small>
          </article>
        </template>
        <template v-else>
          <button
            v-for="card in metricCards"
            :key="card.label"
            type="button"
            class="metric-card"
            :class="card.tone"
            @click="openMetric(card)"
          >
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.caption }}</small>
          </button>
        </template>
      </section>

      <section class="section-block priority-section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Needs attention</span>
            <h2>Action queue</h2>
          </div>
          <div class="severity-summary">
            <span class="critical">Critical: {{ criticalCount }}</span>
            <span class="warning">Warning: {{ warningCount }}</span>
          </div>
        </div>

        <div class="attention-list">
          <article v-for="item in attentionItems" :key="item.label" :class="item.severity">
            <span class="severity-dot"></span>
            <div>
              <strong>{{ item.label }}</strong>
              <small>{{ item.text }}</small>
            </div>
            <button type="button" @click="router.push(item.to)">{{ item.action }}</button>
          </article>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">Subscriptions</span>
              <h2>Revenue and billing</h2>
            </div>
            <router-link to="/super-admin/billing">Open billing</router-link>
          </div>
          <div class="finance-grid">
            <article>
              <span>Estimated MRR</span>
              <strong>{{ formatCurrency(stats.estimated_monthly_revenue || 0) }}</strong>
              <small>{{ stats.active_subscriptions || 0 }} active subscriptions</small>
            </article>
            <article>
              <span>Expiring soon</span>
              <strong>{{ stats.expiring_subscriptions || 0 }}</strong>
              <small>Due within 30 days</small>
            </article>
            <article>
              <span>Expired</span>
              <strong>{{ expiredSubscriptionCount }}</strong>
              <small>Need billing follow-up</small>
            </article>
          </div>
        </section>

        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">System status</span>
              <h2>Core services</h2>
            </div>
            <small>{{ serviceHealthLabel }}</small>
          </div>
          <div class="system-list">
            <article v-for="item in healthItems" :key="item.label">
              <span :class="item.tone"></span>
              <strong>{{ item.label }}</strong>
              <small>{{ item.status }}</small>
            </article>
          </div>
        </section>
      </div>

      <div class="dashboard-grid">
        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">Growth</span>
              <h2>Schools and coverage</h2>
            </div>
            <small>{{ growthLabel }}</small>
          </div>
          <div class="progress-list">
            <article v-for="item in coverageItems" :key="item.label">
              <div>
                <strong>{{ item.label }}</strong>
                <small>{{ item.caption }}</small>
              </div>
              <b>{{ item.value }}%</b>
              <span><i :style="{ width: `${item.value}%` }"></i></span>
            </article>
          </div>
        </section>

        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">Quick actions</span>
              <h2>Common admin tasks</h2>
            </div>
          </div>
          <div class="quick-action-grid">
            <button v-for="action in quickActions" :key="action.label" type="button" @click="router.push(action.to)">
              <strong>{{ action.label }}</strong>
              <small>{{ action.caption }}</small>
            </button>
          </div>
        </section>
      </div>

      <section class="section-block">
        <div class="section-head">
          <div>
            <span class="eyebrow">Global search</span>
            <h2>Find a school, DOS, code, email, or phone</h2>
          </div>
          <router-link to="/super-admin/schools">Advanced filters</router-link>
        </div>
        <input v-model.trim="search" class="global-search" type="search" placeholder="Search platform records..." autocomplete="off">
        <div v-if="searchResults.length" class="search-results">
          <button v-for="school in searchResults" :key="school.school_id" type="button" @click="openSchool(school)">
            <strong>{{ school.school_name }}</strong>
            <span>{{ school.dos_name || 'No DOS assigned' }}</span>
            <small>{{ school.school_email }} · {{ school.school_code || 'No code' }}</small>
          </button>
        </div>
        <div v-else-if="search" class="empty-state">No platform records match that search.</div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <span class="eyebrow">Recent activity</span>
            <h2>Platform audit feed</h2>
          </div>
          <router-link to="/super-admin/activity">View audit logs</router-link>
        </div>
        <div v-if="loading" class="skeleton-list">
          <span v-for="item in 5" :key="item"></span>
        </div>
        <div v-else-if="!activities.length" class="empty-state">No recent platform activity.</div>
        <div v-else class="timeline-list">
          <article v-for="activity in activities.slice(0, 8)" :key="activity.activity_id || activity.created_at">
            <span :class="activityTone(activity.action)"></span>
            <div>
              <strong>{{ activity.actionLabel }}</strong>
              <small>{{ activity.message || activity.school_name || 'Platform activity recorded' }}</small>
            </div>
            <time>{{ formatRelative(activity.created_at) }}</time>
          </article>
        </div>
      </section>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const router = useRouter()
const stats = ref({})
const schools = ref([])
const activities = ref([])
const loading = ref(false)
const lastUpdated = ref(null)
const search = ref('')

const activeSchools = computed(() => schools.value.filter((school) => school.status === 'active'))
const pendingSchools = computed(() => schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status)))
const suspendedSchools = computed(() => schools.value.filter((school) => ['suspended', 'deactivated'].includes(school.status)))
const expiredSchools = computed(() => schools.value.filter((school) => school.status === 'expired' || school.subscription_status === 'expired' || (school.subscription_expires_at && new Date(school.subscription_expires_at) < new Date())))
const missingDosSchools = computed(() => schools.value.filter((school) => !school.dos_name && !school.dos_email))
const inactiveSchools = computed(() => schools.value.filter((school) => {
  if (!school.last_activity_at) return false
  return (Date.now() - new Date(school.last_activity_at).getTime()) / 86400000 > 30
}))
const trialSchools = computed(() => schools.value.filter((school) => school.subscription_status === 'trial'))
const issueCount = computed(() => expiredSchools.value.length + suspendedSchools.value.length + missingDosSchools.value.length + inactiveSchools.value.length)
const criticalCount = computed(() => expiredSchools.value.length + suspendedSchools.value.length)
const warningCount = computed(() => missingDosSchools.value.length + inactiveSchools.value.length + Number(stats.value.expiring_subscriptions || 0))
const expiredSubscriptionCount = computed(() => stats.value.expired_subscriptions || expiredSchools.value.length)
const lastUpdatedLabel = computed(() => lastUpdated.value ? formatRelative(lastUpdated.value) : 'loading...')

const metricCards = computed(() => [
  { label: 'Schools', value: stats.value.total_schools || schools.value.length, caption: `${stats.value.new_schools_30d || 0} new this month`, tone: 'blue', to: '/super-admin/schools' },
  { label: 'Active', value: stats.value.active_schools || activeSchools.value.length, caption: 'operational schools', tone: 'green', to: '/super-admin/schools?status=active' },
  { label: 'Pending', value: stats.value.pending_schools || pendingSchools.value.length, caption: 'awaiting approval', tone: 'amber', to: '/super-admin/schools?status=pending_approval' },
  { label: 'Issues', value: issueCount.value, caption: 'need admin action', tone: issueCount.value ? 'rose' : 'green', to: '/super-admin/schools' },
  { label: 'DOS', value: stats.value.total_dos || 0, caption: `${stats.value.pending_dos || 0} pending`, tone: 'violet', to: '/super-admin/dos' },
  { label: 'Teachers', value: stats.value.total_teachers || 0, caption: `${stats.value.active_teachers || 0} active`, tone: 'blue', to: '/super-admin/reports' },
  { label: 'Timetables', value: stats.value.schools_with_timetables || 0, caption: 'schools covered', tone: 'green', to: '/super-admin/reports' },
  { label: 'MRR', value: formatCompactCurrency(stats.value.estimated_monthly_revenue || 0), caption: 'estimated revenue', tone: 'amber', to: '/super-admin/billing' }
])

const attentionItems = computed(() => [
  { label: `${pendingSchools.value.length} School${pendingSchools.value.length === 1 ? '' : 's'} Awaiting Approval`, text: 'New school registrations need review before access is granted.', severity: 'warning', action: 'Approve', to: '/super-admin/schools?status=pending_approval' },
  { label: `${suspendedSchools.value.length} Suspended School${suspendedSchools.value.length === 1 ? '' : 's'}`, text: 'Access is restricted and needs admin review.', severity: 'critical', action: 'Review', to: '/super-admin/schools?status=suspended' },
  { label: `${expiredSubscriptionCount.value} Expired Subscription${expiredSubscriptionCount.value === 1 ? '' : 's'}`, text: 'Billing or renewal action is required.', severity: 'critical', action: 'Billing', to: '/super-admin/billing' },
  { label: `${stats.value.expiring_subscriptions || 0} Subscription${Number(stats.value.expiring_subscriptions || 0) === 1 ? '' : 's'} Expiring Soon`, text: 'Renewal follow-up is due within 30 days.', severity: 'warning', action: 'Renewals', to: '/super-admin/billing' },
  { label: `${missingDosSchools.value.length} School${missingDosSchools.value.length === 1 ? '' : 's'} Missing DOS`, text: 'Ownership is incomplete for these schools.', severity: 'warning', action: 'Assign DOS', to: '/super-admin/dos' },
  { label: `${inactiveSchools.value.length} Inactive School${inactiveSchools.value.length === 1 ? '' : 's'}`, text: 'No activity has been recorded for 30+ days.', severity: 'warning', action: 'Inspect', to: '/super-admin/schools' }
])

const quickActions = [
  { label: '+ Add School', caption: 'Create or invite a new school', to: '/super-admin/schools' },
  { label: '+ Assign DOS', caption: 'Create or transfer ownership', to: '/super-admin/dos' },
  { label: '+ Subscription', caption: 'Manage renewals and billing', to: '/super-admin/billing' },
  { label: '+ Announcement', caption: 'Notify selected schools', to: '/super-admin/administration' },
  { label: '+ Report', caption: 'Export platform data', to: '/super-admin/reports' },
  { label: '+ Audit Logs', caption: 'Review admin activity', to: '/super-admin/activity' }
]

const healthItems = computed(() => [
  { label: 'API', status: loading.value ? 'Checking' : 'Operational', tone: loading.value ? 'amber' : 'green' },
  { label: 'Database', status: stats.value.total_schools !== undefined ? 'Connected' : 'No response', tone: stats.value.total_schools !== undefined ? 'green' : 'rose' },
  { label: 'Email', status: 'Configured for OTP', tone: 'green' },
  { label: 'Backups', status: 'Review schedule', tone: 'amber' },
  { label: 'Audit trail', status: `${activities.value.length} recent events`, tone: activities.value.length ? 'green' : 'amber' }
])

const coverageItems = computed(() => [
  {
    label: 'Active schools',
    caption: `${activeSchools.value.length} of ${schools.value.length || 0} schools are active`,
    value: percent(activeSchools.value.length, schools.value.length)
  },
  {
    label: 'DOS coverage',
    caption: `${schools.value.length - missingDosSchools.value.length} schools have ownership`,
    value: percent(schools.value.length - missingDosSchools.value.length, schools.value.length)
  },
  {
    label: 'Timetable coverage',
    caption: `${stats.value.schools_with_timetables || 0} schools have timetable entries`,
    value: percent(stats.value.schools_with_timetables || 0, stats.value.total_schools || schools.value.length)
  },
  {
    label: 'Paid/active subscriptions',
    caption: `${stats.value.active_subscriptions || 0} active, ${trialSchools.value.length} trial`,
    value: percent(stats.value.active_subscriptions || 0, stats.value.total_schools || schools.value.length)
  }
])

const serviceHealthLabel = computed(() => healthItems.value.some((item) => item.tone === 'rose') ? 'Attention needed' : 'Operational')
const growthLabel = computed(() => {
  const current = Number(stats.value.new_schools_30d || 0)
  const previous = Number(stats.value.previous_schools_30d || 0)
  if (!previous && current) return `${current} new schools this month`
  if (!previous) return 'No growth data yet'
  const change = Math.round(((current - previous) / previous) * 100)
  return `${change >= 0 ? '+' : ''}${change}% vs previous 30 days`
})

const searchResults = computed(() => {
  const term = search.value.toLowerCase()
  if (!term) return []
  return schools.value.filter((school) => [
    school.school_name,
    school.school_email,
    school.school_code,
    school.registration_number,
    school.phone,
    school.dos_name,
    school.dos_email
  ].some((value) => String(value || '').toLowerCase().includes(term))).slice(0, 6)
})

const loadDashboard = async () => {
  loading.value = true
  try {
    const [statsResponse, schoolsResponse] = await Promise.all([
      api.get('/schools/stats'),
      api.get('/schools', { showGlobalNotification: false })
    ])
    stats.value = statsResponse.data.stats || {}
    schools.value = schoolsResponse.data.schools || []
    activities.value = (statsResponse.data.activities || []).map((activity) => ({
      ...activity,
      actionLabel: titleCase(String(activity.action || 'platform activity').replace(/_/g, ' '))
    }))
    lastUpdated.value = new Date().toISOString()
  } catch (error) {
    stats.value = {}
    schools.value = []
    activities.value = []
  } finally {
    loading.value = false
  }
}

const openMetric = (card) => router.push(card.to || '/super-admin/schools')
const openSchool = (school) => router.push(`/super-admin/schools/${school.school_id}`)

const percent = (value, total) => {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100)))
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatCompactCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1
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

const activityTone = (action) => {
  const text = String(action || '').toLowerCase()
  if (text.includes('suspend') || text.includes('reject') || text.includes('delete')) return 'rose'
  if (text.includes('pending') || text.includes('created') || text.includes('subscription')) return 'amber'
  if (text.includes('approve') || text.includes('active')) return 'green'
  return 'blue'
}

onMounted(loadDashboard)
</script>

<style scoped>
.platform-console {
  width: min(100%, 1480px);
  display: grid;
  gap: 0.95rem;
  margin: 0 auto;
}

.page-title,
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-title {
  align-items: flex-end;
}

.page-title h1,
.section-head h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

.page-title h1 {
  font-size: clamp(1.3rem, 1.7vw, 1.65rem);
}

.section-head h2 {
  font-size: clamp(1rem, 1.35vw, 1.28rem);
}

.page-title p,
.section-head small,
.metric-card small,
.attention-list small,
.quick-action-grid small,
.system-list small,
.timeline-list small,
.finance-grid small,
.progress-list small,
.search-results small {
  color: #64748b;
}

.eyebrow {
  display: block;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.title-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.primary-button,
.ghost-button,
.attention-list button {
  min-height: 38px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 900;
  padding: 0 0.85rem;
}

.primary-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.ghost-button,
.attention-list button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.section-block,
.metric-card {
  border: 1px solid rgba(219, 234, 254, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.section-block {
  padding: 1rem;
}

.section-head {
  margin-bottom: 0.8rem;
}

.section-head a {
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.metric-card {
  display: grid;
  gap: 0.25rem;
  min-height: 104px;
  padding: 1rem;
  cursor: pointer;
  text-align: left;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.metric-card:hover,
.metric-card:focus-visible,
.quick-action-grid button:hover,
.quick-action-grid button:focus-visible,
.search-results button:hover,
.search-results button:focus-visible {
  border-color: #93c5fd;
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.12);
  transform: translateY(-2px);
  outline: 0;
}

.metric-card span,
.finance-grid span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
}

.metric-loading {
  cursor: default;
}

.metric-loading span,
.metric-loading strong,
.metric-loading small {
  display: block;
  width: 72%;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

.metric-loading strong {
  width: 44%;
  height: 28px;
}

.metric-loading small {
  width: 62%;
}

.metric-card strong {
  color: currentColor;
  font-size: 1.65rem;
  line-height: 1;
}

.blue { color: #2563eb; }
.green { color: #16a34a; }
.amber { color: #d97706; }
.rose { color: #e11d48; }
.violet { color: #7c3aed; }

.priority-section {
  border-color: #bfdbfe;
}

.severity-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.severity-summary span {
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 950;
}

.severity-summary .critical {
  background: #fee2e2;
  color: #991b1b;
}

.severity-summary .warning {
  background: #fef3c7;
  color: #92400e;
}

.attention-list,
.timeline-list,
.system-list,
.progress-list {
  display: grid;
  gap: 0.75rem;
}

.attention-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.attention-list article,
.timeline-list article,
.system-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border-radius: 12px;
  background: #f8fafc;
  padding: 0.75rem;
}

.attention-list article.critical { background: #fff7f7; }
.attention-list article.warning { background: #fffbeb; }

.severity-dot,
.system-list article > span,
.timeline-list article > span {
  width: 11px;
  height: 11px;
  border-radius: 999px;
}

.critical .severity-dot,
.timeline-list .rose,
.system-list .rose { background: #e11d48; }
.warning .severity-dot,
.timeline-list .amber,
.system-list .amber { background: #f59e0b; }
.timeline-list .green,
.system-list .green { background: #16a34a; }
.timeline-list .blue,
.system-list .blue { background: #2563eb; }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 1rem;
}

.finance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.finance-grid article,
.quick-action-grid button,
.search-results button {
  display: grid;
  gap: 0.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  padding: 0.85rem;
  text-align: left;
}

.finance-grid strong {
  color: #0f172a;
  font-size: 1.35rem;
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: 0.75rem;
}

.quick-action-grid button,
.search-results button {
  cursor: pointer;
  font-weight: 900;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.progress-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem 0.75rem;
  align-items: center;
}

.progress-list article > span {
  grid-column: 1 / -1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-list i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

.global-search {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  outline: none;
  padding: 0 0.9rem;
  font-weight: 750;
}

.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.search-results span {
  color: #334155;
}

.system-list article {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.timeline-list article {
  position: relative;
}

.timeline-list article + article::before {
  content: "";
  position: absolute;
  left: 0.9rem;
  top: -0.75rem;
  width: 1px;
  height: 0.75rem;
  background: #dbeafe;
}

.timeline-list time {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}

.skeleton-list {
  display: grid;
  gap: 0.75rem;
}

.skeleton-list span {
  min-height: 58px;
  border-radius: 12px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

.empty-state {
  padding: 1rem;
  color: #64748b;
  text-align: center;
}

:global(body.admin-dark-mode) .platform-console {
  color: #e5e7eb !important;
}

:global(body.admin-dark-mode) .page-title h1,
:global(body.admin-dark-mode) .section-head h2,
:global(body.admin-dark-mode) .metric-card strong,
:global(body.admin-dark-mode) .attention-list strong,
:global(body.admin-dark-mode) .quick-action-grid strong,
:global(body.admin-dark-mode) .system-list strong,
:global(body.admin-dark-mode) .timeline-list strong,
:global(body.admin-dark-mode) .finance-grid strong,
:global(body.admin-dark-mode) .progress-list strong,
:global(body.admin-dark-mode) .search-results strong {
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .page-title p,
:global(body.admin-dark-mode) .section-head small,
:global(body.admin-dark-mode) .metric-card span,
:global(body.admin-dark-mode) .metric-card small,
:global(body.admin-dark-mode) .attention-list small,
:global(body.admin-dark-mode) .quick-action-grid small,
:global(body.admin-dark-mode) .system-list small,
:global(body.admin-dark-mode) .timeline-list small,
:global(body.admin-dark-mode) .timeline-list time,
:global(body.admin-dark-mode) .empty-state,
:global(body.admin-dark-mode) .finance-grid span,
:global(body.admin-dark-mode) .finance-grid small,
:global(body.admin-dark-mode) .progress-list small,
:global(body.admin-dark-mode) .search-results span,
:global(body.admin-dark-mode) .search-results small {
  color: #cbd5e1 !important;
}

:global(body.admin-dark-mode) .section-block,
:global(body.admin-dark-mode) .metric-card {
  background: #111827 !important;
  border-color: #334155 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body.admin-dark-mode) .attention-list article,
:global(body.admin-dark-mode) .timeline-list article,
:global(body.admin-dark-mode) .system-list article,
:global(body.admin-dark-mode) .quick-action-grid button,
:global(body.admin-dark-mode) .finance-grid article,
:global(body.admin-dark-mode) .search-results button,
:global(body.admin-dark-mode) .global-search {
  background: #0f172a !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .attention-list article.critical {
  background: rgba(127, 29, 29, 0.34) !important;
}

:global(body.admin-dark-mode) .attention-list article.warning {
  background: rgba(120, 53, 15, 0.3) !important;
}

:global(body.admin-dark-mode) .ghost-button,
:global(body.admin-dark-mode) .attention-list button {
  background: #1f2937 !important;
  border-color: #475569 !important;
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .section-head a,
:global(body.admin-dark-mode) .eyebrow {
  color: #93c5fd !important;
}

:global(body.admin-dark-mode) .progress-list article > span {
  background: #334155;
}

@media (max-width: 1120px) {
  .metric-grid,
  .dashboard-grid,
  .attention-list {
    grid-template-columns: 1fr;
  }

  .finance-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

@media (max-width: 720px) {
  .section-head,
  .page-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}
</style>

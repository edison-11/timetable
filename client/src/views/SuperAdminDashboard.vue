<template>
  <AppLayout>
    <section class="platform-console">
      <header class="page-title">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Last updated: {{ lastUpdatedLabel }}</p>
        </div>
      </header>

      <section class="health-grid" aria-label="Platform health">
        <article
          v-for="card in platformHealthCards"
          :key="card.label"
          class="health-card"
          :class="card.tone"
          role="button"
          tabindex="0"
          @click="openMetric(card)"
          @keyup.enter="openMetric(card)"
        >
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.caption }}</small>
        </article>
      </section>

      <section class="section-block priority-section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Needs attention</span>
            <h2>What requires action now</h2>
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
            <button type="button" @click="router.push(item.to)">Review</button>
          </article>
        </div>
      </section>

      <div class="dashboard-grid">
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

        <section class="section-block">
          <div class="section-head">
            <div>
              <span class="eyebrow">System status</span>
              <h2>Core services</h2>
            </div>
            <small>99.8% healthy</small>
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

      <section class="section-block">
        <div class="section-head">
          <div>
            <span class="eyebrow">Recent activity</span>
            <h2>Last 5 platform events</h2>
          </div>
          <router-link to="/super-admin/schools">View full activity</router-link>
        </div>
        <div v-if="loading" class="skeleton-list">
          <span v-for="item in 5" :key="item"></span>
        </div>
        <div v-else-if="!activities.length" class="empty-state">No recent platform activity.</div>
        <div v-else class="timeline-list">
          <article v-for="activity in activities.slice(0, 5)" :key="activity.activity_id || activity.created_at">
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

const platformHealthCards = computed(() => [
  { label: 'Schools', value: stats.value.total_schools || schools.value.length, caption: 'registered', tone: 'blue', status: '' },
  { label: 'Active', value: stats.value.active_schools || activeSchools.value.length, caption: 'operational', tone: 'green', status: 'active' },
  { label: 'Pending', value: stats.value.pending_schools || pendingSchools.value.length, caption: 'needs review', tone: 'amber', status: 'pending_approval' },
  { label: 'Issues', value: issueCount.value, caption: 'need action', tone: issueCount.value ? 'rose' : 'green', status: 'suspended' }
])

const activeSchools = computed(() => schools.value.filter((school) => school.status === 'active'))
const pendingSchools = computed(() => schools.value.filter((school) => ['pending', 'pending_approval'].includes(school.status)))
const suspendedSchools = computed(() => schools.value.filter((school) => ['suspended', 'deactivated'].includes(school.status)))
const expiredSchools = computed(() => schools.value.filter((school) => school.status === 'expired' || (school.subscription_expires_at && new Date(school.subscription_expires_at) < new Date())))
const missingDosSchools = computed(() => schools.value.filter((school) => !school.dos_name && !school.dos_email))
const inactiveSchools = computed(() => schools.value.filter((school) => {
  if (!school.last_activity_at) return false
  return (Date.now() - new Date(school.last_activity_at).getTime()) / 86400000 > 30
}))
const issueCount = computed(() => expiredSchools.value.length + suspendedSchools.value.length + missingDosSchools.value.length + inactiveSchools.value.length)
const criticalCount = computed(() => expiredSchools.value.length + suspendedSchools.value.length)
const warningCount = computed(() => missingDosSchools.value.length + inactiveSchools.value.length)
const lastUpdatedLabel = computed(() => lastUpdated.value ? formatRelative(lastUpdated.value) : 'loading...')

const attentionItems = computed(() => [
  { label: `${suspendedSchools.value.length} Suspended School${suspendedSchools.value.length === 1 ? '' : 's'}`, text: 'Access is restricted and needs admin review.', severity: 'critical', to: '/super-admin/schools?status=suspended' },
  { label: `${expiredSchools.value.length} Expired Subscription${expiredSchools.value.length === 1 ? '' : 's'}`, text: 'Billing or renewal action is required.', severity: 'critical', to: '/super-admin/schools' },
  { label: `${missingDosSchools.value.length} School${missingDosSchools.value.length === 1 ? '' : 's'} Missing DOS`, text: 'Ownership is incomplete for these schools.', severity: 'warning', to: '/super-admin/dos' },
  { label: `${inactiveSchools.value.length} Inactive School${inactiveSchools.value.length === 1 ? '' : 's'}`, text: 'No activity has been recorded for 30+ days.', severity: 'warning', to: '/super-admin/schools' }
])

const quickActions = [
  { label: '+ Add School', caption: 'Create or invite a new school', to: '/super-admin/schools' },
  { label: '+ Create Database', caption: 'Provision school data space', to: '/super-admin/databases' },
  { label: '+ Announcement', caption: 'Notify selected schools', to: '/super-admin/administration' },
  { label: '+ Report', caption: 'Export platform data', to: '/super-admin/reports' },
  { label: '+ Audit Logs', caption: 'Review admin activity', to: '/super-admin/activity' }
]

const healthItems = [
  { label: 'API', status: 'Operational', tone: 'green' },
  { label: 'Database', status: 'Operational', tone: 'green' },
  { label: 'Email', status: 'Operational', tone: 'green' },
  { label: 'Backups', status: 'Today', tone: 'green' }
]

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
      actionLabel: String(activity.action || 'platform activity').replace(/_/g, ' ')
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

const openMetric = (card) => {
  router.push({ path: '/super-admin/schools', query: card.status ? { status: card.status } : {} })
}

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

const activityTone = (action) => {
  const text = String(action || '').toLowerCase()
  if (text.includes('suspend') || text.includes('reject')) return 'rose'
  if (text.includes('pending') || text.includes('created')) return 'amber'
  return 'green'
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

.page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
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
.health-card small,
.attention-list small,
.quick-action-grid small,
.system-list small,
.timeline-list small {
  color: #64748b;
}

.section-block,
.health-card {
  border: 1px solid rgba(219, 234, 254, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.section-block {
  padding: 1rem;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.8rem;
}

.section-head a {
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

.eyebrow {
  display: block;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.health-card {
  display: grid;
  gap: 0.25rem;
  min-height: 104px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.health-card:hover,
.health-card:focus-visible {
  border-color: #93c5fd;
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.12);
  transform: translateY(-2px);
  outline: 0;
}

.health-card span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
}

.health-card strong {
  color: currentColor;
  font-size: 1.65rem;
  line-height: 1;
}

.blue { color: #2563eb; }
.green { color: #16a34a; }
.amber { color: #d97706; }
.rose { color: #e11d48; }

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
.system-list {
  display: grid;
  gap: 0.75rem;
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

.attention-list article.critical {
  background: #fff7f7;
}

.attention-list article.warning {
  background: #fffbeb;
}

.severity-dot,
.system-list article > span,
.timeline-list article > span {
  width: 11px;
  height: 11px;
  border-radius: 999px;
}

.critical .severity-dot,
.timeline-list .rose { background: #e11d48; }
.warning .severity-dot,
.timeline-list .amber { background: #f59e0b; }
.timeline-list .green,
.system-list .green { background: #16a34a; }

.attention-list button {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-weight: 900;
  padding: 0.55rem 0.75rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 1rem;
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.quick-action-grid button {
  display: grid;
  gap: 0.25rem;
  justify-items: start;
  min-height: 76px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  font-weight: 900;
  padding: 0.85rem;
  text-align: left;
}

:global(body.admin-dark-mode) .platform-console {
  color: #e5e7eb !important;
}

:global(body.admin-dark-mode) .page-title h1,
:global(body.admin-dark-mode) .section-head h2,
:global(body.admin-dark-mode) .health-card strong,
:global(body.admin-dark-mode) .attention-list strong,
:global(body.admin-dark-mode) .quick-action-grid strong,
:global(body.admin-dark-mode) .system-list strong,
:global(body.admin-dark-mode) .timeline-list strong {
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .page-title p,
:global(body.admin-dark-mode) .section-head small,
:global(body.admin-dark-mode) .health-card span,
:global(body.admin-dark-mode) .health-card small,
:global(body.admin-dark-mode) .attention-list small,
:global(body.admin-dark-mode) .quick-action-grid small,
:global(body.admin-dark-mode) .system-list small,
:global(body.admin-dark-mode) .timeline-list small,
:global(body.admin-dark-mode) .timeline-list time,
:global(body.admin-dark-mode) .empty-state {
  color: #cbd5e1 !important;
}

:global(body.admin-dark-mode) .section-block,
:global(body.admin-dark-mode) .health-card {
  background: #111827 !important;
  border-color: #334155 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body.admin-dark-mode) .health-card:hover,
:global(body.admin-dark-mode) .health-card:focus-visible {
  border-color: rgba(96, 165, 250, 0.8);
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.18);
}

:global(body.admin-dark-mode) .attention-list article,
:global(body.admin-dark-mode) .timeline-list article,
:global(body.admin-dark-mode) .system-list article,
:global(body.admin-dark-mode) .quick-action-grid button {
  background: #0f172a !important;
  border-color: #334155 !important;
}

:global(body.admin-dark-mode) .attention-list article.critical {
  background: rgba(127, 29, 29, 0.34) !important;
}

:global(body.admin-dark-mode) .attention-list article.warning {
  background: rgba(120, 53, 15, 0.3) !important;
}

:global(body.admin-dark-mode) .attention-list button {
  background: #1f2937 !important;
  border-color: #475569 !important;
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .severity-summary .critical {
  background: rgba(127, 29, 29, 0.55);
  color: #fecaca;
}

:global(body.admin-dark-mode) .severity-summary .warning {
  background: rgba(120, 53, 15, 0.55);
  color: #fde68a;
}

:global(body.admin-dark-mode) .section-head a,
:global(body.admin-dark-mode) .eyebrow {
  color: #93c5fd !important;
}

:global(body.admin-dark-mode) .timeline-list article + article::before {
  background: #334155 !important;
}

:global(body.admin-dark-mode) .health-card.blue strong { color: #60a5fa !important; }
:global(body.admin-dark-mode) .health-card.green strong { color: #4ade80 !important; }
:global(body.admin-dark-mode) .health-card.amber strong { color: #fbbf24 !important; }
:global(body.admin-dark-mode) .health-card.rose strong { color: #fb7185 !important; }

:global(body.admin-dark-mode) .health-card.blue,
:global(body.admin-dark-mode) .health-card.green,
:global(body.admin-dark-mode) .health-card.amber,
:global(body.admin-dark-mode) .health-card.rose {
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .attention-list div,
:global(body.admin-dark-mode) .attention-list strong,
:global(body.admin-dark-mode) .attention-list small {
  background: transparent !important;
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

@media (max-width: 980px) {
  .health-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .page-title {
    align-items: flex-start;
    flex-direction: column;
  }
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}
</style>

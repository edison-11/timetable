<template>
  <AppLayout>
    <section class="platform-dashboard">
      <header class="page-head">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Manage schools and Directors of Studies without opening teacher records.</p>
        </div>
        <router-link to="/super-admin/schools" class="primary-action">Manage Schools</router-link>
      </header>

      <div class="metric-grid">
        <article v-for="card in metricCards" :key="card.label" class="metric-card">
          <span :class="['metric-icon', card.tone]"></span>
          <div>
            <small>{{ card.label }}</small>
            <strong>{{ card.value }}</strong>
            <em>{{ card.caption }}</em>
          </div>
        </article>
      </div>

      <div class="dashboard-grid">
        <section id="analytics" class="panel">
          <div class="panel-head">
            <h2>School Status</h2>
            <span>{{ statusTotal }} schools</span>
          </div>
          <div class="status-bars">
            <div v-for="item in statusBars" :key="item.label">
              <div class="bar-label">
                <strong>{{ item.label }}</strong>
                <span>{{ item.value }}</span>
              </div>
              <div class="bar"><span :class="item.tone" :style="{ width: `${item.percent}%` }"></span></div>
            </div>
          </div>
        </section>

        <section id="logs" class="panel">
          <div class="panel-head">
            <h2>DOS & School Activity</h2>
            <button type="button" @click="loadStats">Refresh</button>
          </div>
          <div v-if="!activities.length" class="empty-state">No platform activity yet.</div>
          <div v-for="activity in activities" :key="activity.activity_id" class="activity-row">
            <div>
              <strong>{{ activity.actionLabel }}</strong>
              <p>{{ activity.message || activity.school_name || 'System activity recorded.' }}</p>
            </div>
            <time>{{ formatDate(activity.created_at) }}</time>
          </div>
        </section>

        <section id="reports" class="panel wide">
          <div class="panel-head">
            <h2>School Setup Totals</h2>
            <span>All approved and pending schools</span>
          </div>
          <div class="report-grid">
            <div>
              <small>Classes</small>
              <strong>{{ stats.total_classes || 0 }}</strong>
              <span>classes created by schools</span>
            </div>
            <div>
              <small>Teachers</small>
              <strong>{{ stats.total_teachers || 0 }}</strong>
              <span>teacher accounts counted only</span>
            </div>
            <div>
              <small>Combinations</small>
              <strong>{{ stats.total_combinations || 0 }}</strong>
              <span>teacher, subject, and class links</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const stats = ref({})
const activities = ref([])

const metricCards = computed(() => [
  { label: 'Total Schools', value: stats.value.total_schools || 0, caption: 'registered schools', tone: 'blue' },
  { label: 'DOS Accounts', value: stats.value.total_dos || 0, caption: `${stats.value.active_dos || 0} active`, tone: 'green' },
  { label: 'Classes', value: stats.value.total_classes || 0, caption: 'across schools', tone: 'violet' },
  { label: 'Combinations', value: stats.value.total_combinations || 0, caption: 'assigned links', tone: 'amber' },
  { label: 'Active Schools', value: stats.value.active_schools || 0, caption: 'enabled schools', tone: 'green' },
  { label: 'Pending Schools', value: stats.value.pending_schools || 0, caption: 'waiting approval', tone: 'amber' },
  { label: 'Suspended Schools', value: stats.value.suspended_schools || 0, caption: 'access blocked', tone: 'rose' }
])

const statusTotal = computed(() => Math.max(Number(stats.value.total_schools || 0), 1))
const statusBars = computed(() => [
  { label: 'Active', value: stats.value.active_schools || 0, tone: 'green' },
  { label: 'Pending', value: stats.value.pending_schools || 0, tone: 'amber' },
  { label: 'Suspended', value: stats.value.suspended_schools || 0, tone: 'amber' },
  { label: 'Inactive', value: stats.value.inactive_schools || 0, tone: 'rose' }
].map((item) => ({ ...item, percent: Math.round((Number(item.value || 0) / statusTotal.value) * 100) })))

const loadStats = async () => {
  try {
    const response = await api.get('/schools/stats')
    stats.value = response.data.stats || {}
    activities.value = (response.data.activities || []).map((activity) => ({
      ...activity,
      actionLabel: String(activity.action || '').replace(/_/g, ' ')
    }))
  } catch (error) {
    stats.value = {}
    activities.value = []
  }
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

onMounted(loadStats)
</script>

<style scoped>
.platform-dashboard {
  display: grid;
  gap: 1rem;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0;
  color: #172033;
  font-size: 1.35rem;
}

.page-head p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.primary-action {
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  padding: 0.7rem 1rem;
  text-decoration: none;
  font-weight: 800;
}

.metric-grid,
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}

.metric-card,
.panel,
.report-grid > div {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
}

.metric-card small,
.report-grid small {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.metric-card strong,
.report-grid strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.45rem;
}

.metric-card em,
.report-grid span {
  color: #64748b;
  font-style: normal;
  font-size: 0.78rem;
}

.metric-icon {
  width: 0.8rem;
  height: 2.8rem;
  border-radius: 999px;
}

.blue { background: #2563eb; }
.green { background: #16a34a; }
.violet { background: #7c3aed; }
.amber { background: #f59e0b; }
.rose { background: #e11d48; }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
}

.panel {
  padding: 1rem;
}

.panel.wide {
  grid-column: 1 / -1;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-head h2 {
  margin: 0;
  color: #172033;
  font-size: 1rem;
}

.panel-head span,
.panel-head button {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
}

.panel-head button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.status-bars {
  display: grid;
  gap: 1rem;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  color: #334155;
  font-size: 0.84rem;
  margin-bottom: 0.35rem;
}

.bar {
  height: 0.65rem;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
}

.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.activity-row:last-child {
  border-bottom: 0;
}

.activity-row strong {
  text-transform: capitalize;
  color: #172033;
}

.activity-row p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.activity-row time {
  color: #94a3b8;
  font-size: 0.72rem;
  white-space: nowrap;
}

.empty-state {
  padding: 1rem;
  color: #64748b;
  text-align: center;
}

.report-grid > div {
  padding: 1rem;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>

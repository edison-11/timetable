<template>
  <AppLayout>
    <main class="notifications-page">
      <header class="page-header">
        <div>
          <p>{{ isSuperAdmin ? 'Platform alerts' : 'School alerts' }}</p>
          <h1>Notifications</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="ghost-btn" :disabled="loading" @click="loadNotifications">
            <RefreshCcw :size="17" aria-hidden="true" />
            <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
          <button type="button" class="danger-btn" :disabled="!notifications.length" @click="clearNotifications">
            <Trash2 :size="17" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </header>

      <section class="summary-grid">
        <article>
          <Bell :size="21" aria-hidden="true" />
          <span>Total</span>
          <strong>{{ notifications.length }}</strong>
        </article>
        <article>
          <CircleAlert :size="21" aria-hidden="true" />
          <span>Needs Action</span>
          <strong>{{ actionCount }}</strong>
        </article>
        <article>
          <Clock3 :size="21" aria-hidden="true" />
          <span>Latest</span>
          <strong>{{ latestLabel }}</strong>
        </article>
      </section>

      <section class="notifications-panel">
        <div class="panel-toolbar">
          <div class="search-box">
            <Search :size="18" aria-hidden="true" />
            <input v-model="searchQuery" type="search" placeholder="Search notifications..." />
          </div>
          <select v-model="filter">
            <option value="all">All notifications</option>
            <option value="action">Needs action</option>
            <option value="system">System</option>
            <option value="billing">Billing</option>
            <option value="security">Security</option>
          </select>
        </div>

        <div v-if="loading" class="loading-list" role="status">
          <span v-for="item in 5" :key="item"></span>
        </div>

        <div v-else-if="!filteredNotifications.length" class="empty-state">
          <BellOff :size="34" aria-hidden="true" />
          <strong>No notifications found</strong>
          <small>New requests, approvals, and system updates will appear here.</small>
        </div>

        <div v-else class="notification-list">
          <article v-for="notification in filteredNotifications" :key="notification.id" class="notification-card">
            <span class="tone-dot" :class="notification.tone || 'blue'"></span>
            <div class="notification-copy">
              <strong>{{ notification.title }}</strong>
              <p v-if="notification.message">{{ notification.message }}</p>
              <small>{{ formatNotificationTime(notification.created_at) }}</small>
            </div>
            <div class="notification-actions">
              <button v-if="notification.action_required" type="button" class="approve-btn" @click="approvePendingItem(notification)">
                Approve
              </button>
              <button v-if="notification.action_required" type="button" class="reject-btn" @click="rejectPendingItem(notification)">
                Reject
              </button>
              <button v-if="canDelete(notification)" type="button" class="icon-btn" title="Delete" @click="deleteNotification(notification)">
                <X :size="17" aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bell, BellOff, CircleAlert, Clock3, RefreshCcw, Search, Trash2, X } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const notifications = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filter = ref('all')

const isSuperAdmin = computed(() => authStore.currentUserType === 'super_admin' || authStore.currentUser?.role === 'super_admin')
const actionCount = computed(() => notifications.value.filter(item => item.action_required).length)
const latestLabel = computed(() => notifications.value[0]?.created_at ? formatNotificationTime(notifications.value[0].created_at) : '-')

const filteredNotifications = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return notifications.value.filter((notification) => {
    const searchable = [notification.title, notification.message, notification.type, notification.tone].filter(Boolean).join(' ').toLowerCase()
    const category = String(notification.category || notification.type || notification.tone || '').toLowerCase()
    const matchesQuery = !query || searchable.includes(query)
    const matchesFilter = filter.value === 'all' ||
      (filter.value === 'action' ? notification.action_required : category.includes(filter.value))
    return matchesQuery && matchesFilter
  })
})

const formatNotificationTime = (dateValue) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const loadNotifications = async () => {
  loading.value = true
  try {
    const response = await api.get('/notifications?limit=50', { showGlobalNotification: false })
    notifications.value = response.data.notifications || []
  } finally {
    loading.value = false
  }
}

const canDelete = (notification) => /^\d+$/.test(String(notification.id))

const deleteNotification = async (notification) => {
  if (!canDelete(notification)) return
  await api.delete(`/notifications/${notification.id}`)
  notifications.value = notifications.value.filter(item => String(item.id) !== String(notification.id))
}

const clearNotifications = async () => {
  if (!notifications.value.length) return
  await api.delete('/notifications')
  notifications.value = notifications.value.filter(item => item.action_required)
}

const getPendingEndpoint = (notification, action) => {
  if (!notification?.entity_id) return ''
  if (notification.entity_type === 'school' || notification.type === 'school_pending') return `/schools/${notification.entity_id}/${action}`
  if (notification.entity_type === 'teacher' || notification.type === 'teacher_pending') {
    return action === 'approve' ? `/teachers/${notification.entity_id}/approve` : `/teachers/${notification.entity_id}/reject`
  }
  return ''
}

const approvePendingItem = async (notification) => {
  const endpoint = getPendingEndpoint(notification, 'approve')
  if (!endpoint) return
  await api.put(endpoint)
  await loadNotifications()
}

const rejectPendingItem = async (notification) => {
  const endpoint = getPendingEndpoint(notification, 'reject')
  if (!endpoint) return
  if (notification.entity_type === 'school' || notification.type === 'school_pending') {
    await api.put(endpoint)
  } else {
    await api.delete(endpoint)
  }
  await loadNotifications()
}

onMounted(loadNotifications)
</script>

<style scoped>
.notifications-page {
  display: grid;
  gap: 1rem;
}

.page-header,
.notifications-panel,
.summary-grid article {
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem;
}

.page-header p {
  margin: 0 0 0.2rem;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.7rem;
  font-weight: 900;
}

.header-actions,
.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.ghost-btn,
.danger-btn,
.approve-btn,
.reject-btn,
.icon-btn {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 38px;
  padding: 0 0.8rem;
  font-weight: 850;
}

.danger-btn,
.reject-btn {
  color: #b91c1c;
  border-color: #fecaca;
}

.approve-btn {
  color: #166534;
  border-color: #bbf7d0;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.summary-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 0.7rem;
  padding: 1rem;
}

.summary-grid svg {
  grid-row: span 2;
  color: #2563eb;
}

.summary-grid span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.summary-grid strong {
  color: #0f172a;
  font-size: 1.35rem;
}

.notifications-panel {
  padding: 1rem;
}

.panel-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
}

.search-box svg {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  color: #64748b;
  transform: translateY(-50%);
}

.search-box input,
.panel-toolbar select {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 0.8rem;
}

.search-box input {
  padding-left: 2.4rem;
}

.notification-list,
.loading-list {
  display: grid;
  gap: 0.65rem;
}

.notification-card {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem;
}

.tone-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #3b82f6;
}

.tone-dot.amber { background: #f59e0b; }
.tone-dot.green { background: #16a34a; }
.tone-dot.rose { background: #e11d48; }
.tone-dot.violet { background: #7c3aed; }

.notification-copy strong {
  display: block;
  color: #0f172a;
  font-weight: 900;
}

.notification-copy p,
.notification-copy small {
  margin: 0.15rem 0 0;
  color: #64748b;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

.empty-state strong {
  color: #0f172a;
}

.loading-list span {
  height: 64px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

:global(body.admin-dark-mode) .page-header,
:global(body.admin-dark-mode) .notifications-panel,
:global(body.admin-dark-mode) .summary-grid article,
:global(body.admin-dark-mode) .notification-card,
:global(body.admin-dark-mode) .ghost-btn,
:global(body.admin-dark-mode) .icon-btn,
:global(body.admin-dark-mode) .search-box input,
:global(body.admin-dark-mode) .panel-toolbar select {
  background: #111827;
  border-color: #263247;
  color: #e2e8f0;
}

:global(body.admin-dark-mode) .page-header h1,
:global(body.admin-dark-mode) .summary-grid strong,
:global(body.admin-dark-mode) .notification-copy strong,
:global(body.admin-dark-mode) .empty-state strong {
  color: #f8fafc;
}

@media (max-width: 760px) {
  .page-header,
  .panel-toolbar {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: stretch;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .notification-card {
    grid-template-columns: 10px 1fr;
  }

  .notification-actions {
    grid-column: 2;
  }
}
</style>

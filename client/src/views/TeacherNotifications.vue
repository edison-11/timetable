<template>
  <TeacherLayout>
    <div class="teacher-notifications-page">
      <section class="notifications-hero">
        <div>
          <span class="eyebrow">Teacher Notifications</span>
          <h1>Notification Panel</h1>
          <p>Timetable changes, school updates, and important alerts in one place.</p>
        </div>
        <div class="hero-actions">
          <button class="secondary-action" type="button" :disabled="loading" @click="loadNotifications">
            <RefreshCw :size="17" :stroke-width="2.2" aria-hidden="true" />
            Refresh
          </button>
          <button class="primary-action" type="button" :disabled="!notifications.length" @click="markAllRead">
            <CheckCheck :size="17" :stroke-width="2.2" aria-hidden="true" />
            Mark read
          </button>
        </div>
      </section>

      <section class="summary-grid" aria-label="Notification summary">
        <article>
          <Bell :size="20" :stroke-width="2.2" aria-hidden="true" />
          <strong>{{ notifications.length }}</strong>
          <span>Total</span>
        </article>
        <article>
          <Inbox :size="20" :stroke-width="2.2" aria-hidden="true" />
          <strong>{{ unreadCount }}</strong>
          <span>Unread</span>
        </article>
        <article>
          <CalendarDays :size="20" :stroke-width="2.2" aria-hidden="true" />
          <strong>{{ timetableCount }}</strong>
          <span>Timetable</span>
        </article>
      </section>

      <div class="notifications-layout">
        <section class="notifications-list-panel">
          <div class="panel-header">
            <div>
              <span>Inbox</span>
              <h2>Latest Alerts</h2>
            </div>
          </div>

          <div v-if="loading" class="loading-list">
            <span v-for="item in 5" :key="item"></span>
          </div>

          <div v-else-if="!notifications.length" class="empty-panel">
            <Inbox :size="28" :stroke-width="2.1" aria-hidden="true" />
            <strong>No notifications yet</strong>
            <span>New timetable and school updates will appear here.</span>
          </div>

          <button
            v-for="notification in notifications"
            v-else
            :key="notification.id"
            type="button"
            class="notification-card"
            :class="{ active: String(selectedId) === String(notification.id), unread: !notification.read_at }"
            @click="selectNotification(notification)"
          >
            <span class="tone-dot" :class="notification.tone || 'blue'"></span>
            <div>
              <strong>{{ notification.title || 'Notification' }}</strong>
              <span>{{ notification.message || 'No message provided.' }}</span>
              <small>{{ formatTime(notification.created_at) }}</small>
            </div>
          </button>
        </section>

        <section class="notification-detail-panel">
          <div v-if="selectedNotification" class="detail-card">
            <div class="detail-head">
              <span class="detail-icon" :class="selectedNotification.tone || 'blue'">
                <Bell :size="22" :stroke-width="2.2" aria-hidden="true" />
              </span>
              <div>
                <span>{{ selectedNotification.type || 'Update' }}</span>
                <h2>{{ selectedNotification.title }}</h2>
                <small>{{ formatFullDate(selectedNotification.created_at) }}</small>
              </div>
            </div>

            <p>{{ selectedNotification.message || 'No extra details are available for this notification.' }}</p>

            <div class="detail-actions">
              <button class="primary-action" type="button" @click="openRelatedPage(selectedNotification)">
                <ExternalLink :size="17" :stroke-width="2.2" aria-hidden="true" />
                Open related page
              </button>
              <button class="secondary-action" type="button" @click="archiveNotification(selectedNotification)">
                <Archive :size="17" :stroke-width="2.2" aria-hidden="true" />
                Archive
              </button>
              <button
                v-if="canDelete(selectedNotification)"
                class="secondary-action"
                type="button"
                @click="deleteNotification(selectedNotification)"
              >
                <Trash2 :size="17" :stroke-width="2.2" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>

          <div v-else class="empty-panel detail-empty">
            <Bell :size="32" :stroke-width="2.1" aria-hidden="true" />
            <strong>Select a notification</strong>
            <span>Click any alert from the list to view its details here.</span>
          </div>
        </section>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeacherLayout from '@/components/TeacherLayout.vue'
import api from '@/stores/api'
import {
  Archive,
  Bell,
  CalendarDays,
  CheckCheck,
  ExternalLink,
  Inbox,
  RefreshCw,
  Trash2
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const notifications = ref([])
const selectedId = ref(route.query.selected || null)
const loading = ref(false)

const selectedNotification = computed(() => {
  if (!notifications.value.length) return null
  return notifications.value.find((notification) => String(notification.id) === String(selectedId.value)) || notifications.value[0]
})

const unreadCount = computed(() => notifications.value.filter((notification) => !notification.read_at).length)
const timetableCount = computed(() => notifications.value.filter((notification) => {
  const text = `${notification.type || ''} ${notification.title || ''} ${notification.message || ''}`.toLowerCase()
  return text.includes('timetable') || text.includes('schedule')
}).length)

const normalizeNotification = (notification) => ({
  id: notification.id || notification.notification_id,
  type: notification.type || 'notification',
  title: notification.title || 'Notification',
  message: notification.message || '',
  path: notification.path || '/teacher/dashboard',
  tone: notification.tone || 'blue',
  created_at: notification.created_at,
  read_at: notification.read_at || null,
  action_required: Boolean(notification.action_required)
})

const loadNotifications = async () => {
  loading.value = true
  try {
    const response = await api.get('/notifications?limit=50', {
      showGlobalLoader: false,
      showGlobalNotification: false
    })
    notifications.value = (response.data.notifications || []).map(normalizeNotification)
    if (!selectedId.value && notifications.value.length) selectedId.value = notifications.value[0].id
  } catch (error) {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const canDelete = (notification) => Number.isFinite(Number(notification?.id))

const markReadOnServer = async (notification) => {
  if (!canDelete(notification)) return
  try {
    await api.put(`/notifications/${notification.id}/read`, null, {
      showGlobalLoader: false,
      showGlobalNotification: false
    })
  } catch (error) {
    // Keep the interface responsive even if the read receipt fails.
  }
}

const selectNotification = async (notification) => {
  selectedId.value = notification.id
  router.replace({ path: '/teacher/notifications', query: { selected: notification.id } })
  if (!notification.read_at) {
    notification.read_at = new Date().toISOString()
    await markReadOnServer(notification)
  }
}

const markAllRead = async () => {
  notifications.value = notifications.value.map((notification) => ({
    ...notification,
    read_at: notification.read_at || new Date().toISOString()
  }))
  try {
    await api.put('/notifications/read/all', null, {
      showGlobalLoader: false,
      showGlobalNotification: false
    })
  } catch (error) {
    // Local state remains marked read for the current session.
  }
}

const archiveNotification = async (notification) => {
  if (!canDelete(notification)) return
  try {
    await api.put(`/notifications/${notification.id}/archive`, null, {
      showGlobalLoader: false,
      showGlobalNotification: false
    })
    notifications.value = notifications.value.filter((item) => String(item.id) !== String(notification.id))
    selectedId.value = notifications.value[0]?.id || null
  } catch (error) {
    // Leave the item visible if the server did not archive it.
  }
}

const deleteNotification = async (notification) => {
  if (!canDelete(notification)) return
  try {
    await api.delete(`/notifications/${notification.id}`, {
      showGlobalLoader: false,
      showGlobalNotification: false
    })
    notifications.value = notifications.value.filter((item) => String(item.id) !== String(notification.id))
    selectedId.value = notifications.value[0]?.id || null
  } catch (error) {
    // Leave the item visible if delete fails.
  }
}

const openRelatedPage = (notification) => {
  router.push(notification.path || '/teacher/dashboard')
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (Number.isNaN(diff)) return ''
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

const formatFullDate = (timestamp) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(() => route.query.selected, (value) => {
  if (value) selectedId.value = value
})

onMounted(loadNotifications)
</script>

<style scoped>
.teacher-notifications-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
  color: #0f172a;
}

.notifications-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.notifications-hero h1,
.panel-header h2,
.detail-head h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 850;
}

.notifications-hero p {
  margin: 0.35rem 0 0;
  color: #52627a;
}

.hero-actions,
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 850;
}

.primary-action {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.secondary-action {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
}

.primary-action:disabled,
.secondary-action:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1rem 0;
}

.summary-grid article,
.notifications-list-panel,
.notification-detail-panel {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.summary-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.3rem 0.75rem;
  padding: 1rem;
}

.summary-grid svg {
  grid-row: span 2;
  color: #2563eb;
}

.summary-grid strong {
  color: #0f172a;
  font-size: 1.35rem;
  line-height: 1;
}

.summary-grid span,
.panel-header span,
.detail-head span,
.detail-head small {
  color: #64748b;
  font-weight: 750;
}

.notifications-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.35fr);
  gap: 1rem;
  align-items: start;
}

.notifications-list-panel,
.notification-detail-panel {
  padding: 1rem;
}

.panel-header {
  margin-bottom: 0.85rem;
}

.notification-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.6rem;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
}

.notification-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.notification-card.unread::after {
  content: '';
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #2563eb;
}

.notification-card strong,
.notification-card span,
.notification-card small {
  display: block;
}

.notification-card strong {
  padding-right: 1rem;
  color: #0f172a;
  font-weight: 850;
}

.notification-card span {
  margin-top: 0.25rem;
  color: #475569;
  font-size: 0.84rem;
}

.notification-card small {
  margin-top: 0.35rem;
  color: #64748b;
  font-weight: 700;
}

.tone-dot {
  width: 0.7rem;
  height: 0.7rem;
  margin-top: 0.34rem;
  border-radius: 999px;
  background: #2563eb;
}

.tone-dot.green { background: #16a34a; }
.tone-dot.amber { background: #d97706; }
.tone-dot.purple { background: #7c3aed; }
.tone-dot.red { background: #2563eb; }

.detail-card {
  display: grid;
  gap: 1rem;
}

.detail-head {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.detail-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: #dbeafe;
  color: #1d4ed8;
}

.detail-card p {
  margin: 0;
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  line-height: 1.65;
}

.empty-panel {
  display: grid;
  place-items: center;
  gap: 0.5rem;
  min-height: 15rem;
  padding: 1rem;
  color: #64748b;
  text-align: center;
}

.empty-panel strong {
  color: #0f172a;
}

.loading-list {
  display: grid;
  gap: 0.7rem;
}

.loading-list span {
  height: 72px;
  border-radius: 8px;
  background: linear-gradient(90deg, #edf2f7 25%, #f8fafc 45%, #edf2f7 65%);
  background-size: 220% 100%;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  to { background-position: -220% 0; }
}

@media (max-width: 900px) {
  .notifications-hero,
  .detail-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid,
  .notifications-layout {
    grid-template-columns: 1fr;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
  }
}

:global(body.teacher-dark-mode) .teacher-notifications-page {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%) !important;
  color: #e5edf7 !important;
}

:global(.teacher-shell.dark-mode) .teacher-notifications-page {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .notifications-hero,
:global(body.teacher-dark-mode) .summary-grid article,
:global(body.teacher-dark-mode) .notifications-list-panel,
:global(body.teacher-dark-mode) .notification-detail-panel,
:global(body.teacher-dark-mode) .notification-card,
:global(body.teacher-dark-mode) .detail-card p,
:global(body.teacher-dark-mode) .empty-panel,
:global(.teacher-shell.dark-mode) .notifications-hero,
:global(.teacher-shell.dark-mode) .summary-grid article,
:global(.teacher-shell.dark-mode) .notifications-list-panel,
:global(.teacher-shell.dark-mode) .notification-detail-panel,
:global(.teacher-shell.dark-mode) .notification-card,
:global(.teacher-shell.dark-mode) .detail-card p,
:global(.teacher-shell.dark-mode) .empty-panel {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .notifications-hero h1,
:global(body.teacher-dark-mode) .panel-header h2,
:global(body.teacher-dark-mode) .detail-head h2,
:global(body.teacher-dark-mode) .summary-grid strong,
:global(body.teacher-dark-mode) .notification-card strong,
:global(body.teacher-dark-mode) .empty-panel strong,
:global(.teacher-shell.dark-mode) .notifications-hero h1,
:global(.teacher-shell.dark-mode) .panel-header h2,
:global(.teacher-shell.dark-mode) .detail-head h2,
:global(.teacher-shell.dark-mode) .summary-grid strong,
:global(.teacher-shell.dark-mode) .notification-card strong,
:global(.teacher-shell.dark-mode) .empty-panel strong {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .notifications-hero p,
:global(body.teacher-dark-mode) .summary-grid span,
:global(body.teacher-dark-mode) .panel-header span,
:global(body.teacher-dark-mode) .detail-head span,
:global(body.teacher-dark-mode) .detail-head small,
:global(body.teacher-dark-mode) .notification-card span,
:global(body.teacher-dark-mode) .notification-card small,
:global(body.teacher-dark-mode) .detail-card p,
:global(body.teacher-dark-mode) .empty-panel span,
:global(.teacher-shell.dark-mode) .notifications-hero p,
:global(.teacher-shell.dark-mode) .summary-grid span,
:global(.teacher-shell.dark-mode) .panel-header span,
:global(.teacher-shell.dark-mode) .detail-head span,
:global(.teacher-shell.dark-mode) .detail-head small,
:global(.teacher-shell.dark-mode) .notification-card span,
:global(.teacher-shell.dark-mode) .notification-card small,
:global(.teacher-shell.dark-mode) .detail-card p,
:global(.teacher-shell.dark-mode) .empty-panel span {
  color: #cbd5e1 !important;
}

:global(body.teacher-dark-mode) .teacher-notifications-page *,
:global(.teacher-shell.dark-mode) .teacher-notifications-page * {
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .notification-card.active,
:global(.teacher-shell.dark-mode) .notification-card.active {
  border-color: #60a5fa !important;
  background: rgba(37, 99, 235, 0.18) !important;
}

:global(body.teacher-dark-mode) .secondary-action,
:global(body.teacher-dark-mode) .detail-icon,
:global(.teacher-shell.dark-mode) .secondary-action,
:global(.teacher-shell.dark-mode) .detail-icon {
  border-color: #334155 !important;
  background: #111827 !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .loading-list span,
:global(.teacher-shell.dark-mode) .loading-list span {
  background: linear-gradient(90deg, #111827 25%, #1e293b 45%, #111827 65%) !important;
  background-size: 220% 100% !important;
}
</style>

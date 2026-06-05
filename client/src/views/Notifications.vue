<template>
  <AppLayout>
    <main class="notifications-page">
      <header class="page-header">
        <div>
          <p>{{ isSuperAdmin ? 'Platform alerts' : 'School alerts' }}</p>
          <h1>Notifications</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="ghost-btn" @click="loadMessages">
            <MessageSquare :size="17" aria-hidden="true" />
            <span>{{ isSuperAdmin ? 'Message inbox' : 'Admin messages' }}</span>
          </button>
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

      <section class="messages-panel">
        <div class="panel-head">
          <div>
            <h2>{{ isSuperAdmin ? 'Admin Message Inbox' : 'Message Super Admin' }}</h2>
            <small>{{ isSuperAdmin ? 'Reply to messages from school administrators.' : 'Send a question or issue directly to Super Admin.' }}</small>
          </div>
          <button type="button" class="ghost-btn" :disabled="messagesLoading" @click="loadMessages">
            <RefreshCcw :size="16" aria-hidden="true" />
            <span>{{ messagesLoading ? 'Loading...' : 'Reload' }}</span>
          </button>
          <button type="button" class="danger-btn" :disabled="!seenMessagesCount || deletingSeen" @click="deleteSeenMessages">
            <Trash2 :size="16" aria-hidden="true" />
            <span>{{ deletingSeen ? 'Deleting...' : 'Delete seen' }}</span>
          </button>
        </div>

        <form v-if="!isSuperAdmin" class="message-form" @submit.prevent="sendMessage">
          <label>
            <span>Subject</span>
            <input v-model.trim="messageForm.subject" type="text" required placeholder="Example: Timetable generation issue">
          </label>
          <label>
            <span>Message</span>
            <textarea v-model.trim="messageForm.message" rows="4" required placeholder="Write what you need help with..."></textarea>
          </label>
          <div class="form-actions">
            <span v-if="messageStatus" :class="messageStatusType">{{ messageStatus }}</span>
            <button type="submit" :disabled="sendingMessage">{{ sendingMessage ? 'Sending...' : 'Send to Super Admin' }}</button>
          </div>
        </form>

        <div v-if="messagesLoading" class="loading-list">
          <span v-for="item in 3" :key="`message-loading-${item}`"></span>
        </div>
        <div v-else-if="!messages.length" class="empty-state compact">
          <MessageSquare :size="30" aria-hidden="true" />
          <strong>No admin messages yet</strong>
          <small>{{ isSuperAdmin ? 'School admin messages will appear here.' : 'Your sent messages and replies will appear here.' }}</small>
        </div>
        <div v-else class="messages-layout">
          <div class="thread-list">
            <button
              v-for="thread in messages"
              :key="thread.message_id"
              type="button"
              :class="{ active: selectedMessageId === thread.message_id }"
              @click="selectThread(thread)"
            >
              <span v-if="!isThreadSeen(thread)" class="unseen-dot" aria-label="Unseen message"></span>
              <strong>{{ thread.subject }}</strong>
              <span>{{ thread.sender_name || 'Admin' }} - {{ thread.reply_count || 0 }} replies</span>
              <small>{{ formatNotificationTime(thread.last_activity_at || thread.created_at) }}</small>
            </button>
          </div>
          <article v-if="selectedThread" class="thread-detail">
            <header class="thread-header">
              <div>
                <span :class="['thread-status', selectedThread.status]">{{ selectedThread.status }}</span>
                <span v-if="selectedThreadSeen" class="seen-pill">
                  <CheckCheck :size="14" aria-hidden="true" />
                  Seen
                </span>
                <h3>{{ selectedThread.subject }}</h3>
                <small>{{ selectedThread.sender_name || 'Admin' }} - {{ formatNotificationTime(selectedThread.created_at) }}</small>
              </div>
              <button type="button" class="icon-btn danger-icon" :disabled="!selectedThreadSeen || deletingThread" title="Delete seen message" @click="deleteSelectedThread">
                <Trash2 :size="17" aria-hidden="true" />
              </button>
            </header>
            <div class="chat-body">
              <div class="message-bubble" :class="{ mine: isMine(selectedThread) }">
                <strong>{{ selectedThread.sender_name || 'Admin' }}</strong>
                <p>{{ selectedThread.message }}</p>
                <small>{{ formatNotificationTime(selectedThread.created_at) }}</small>
              </div>
              <div v-for="reply in selectedThread.replies || []" :key="reply.message_id" class="message-bubble" :class="{ mine: isMine(reply) }">
                <strong>{{ reply.sender_name || reply.sender_role || 'Admin' }}</strong>
                <p>{{ reply.message }}</p>
                <small>{{ formatNotificationTime(reply.created_at) }}</small>
              </div>
            </div>
            <form class="reply-form" @submit.prevent="sendReply">
              <textarea v-model.trim="replyMessage" rows="3" required placeholder="Write a reply..."></textarea>
              <button type="submit" :disabled="sendingReply">{{ sendingReply ? 'Replying...' : 'Reply' }}</button>
            </form>
          </article>
        </div>
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
import { Bell, BellOff, CheckCheck, CircleAlert, Clock3, MessageSquare, RefreshCcw, Search, Trash2, X } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const notifications = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filter = ref('all')
const messages = ref([])
const messagesLoading = ref(false)
const selectedMessageId = ref(null)
const selectedThread = ref(null)
const sendingMessage = ref(false)
const sendingReply = ref(false)
const deletingSeen = ref(false)
const deletingThread = ref(false)
const replyMessage = ref('')
const messageStatus = ref('')
const messageStatusType = ref('success')
const messageForm = ref({ subject: '', message: '' })

const isSuperAdmin = computed(() => authStore.currentUserType === 'super_admin' || authStore.currentUser?.role === 'super_admin')
const actionCount = computed(() => notifications.value.filter(item => item.action_required).length)
const latestLabel = computed(() => notifications.value[0]?.created_at ? formatNotificationTime(notifications.value[0].created_at) : '-')
const seenMessagesCount = computed(() => messages.value.filter(isThreadSeen).length)
const selectedThreadSeen = computed(() => selectedThread.value ? isThreadSeen(selectedThread.value) : false)

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

const loadMessages = async () => {
  messagesLoading.value = true
  try {
    const response = await api.get('/admin-messages', { showGlobalNotification: false })
    messages.value = response.data.messages || []
    if (!selectedMessageId.value && messages.value.length) {
      await selectThread(messages.value[0])
    } else if (selectedMessageId.value) {
      const selected = messages.value.find(item => Number(item.message_id) === Number(selectedMessageId.value))
      if (selected) await selectThread(selected)
    }
  } finally {
    messagesLoading.value = false
  }
}

const selectThread = async (thread) => {
  selectedMessageId.value = thread.message_id
  const response = await api.get(`/admin-messages/${thread.message_id}`, { showGlobalNotification: false })
  selectedThread.value = response.data.thread
  const seenResponse = await api.put(`/admin-messages/${thread.message_id}/seen`, null, { showGlobalNotification: false })
  selectedThread.value = seenResponse.data.thread || selectedThread.value
  messages.value = messages.value.map(item => Number(item.message_id) === Number(thread.message_id)
    ? { ...item, ...selectedThread.value }
    : item)
  replyMessage.value = ''
}

const isThreadSeen = (thread) => {
  if (!thread) return false
  return isSuperAdmin.value ? Boolean(thread.seen_by_super_admin_at) : Boolean(thread.seen_by_school_at)
}

const isMine = (message) => {
  if (!message) return false
  return isSuperAdmin.value ? message.sender_role === 'super_admin' : message.sender_role !== 'super_admin'
}

const sendMessage = async () => {
  sendingMessage.value = true
  messageStatus.value = ''
  try {
    const response = await api.post('/admin-messages', messageForm.value, { showGlobalNotification: false })
    messageForm.value = { subject: '', message: '' }
    messageStatus.value = response.data.message || 'Message sent.'
    messageStatusType.value = 'success'
    await loadMessages()
  } catch (error) {
    messageStatus.value = error.response?.data?.message || 'Could not send message.'
    messageStatusType.value = 'error'
  } finally {
    sendingMessage.value = false
  }
}

const sendReply = async () => {
  if (!selectedThread.value) return
  sendingReply.value = true
  try {
    await api.post(`/admin-messages/${selectedThread.value.message_id}/replies`, {
      message: replyMessage.value
    }, { showGlobalNotification: false })
    await loadMessages()
  } finally {
    sendingReply.value = false
  }
}

const deleteSelectedThread = async () => {
  if (!selectedThread.value || !selectedThreadSeen.value) return
  deletingThread.value = true
  try {
    const removedId = selectedThread.value.message_id
    await api.delete(`/admin-messages/${removedId}`, { showGlobalNotification: false })
    messages.value = messages.value.filter(item => Number(item.message_id) !== Number(removedId))
    selectedThread.value = null
    selectedMessageId.value = null
    if (messages.value.length) await selectThread(messages.value[0])
  } finally {
    deletingThread.value = false
  }
}

const deleteSeenMessages = async () => {
  if (!seenMessagesCount.value) return
  deletingSeen.value = true
  try {
    const selectedWasSeen = selectedThreadSeen.value
    await api.delete('/admin-messages/seen/all', { showGlobalNotification: false })
    messages.value = messages.value.filter(item => !isThreadSeen(item))
    if (selectedWasSeen) {
      selectedThread.value = null
      selectedMessageId.value = null
    }
    if (!selectedThread.value && messages.value.length) await selectThread(messages.value[0])
  } finally {
    deletingSeen.value = false
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

onMounted(() => {
  loadNotifications()
  loadMessages()
})
</script>

<style scoped>
.notifications-page {
  display: grid;
  gap: 1rem;
}

.page-header,
.notifications-panel,
.messages-panel,
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

.messages-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.panel-head h2,
.thread-detail h3 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

.panel-head small,
.thread-detail small,
.thread-list span,
.thread-list small,
.message-bubble small {
  color: #64748b;
}

.message-form,
.reply-form {
  display: grid;
  gap: 0.75rem;
}

.message-form label {
  display: grid;
  gap: 0.35rem;
  color: #0f172a;
  font-weight: 850;
}

.message-form input,
.message-form textarea,
.reply-form textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0.7rem 0.8rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.form-actions span {
  margin-right: auto;
  font-weight: 850;
}

.success { color: #15803d; }
.error { color: #b91c1c; }

.form-actions button,
.reply-form button {
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
  padding: 0 0.9rem;
  font-weight: 850;
}

.messages-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1rem;
}

.thread-list {
  display: grid;
  align-content: start;
  gap: 0.55rem;
}

.thread-list button {
  position: relative;
  display: grid;
  gap: 0.18rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  cursor: pointer;
  padding: 0.75rem;
  text-align: left;
}

.unseen-dot {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.thread-list button.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.thread-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.thread-detail {
  display: grid;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.thread-status {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: capitalize;
}

.thread-status.replied {
  background: #dcfce7;
  color: #15803d;
}

.seen-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.35rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.danger-icon {
  color: #b91c1c;
  border-color: #fecaca;
}

.chat-body {
  display: grid;
  gap: 0.65rem;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.message-bubble {
  width: min(82%, 620px);
  display: grid;
  gap: 0.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 0.75rem;
}

.message-bubble.mine {
  justify-self: end;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.message-bubble p {
  margin: 0;
  color: #334155;
}

.empty-state.compact {
  padding: 1.5rem 1rem;
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

:global(body:is(.admin-dark-mode, .dark)) .notifications-page,
:global(body:is(.admin-dark-mode, .dark)) .page-header,
:global(body:is(.admin-dark-mode, .dark)) .notifications-panel,
:global(body:is(.admin-dark-mode, .dark)) .messages-panel,
:global(body:is(.admin-dark-mode, .dark)) .summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .notification-card,
:global(body:is(.admin-dark-mode, .dark)) .thread-list button,
:global(body:is(.admin-dark-mode, .dark)) .thread-detail,
:global(body:is(.admin-dark-mode, .dark)) .message-bubble,
:global(body:is(.admin-dark-mode, .dark)) .ghost-btn,
:global(body:is(.admin-dark-mode, .dark)) .message-form input,
:global(body:is(.admin-dark-mode, .dark)) .message-form textarea,
:global(body:is(.admin-dark-mode, .dark)) .reply-form textarea,
:global(body:is(.admin-dark-mode, .dark)) .icon-btn,
:global(body:is(.admin-dark-mode, .dark)) .search-box input,
:global(body:is(.admin-dark-mode, .dark)) .panel-toolbar select {
  background: #111827 !important;
  border-color: #263247 !important;
  color: #e5edf7 !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .thread-list button.active,
:global(body:is(.admin-dark-mode, .dark)) .message-bubble.mine {
  background: #172554 !important;
  border-color: #1d4ed8 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .page-header h1,
:global(body:is(.admin-dark-mode, .dark)) .panel-head h2,
:global(body:is(.admin-dark-mode, .dark)) .thread-detail h3,
:global(body:is(.admin-dark-mode, .dark)) .message-form label,
:global(body:is(.admin-dark-mode, .dark)) .summary-grid strong,
:global(body:is(.admin-dark-mode, .dark)) .thread-list strong,
:global(body:is(.admin-dark-mode, .dark)) .message-bubble strong,
:global(body:is(.admin-dark-mode, .dark)) .notification-copy strong,
:global(body:is(.admin-dark-mode, .dark)) .empty-state strong {
  color: #f8fafc !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .page-header p,
:global(body:is(.admin-dark-mode, .dark)) .panel-head small,
:global(body:is(.admin-dark-mode, .dark)) .summary-grid span,
:global(body:is(.admin-dark-mode, .dark)) .thread-detail small,
:global(body:is(.admin-dark-mode, .dark)) .thread-list span,
:global(body:is(.admin-dark-mode, .dark)) .thread-list small,
:global(body:is(.admin-dark-mode, .dark)) .message-bubble p,
:global(body:is(.admin-dark-mode, .dark)) .message-bubble small,
:global(body:is(.admin-dark-mode, .dark)) .notification-copy p,
:global(body:is(.admin-dark-mode, .dark)) .notification-copy small,
:global(body:is(.admin-dark-mode, .dark)) .empty-state,
:global(body:is(.admin-dark-mode, .dark)) .empty-state small {
  color: #cbd5e1 !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .search-box input::placeholder,
:global(body:is(.admin-dark-mode, .dark)) .message-form input::placeholder,
:global(body:is(.admin-dark-mode, .dark)) .message-form textarea::placeholder,
:global(body:is(.admin-dark-mode, .dark)) .reply-form textarea::placeholder {
  color: #94a3b8 !important;
}

@media (max-width: 760px) {
  .page-header,
  .panel-head,
  .panel-toolbar {
    grid-template-columns: 1fr;
    flex-direction: column;
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

  .messages-layout {
    grid-template-columns: 1fr;
  }
}
</style>

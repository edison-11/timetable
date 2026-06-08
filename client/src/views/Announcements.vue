<template>
  <AppLayout>
    <main class="announcements-page">
      <header class="page-header">
        <div>
          <p>{{ isSuperAdmin ? 'Platform broadcast center' : 'School announcement board' }}</p>
          <h1>Announcements</h1>
        </div>
        <button type="button" class="ghost-btn" :disabled="loading" @click="loadAnnouncements">
          <RefreshCcw :size="17" aria-hidden="true" />
          <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </header>

      <section class="summary-grid">
        <article>
          <Megaphone :size="22" aria-hidden="true" />
          <span>Total</span>
          <strong>{{ announcements.length }}</strong>
        </article>
        <article>
          <CircleAlert :size="22" aria-hidden="true" />
          <span>Urgent</span>
          <strong>{{ urgentCount }}</strong>
        </article>
        <article>
          <Clock3 :size="22" aria-hidden="true" />
          <span>Latest</span>
          <strong>{{ latestLabel }}</strong>
        </article>
      </section>

      <section v-if="isSuperAdmin" class="composer-panel">
        <div class="panel-head">
          <h2>Send Announcement</h2>
          <small>Broadcast platform updates to schools.</small>
        </div>
        <form class="announcement-form" @submit.prevent="sendAnnouncement">
          <label>
            <span>Title</span>
            <input v-model.trim="form.title" type="text" required placeholder="Example: Maintenance window">
          </label>
          <label>
            <span>Priority</span>
            <select v-model="form.priority">
              <option>Normal</option>
              <option>Important</option>
              <option>Urgent</option>
            </select>
          </label>
          <label class="wide">
            <span>Message</span>
            <textarea v-model.trim="form.message" rows="5" required placeholder="Write the announcement schools should see..."></textarea>
          </label>
          <div class="form-actions wide">
            <span v-if="formMessage" :class="formMessageType">{{ formMessage }}</span>
            <button type="submit" :disabled="sending">{{ sending ? 'Sending...' : 'Send to all schools' }}</button>
          </div>
        </form>
      </section>

      <section class="announcements-panel">
        <div class="panel-toolbar">
          <div class="search-box">
            <Search :size="18" aria-hidden="true" />
            <input v-model="searchQuery" type="search" placeholder="Search announcements..." />
          </div>
          <select v-model="priorityFilter">
            <option value="">All priorities</option>
            <option>Normal</option>
            <option>Important</option>
            <option>Urgent</option>
          </select>
        </div>

        <div v-if="loading" class="loading-list">
          <span v-for="item in 5" :key="item"></span>
        </div>

        <div v-else-if="!filteredAnnouncements.length" class="empty-state">
          <Inbox :size="36" aria-hidden="true" />
          <strong>No announcements found</strong>
          <small>Announcements sent by Super Admin will appear here.</small>
        </div>

        <div v-else class="announcement-list">
          <article
            v-for="announcement in filteredAnnouncements"
            :key="announcement.announcement_id"
            class="announcement-card"
            :class="String(announcement.priority || 'Normal').toLowerCase()"
          >
            <div>
              <span class="priority">{{ announcement.priority || 'Normal' }}</span>
              <h2>{{ announcement.title }}</h2>
              <small>{{ formatDate(announcement.created_at) }} · {{ announcement.target_count || 0 }} school{{ Number(announcement.target_count || 0) === 1 ? '' : 's' }}</small>
            </div>
            <p>{{ announcement.message }}</p>
          </article>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { CircleAlert, Clock3, Inbox, Megaphone, RefreshCcw, Search } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const announcements = ref([])
const loading = ref(false)
const sending = ref(false)
const searchQuery = ref('')
const priorityFilter = ref('')
const formMessage = ref('')
const formMessageType = ref('success')
const form = ref({ title: '', priority: 'Normal', message: '' })

const isSuperAdmin = computed(() => authStore.currentUserType === 'super_admin' || authStore.currentUser?.role === 'super_admin')
const urgentCount = computed(() => announcements.value.filter(item => item.priority === 'Urgent').length)
const latestLabel = computed(() => announcements.value[0]?.created_at ? formatRelative(announcements.value[0].created_at) : '-')

const filteredAnnouncements = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return announcements.value.filter((announcement) => {
    const searchable = [announcement.title, announcement.message, announcement.priority].filter(Boolean).join(' ').toLowerCase()
    return (!query || searchable.includes(query)) &&
      (!priorityFilter.value || announcement.priority === priorityFilter.value)
  })
})

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const response = await api.get('/announcements?limit=100', { showGlobalNotification: false })
    announcements.value = response.data.announcements || []
  } finally {
    loading.value = false
  }
}

const sendAnnouncement = async () => {
  sending.value = true
  formMessage.value = ''
  try {
    const response = await api.post('/announcements', {
      ...form.value,
      target_school_ids: []
    }, { showGlobalNotification: false })
    announcements.value = [response.data.announcement, ...announcements.value].filter(Boolean)
    form.value = { title: '', priority: 'Normal', message: '' }
    formMessage.value = response.data.message || 'Announcement sent.'
    formMessageType.value = 'success'
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Could not send announcement.'
    formMessageType.value = 'error'
  } finally {
    sending.value = false
  }
}

const formatDate = (value) => {
  if (!value) return 'Unknown date'
  return new Date(value).toLocaleString()
}

const formatRelative = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const minutes = Math.floor(Math.max(Date.now() - date.getTime(), 0) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

onMounted(loadAnnouncements)
</script>

<style scoped>
.announcements-page {
  display: grid;
  gap: 1rem;
}

.page-header,
.summary-grid article,
.composer-panel,
.announcements-panel,
.announcement-card {
  background: #ffffff;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1.2rem;
}

.page-header p {
  margin: 0 0 0.2rem;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

.ghost-btn,
.form-actions button {
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0 0.85rem;
  font-weight: 850;
}

.form-actions button {
  border: 0;
  background: #2563eb;
  color: #ffffff;
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

.summary-grid span,
.panel-head small,
.announcement-card small,
.announcement-card p {
  color: #64748b;
}

.summary-grid strong {
  color: #0f172a;
  font-size: 1.35rem;
}

.composer-panel,
.announcements-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.announcement-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 0.8rem;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #0f172a;
  font-weight: 850;
}

.wide {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 0.8rem;
}

textarea {
  padding-top: 0.75rem;
  resize: vertical;
}

.form-actions,
.panel-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.success { color: #15803d; }
.error { color: #b91c1c; }

.panel-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
}

.search-box {
  position: relative;
}

.search-box svg {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  color: #64748b;
  transform: translateY(-50%);
}

.search-box input {
  padding-left: 2.5rem;
}

.announcement-list,
.loading-list {
  display: grid;
  gap: 0.75rem;
}

.announcement-card {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.priority {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.22rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 900;
}

.announcement-card.important .priority {
  background: #fef3c7;
  color: #b45309;
}

.announcement-card.urgent .priority {
  background: #fee2e2;
  color: #b91c1c;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

.loading-list span {
  height: 78px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

:global(body:is(.admin-dark-mode, .dark)) .page-header,
:global(body:is(.admin-dark-mode, .dark)) .summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .composer-panel,
:global(body:is(.admin-dark-mode, .dark)) .announcements-panel,
:global(body:is(.admin-dark-mode, .dark)) .announcement-card,
:global(body:is(.admin-dark-mode, .dark)) .ghost-btn,
:global(body:is(.admin-dark-mode, .dark)) input,
:global(body:is(.admin-dark-mode, .dark)) select,
:global(body:is(.admin-dark-mode, .dark)) textarea {
  background: #111827;
  border-color: #263247;
  color: #e2e8f0;
}

:global(body:is(.admin-dark-mode, .dark)) h1,
:global(body:is(.admin-dark-mode, .dark)) h2,
:global(body:is(.admin-dark-mode, .dark)) label,
:global(body:is(.admin-dark-mode, .dark)) .summary-grid strong {
  color: #f8fafc;
}

:global(body:is(.admin-dark-mode, .dark)) .announcements-page .page-header,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page .summary-grid article,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page .composer-panel,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page .announcements-panel,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page .announcement-card {
  background: #111827 !important;
  border-color: #243244 !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body:is(.admin-dark-mode, .dark)) .announcements-page h1,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page h2,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page strong,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page label {
  color: #f8fafc !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .announcements-page p,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page span:not(.priority),
:global(body:is(.admin-dark-mode, .dark)) .announcements-page small {
  color: #cbd5e1 !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

:global(body:is(.admin-dark-mode, .dark)) .announcements-page input,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page select,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page textarea {
  background: #0b1220 !important;
  border-color: #334155 !important;
  color: #e5edf7 !important;
}

:global(body:is(.admin-dark-mode, .dark)) .announcements-page input::placeholder,
:global(body:is(.admin-dark-mode, .dark)) .announcements-page textarea::placeholder {
  color: #94a3b8 !important;
}

@media (max-width: 760px) {
  .page-header,
  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid,
  .announcement-form,
  .panel-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <TeacherLayout>
    <div class="announcements-container">
      <!-- Header -->
      <div class="page-header">
        <h1>Announcements</h1>
        <p>Stay updated with important school announcements and news</p>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-text">Total Announcements</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ stats.unread }}</span>
          <span class="stat-text">Unread</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ stats.starred }}</span>
          <span class="stat-text">Starred</span>
        </div>
      </div>

      <!-- Filters and Controls -->
      <div class="controls-bar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input v-model="searchQuery" type="text" placeholder="Search announcements..." />
        </div>

        <div class="filter-group">
          <select v-model="filterType">
            <option value="">All Types</option>
            <option value="important">Important</option>
            <option value="event">Event</option>
            <option value="update">Update</option>
            <option value="holiday">Holiday</option>
          </select>

          <button class="view-toggle" :class="{ active: viewType === 'list' }" @click="viewType = 'list'" title="List View">
            <i class="bi bi-list-ul"></i>
          </button>
          <button class="view-toggle" :class="{ active: viewType === 'grid' }" @click="viewType = 'grid'" title="Grid View">
            <i class="bi bi-grid-3x3-gap"></i>
          </button>
        </div>

        <button class="mark-read-btn" @click="markAllAsRead" v-if="stats.unread > 0">
          <i class="bi bi-check2-all"></i> Mark All as Read
        </button>
      </div>

      <!-- Announcements View - List -->
      <div v-if="viewType === 'list'" class="announcements-list">
        <div v-if="filteredAnnouncements.length === 0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No announcements found</p>
          <small>Check back soon for new updates</small>
        </div>

        <div
          v-for="announcement in filteredAnnouncements"
          :key="announcement.id"
          class="announcement-item"
          :class="{ unread: !announcement.read }"
        >
          <div class="announcement-checkbox">
            <input type="checkbox" :checked="announcement.read" @change="toggleRead(announcement.id)" />
          </div>

          <div class="announcement-content">
            <div class="announcement-header">
              <div class="header-left">
                <h3 class="title">{{ announcement.title }}</h3>
                <span class="badge" :class="`badge-${announcement.type}`">{{ announcement.type }}</span>
                <span class="date">{{ formatDate(announcement.date) }}</span>
              </div>
              <button class="star-btn" :class="{ active: announcement.starred }" @click="toggleStar(announcement.id)" title="Star">
                <i class="bi bi-star-fill"></i>
              </button>
            </div>

            <p class="description">{{ truncate(announcement.description, 150) }}</p>

            <div class="announcement-footer">
              <span class="author">By: {{ announcement.author }}</span>
              <button class="read-more-btn" @click="viewAnnouncement(announcement)">Read More</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Announcements View - Grid -->
      <div v-else class="announcements-grid">
        <div v-if="filteredAnnouncements.length === 0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No announcements found</p>
        </div>

        <div v-for="announcement in filteredAnnouncements" :key="announcement.id" class="announcement-card" :class="{ unread: !announcement.read }">
          <div class="card-header">
            <span class="badge" :class="`badge-${announcement.type}`">{{ announcement.type }}</span>
            <button class="star-btn" :class="{ active: announcement.starred }" @click="toggleStar(announcement.id)">
              <i class="bi bi-star-fill"></i>
            </button>
          </div>

          <h3 class="card-title">{{ announcement.title }}</h3>
          <p class="card-description">{{ truncate(announcement.description, 100) }}</p>

          <div class="card-footer">
            <small class="card-date">{{ formatDate(announcement.date) }}</small>
            <button class="card-action" @click="viewAnnouncement(announcement)">Read</button>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="showDetailView" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <span class="badge" :class="`badge-${selectedAnnouncement?.type}`">{{ selectedAnnouncement?.type }}</span>
              <h2>{{ selectedAnnouncement?.title }}</h2>
              <small class="modal-date">{{ formatDate(selectedAnnouncement?.date) }}</small>
            </div>
            <button class="modal-close" @click="closeDetail">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="body-header">
              <span class="author">By: {{ selectedAnnouncement?.author }}</span>
              <div class="actions">
                <button
                  class="action-btn"
                  :class="{ active: selectedAnnouncement?.starred }"
                  @click="toggleStar(selectedAnnouncement?.id)"
                  title="Star"
                >
                  <i class="bi bi-star-fill"></i> Star
                </button>
                <button class="action-btn" @click="shareAnnouncement">
                  <i class="bi bi-share"></i> Share
                </button>
              </div>
            </div>

            <div class="content">
              <p>{{ selectedAnnouncement?.description }}</p>

              <div v-if="selectedAnnouncement?.details" class="details-section">
                <h4>Details</h4>
                <p>{{ selectedAnnouncement.details }}</p>
              </div>

              <div v-if="selectedAnnouncement?.eventDate" class="event-info">
                <h4>Event Information</h4>
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">{{ selectedAnnouncement.eventDate }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Time:</span>
                  <span class="value">{{ selectedAnnouncement.eventTime }}</span>
                </div>
                <div v-if="selectedAnnouncement.eventLocation" class="info-row">
                  <span class="label">Location:</span>
                  <span class="value">{{ selectedAnnouncement.eventLocation }}</span>
                </div>
              </div>

              <div v-if="selectedAnnouncement?.attachments?.length" class="attachments-section">
                <h4>Attachments</h4>
                <div class="attachments-list">
                  <a
                    v-for="(attachment, index) in selectedAnnouncement.attachments"
                    :key="index"
                    :href="attachment.url"
                    class="attachment-item"
                    target="_blank"
                  >
                    <i class="bi bi-file"></i>
                    <span>{{ attachment.name }}</span>
                    <small>{{ attachment.size }}</small>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetail">Close</button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import { notifyInfo } from '@/utils/notify'

const searchQuery = ref('')
const filterType = ref('')
const viewType = ref('list')
const showDetailView = ref(false)
const selectedAnnouncement = ref(null)

const announcements = ref([
  {
    id: 1,
    title: 'Annual School Assembly',
    description:
      'All staff members are requested to attend the annual school assembly next Monday. Please gather in the main auditorium at 8:00 AM. Formal dress code is required.',
    type: 'important',
    date: new Date('2024-05-20'),
    author: 'Principal Office',
    read: false,
    starred: false,
    details:
      'This is our annual celebration where we recognize outstanding achievements of students and staff. Please arrive 10 minutes early.',
    eventDate: '2024-05-20',
    eventTime: '8:00 AM - 9:30 AM',
    eventLocation: 'Main Auditorium'
  },
  {
    id: 2,
    title: 'Professional Development Workshop',
    description:
      'A mandatory professional development workshop on "Innovative Teaching Methodologies" will be conducted next Friday for all teachers.',
    type: 'update',
    date: new Date('2024-05-18'),
    author: 'Academic Affairs',
    read: true,
    starred: true,
    details:
      'This workshop will cover modern teaching techniques, technology integration, and student engagement strategies. Duration: 3 hours.',
    eventDate: '2024-05-24',
    eventTime: '2:00 PM - 5:00 PM',
    eventLocation: 'Conference Room B'
  },
  {
    id: 3,
    title: 'Summer Vacation Notice',
    description: 'School will be closed for summer vacation from June 1 to July 15. Classes will resume on July 16.',
    type: 'holiday',
    date: new Date('2024-05-15'),
    author: 'Administration',
    read: true,
    starred: false,
    eventDate: '2024-06-01',
    eventTime: 'All day',
    attachments: [
      { name: 'summer_schedule.pdf', url: '#', size: '2.5 MB' },
      { name: 'activities_plan.doc', url: '#', size: '1.2 MB' }
    ]
  },
  {
    id: 4,
    title: 'Science Fair Registration Open',
    description:
      'Registration for the Annual Science Fair is now open! Students can register their projects until May 25. Event will be held on June 5.',
    type: 'event',
    date: new Date('2024-05-16'),
    author: 'Science Department',
    read: false,
    starred: false,
    details:
      'We are looking for creative and innovative science projects. Both individual and group projects are welcome. Prizes will be awarded to top 3 projects.',
    eventDate: '2024-06-05',
    eventTime: '9:00 AM - 3:00 PM',
    eventLocation: 'Science Block',
    attachments: [
      { name: 'registration_form.pdf', url: '#', size: '1.8 MB' },
      { name: 'guidelines.pdf', url: '#', size: '0.9 MB' }
    ]
  },
  {
    id: 5,
    title: 'Sports Day Schedule Released',
    description:
      'The schedule for the upcoming Sports Day has been released. Events will be held from May 28 to May 30. Check your department assignments.',
    type: 'event',
    date: new Date('2024-05-17'),
    author: 'Sports Committee',
    read: false,
    starred: false,
    details:
      'As staff members, you are requested to supervise specific events. Your assignments are attached. Cooperation from all is appreciated.',
    eventDate: '2024-05-28',
    eventTime: '8:00 AM onwards',
    eventLocation: 'Sports Field',
    attachments: [
      { name: 'schedule.pdf', url: '#', size: '2.1 MB' },
      { name: 'staff_assignments.pdf', url: '#', size: '1.5 MB' }
    ]
  },
  {
    id: 6,
    title: 'Network Maintenance',
    description:
      'The school network will undergo maintenance on May 25 from 6:00 PM to 10:00 PM. There might be intermittent connectivity issues.',
    type: 'update',
    date: new Date('2024-05-19'),
    author: 'IT Department',
    read: true,
    starred: false,
    eventDate: '2024-05-25',
    eventTime: '6:00 PM - 10:00 PM'
  },
  {
    id: 7,
    title: 'Holiday - Independence Day',
    description:
      'The school will remain closed on Independence Day (August 15). Regular classes will resume on August 16.',
    type: 'holiday',
    date: new Date('2024-05-14'),
    author: 'Administration',
    read: true,
    starred: false,
    eventDate: '2024-08-15',
    eventTime: 'All day'
  },
  {
    id: 8,
    title: 'New Library Resources Available',
    description:
      'The library has added 200 new books and digital resources. Updated catalog is now available on the library portal.',
    type: 'update',
    date: new Date('2024-05-12'),
    author: 'Library Services',
    read: true,
    starred: false
  }
])

const stats = computed(() => ({
  total: announcements.value.length,
  unread: announcements.value.filter(a => !a.read).length,
  starred: announcements.value.filter(a => a.starred).length
}))

const filteredAnnouncements = computed(() => {
  let filtered = announcements.value

  if (filterType.value) {
    filtered = filtered.filter(a => a.type === filterType.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      a => a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query) || a.author.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const formatDate = (date) => {
  if (!date) return '-'
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`

  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(date).toLocaleDateString('en-US', options)
}

const truncate = (text, length) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const toggleRead = (id) => {
  const announcement = announcements.value.find(a => a.id === id)
  if (announcement) {
    announcement.read = !announcement.read
  }
}

const toggleStar = (id) => {
  const announcement = announcements.value.find(a => a.id === id) || selectedAnnouncement.value
  if (announcement) {
    announcement.starred = !announcement.starred
  }
}

const markAllAsRead = () => {
  announcements.value.forEach(a => {
    a.read = true
  })
}

const viewAnnouncement = (announcement) => {
  selectedAnnouncement.value = announcement
  announcement.read = true
  showDetailView.value = true
}

const closeDetail = () => {
  showDetailView.value = false
  selectedAnnouncement.value = null
}

const shareAnnouncement = () => {
  notifyInfo('Share functionality would open a dialog to share this announcement via email or social media.')
}
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #06b6d4;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --text-light: #6b7280;
  --border: #e5e7eb;
}

.announcements-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: var(--text);
}

.page-header p {
  margin: 0;
  color: var(--text-light);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  flex: 1;
  min-width: 180px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-text {
  color: var(--text-light);
  font-size: 0.9rem;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

.search-box i {
  color: var(--text-light);
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  color: var(--text);
}

.search-box input::placeholder {
  color: var(--text-light);
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 0.5rem;
  color: var(--text);
  cursor: pointer;
}

.view-toggle {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-light);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle:hover {
  color: var(--primary);
  border-color: var(--primary);
}

.view-toggle.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.mark-read-btn {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.mark-read-btn:hover {
  background: var(--primary-dark);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
  color: var(--text-light);
}

.empty-state i {
  font-size: 3rem;
  color: var(--border);
  display: block;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0.5rem 0 0;
}

/* List View */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-item {
  display: flex;
  gap: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  align-items: flex-start;
}

.announcement-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.announcement-item.unread {
  background: var(--primary-light);
  border-color: var(--primary);
}

.announcement-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.announcement-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.announcement-content {
  flex: 1;
}

.announcement-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.announcement-item .title {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.badge-important {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.badge-event {
  background: rgba(6, 182, 212, 0.1);
  color: var(--info);
}

.badge-update {
  background: rgba(37, 99, 235, 0.1);
  color: var(--primary);
}

.badge-holiday {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.date {
  color: var(--text-light);
  font-size: 0.9rem;
  white-space: nowrap;
}

.star-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
  padding: 0.5rem;
}

.star-btn:hover,
.star-btn.active {
  color: var(--warning);
}

.description {
  margin: 0.75rem 0;
  color: var(--text);
  line-height: 1.5;
}

.announcement-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.author {
  color: var(--text-light);
  font-size: 0.9rem;
}

.read-more-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.read-more-btn:hover {
  background: var(--primary-dark);
}

/* Grid View */
.announcements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.announcement-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.announcement-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.announcement-card.unread {
  background: var(--primary-light);
  border-color: var(--primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  line-height: 1.4;
}

.card-description {
  margin: 0;
  color: var(--text-light);
  font-size: 0.9rem;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.card-date {
  color: var(--text-light);
}

.card-action {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.card-action:hover {
  background: var(--primary-dark);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: var(--surface);
  border-radius: 1rem;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0.5rem 0 0;
  color: var(--text);
}

.modal-date {
  color: var(--text-light);
  display: block;
  margin-top: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--bg);
  color: var(--text);
}

.modal-body {
  padding: 2rem;
}

.body-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  background: none;
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
}

.action-btn:hover,
.action-btn.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content p {
  color: var(--text);
  line-height: 1.7;
  margin: 0;
}

.details-section,
.event-info,
.attachments-section {
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}

.details-section h4,
.event-info h4,
.attachments-section h4 {
  margin: 0 0 1rem;
  color: var(--text);
}

.info-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.info-row .label {
  font-weight: 600;
  color: var(--text);
  min-width: 100px;
}

.info-row .value {
  color: var(--text-light);
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg);
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--primary);
  transition: all 0.2s;
}

.attachment-item:hover {
  background: var(--primary-light);
}

.attachment-item i {
  font-size: 1.5rem;
}

.attachment-item span {
  flex: 1;
  font-weight: 500;
}

.attachment-item small {
  color: var(--text-light);
  white-space: nowrap;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .controls-bar {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-group select {
    flex: 1;
  }

  .announcements-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .modal-content {
    max-width: 100%;
  }

  .modal-header {
    flex-direction: column;
  }

  .announcement-item {
    flex-direction: column;
  }

  .body-header {
    flex-direction: column;
  }

  .actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-bar {
    grid-template-columns: 1fr;
  }

  .announcements-grid {
    grid-template-columns: 1fr;
  }

  .announcement-item {
    padding: 1rem;
  }

  .announcement-header {
    flex-direction: column;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .info-row {
    flex-direction: column;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

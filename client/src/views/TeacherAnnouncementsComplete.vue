<template>
  <TeacherLayout>
    <div class="announcements-container">
      <!-- Header -->
      <section class="announcements-header">
        <div class="header-content">
          <h1><i class="bi bi-megaphone"></i> Announcements</h1>
          <p>Stay informed with the latest school updates and announcements</p>
        </div>

        <div class="header-controls">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search announcements..."
              class="search-input"
            />
          </div>

          <div class="filter-buttons">
            <button
              v-for="category in ['All', 'School', 'Department', 'Personal']"
              :key="category"
              class="filter-btn"
              :class="{ active: selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </section>

      <!-- Unread Count -->
      <section v-if="unreadCount > 0" class="unread-banner">
        <i class="bi bi-exclamation-circle"></i>
        <span>You have {{ unreadCount }} unread announcement{{ unreadCount !== 1 ? 's' : '' }}</span>
        <button class="mark-all-read" @click="markAllAsRead">
          Mark all as read
        </button>
      </section>

      <!-- Announcements List -->
      <section v-if="filteredAnnouncements.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <h3>No announcements</h3>
        <p>
          <template v-if="selectedCategory === 'All' && searchQuery === ''">
            There are no announcements at this time.
          </template>
          <template v-else>
            No announcements matching your filters.
          </template>
        </p>
      </section>

      <div v-else class="announcements-list">
        <div
          v-for="announcement in filteredAnnouncements"
          :key="announcement.id"
          class="announcement-card"
          :class="{ unread: !announcement.read, pinned: announcement.pinned }"
          @click="viewAnnouncement(announcement)"
        >
          <!-- Pin Icon -->
          <div v-if="announcement.pinned" class="pin-badge">
            <i class="bi bi-pin-fill"></i>
          </div>

          <!-- Card Header -->
          <div class="announcement-header">
            <div class="header-left">
              <h3 class="announcement-title">{{ announcement.title }}</h3>
              <div class="announcement-meta">
                <span class="category-badge" :class="'category-' + announcement.category.toLowerCase()">
                  {{ announcement.category }}
                </span>
                <span class="announcement-date">{{ formatDate(announcement.date) }}</span>
                <span class="announcement-author">by {{ announcement.author }}</span>
              </div>
            </div>

            <div class="header-right">
              <button
                v-if="!announcement.read"
                class="unread-indicator"
                @click.stop="markAsRead(announcement.id)"
                title="Mark as read"
              >
                <i class="bi bi-circle-fill"></i>
              </button>

              <button
                class="action-btn"
                @click.stop="togglePin(announcement.id)"
                :title="announcement.pinned ? 'Unpin' : 'Pin'"
              >
                <i :class="announcement.pinned ? 'bi bi-pin-fill' : 'bi bi-pin'"></i>
              </button>

              <div class="dropdown-menu">
                <button class="dropdown-toggle" @click.stop="toggleMenu(announcement.id)">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <div v-if="openMenuId === announcement.id" class="dropdown-content" @click.stop>
                  <button @click="viewAnnouncement(announcement)" class="dropdown-item">
                    <i class="bi bi-eye"></i> View Details
                  </button>
                  <button @click="shareAnnouncement(announcement)" class="dropdown-item">
                    <i class="bi bi-share"></i> Share
                  </button>
                  <button @click="downloadAnnouncement(announcement)" class="dropdown-item">
                    <i class="bi bi-download"></i> Download
                  </button>
                  <button @click="markAsRead(announcement.id)" class="dropdown-item">
                    <i class="bi bi-check"></i> Mark as Read
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="announcement-body">
            <p class="announcement-excerpt">{{ getExcerpt(announcement.content, 150) }}</p>

            <div v-if="announcement.attachments && announcement.attachments.length > 0" class="attachments">
              <span class="attachment-icon">
                <i class="bi bi-paperclip"></i>
                {{ announcement.attachments.length }} attachment{{ announcement.attachments.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="announcement-footer">
            <span v-if="announcement.urgent" class="urgent-badge">
              <i class="bi bi-exclamation-triangle"></i> Urgent
            </span>
            <small class="time-ago">{{ getTimeAgo(announcement.date) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Announcement Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showDetailsModal = false">
          <i class="bi bi-x-lg"></i>
        </button>

        <div v-if="selectedAnnouncement" class="announcement-details">
          <!-- Details Header -->
          <div class="details-header">
            <div class="header-left">
              <h2>{{ selectedAnnouncement.title }}</h2>
              <div class="details-meta">
                <span class="category-badge" :class="'category-' + selectedAnnouncement.category.toLowerCase()">
                  {{ selectedAnnouncement.category }}
                </span>
                <span v-if="selectedAnnouncement.urgent" class="urgent-badge">
                  <i class="bi bi-exclamation-triangle"></i> Urgent
                </span>
              </div>
            </div>

            <button
              class="action-btn"
              @click="togglePin(selectedAnnouncement.id)"
              :title="selectedAnnouncement.pinned ? 'Unpin' : 'Pin'"
            >
              <i :class="selectedAnnouncement.pinned ? 'bi bi-pin-fill' : 'bi bi-pin'"></i>
            </button>
          </div>

          <!-- Details Meta -->
          <div class="details-meta-info">
            <div class="meta-item">
              <span class="meta-label">Author</span>
              <p class="meta-value">{{ selectedAnnouncement.author }}</p>
            </div>

            <div class="meta-item">
              <span class="meta-label">Published</span>
              <p class="meta-value">{{ formatDateTime(selectedAnnouncement.date) }}</p>
            </div>

            <div class="meta-item">
              <span class="meta-label">Category</span>
              <p class="meta-value">{{ selectedAnnouncement.category }}</p>
            </div>
          </div>

          <!-- Details Content -->
          <div class="details-content">
            <p>{{ selectedAnnouncement.content }}</p>
          </div>

          <!-- Attachments -->
          <div v-if="selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0" class="attachments-section">
            <h3>Attachments</h3>
            <div class="attachments-list">
              <div v-for="attachment in selectedAnnouncement.attachments" :key="attachment.id" class="attachment-item">
                <i :class="getFileIcon(attachment.type)"></i>
                <div class="attachment-info">
                  <p class="attachment-name">{{ attachment.name }}</p>
                  <small class="attachment-size">{{ formatFileSize(attachment.size) }}</small>
                </div>
                <button class="download-btn" @click="downloadFile(attachment)">
                  <i class="bi bi-download"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="details-actions">
            <button class="btn-primary" @click="shareAnnouncement(selectedAnnouncement)">
              <i class="bi bi-share"></i> Share
            </button>
            <button class="btn-secondary" @click="showDetailsModal = false">
              <i class="bi bi-x"></i> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const selectedCategory = ref('All')
const searchQuery = ref('')
const showDetailsModal = ref(false)
const selectedAnnouncement = ref(null)
const openMenuId = ref(null)

const announcements = ref([
  {
    id: 1,
    title: 'Staff Meeting This Thursday',
    content:
      'All staff members are requested to attend the monthly staff meeting this Thursday at 4:00 PM in the main conference hall. The meeting will cover curriculum updates, term planning, and new school policies. Please mark your calendars accordingly.',
    category: 'School',
    author: 'Principal Office',
    date: new Date(),
    read: false,
    pinned: true,
    urgent: false,
    attachments: [
      { id: 1, name: 'agenda.pdf', type: 'pdf', size: 245000 }
    ]
  },
  {
    id: 2,
    title: 'Important: System Maintenance Notice',
    content:
      'The school management system will undergo maintenance on Saturday evening from 8 PM to 12 AM. No access to the system will be available during this period. Please complete all necessary work before 8 PM. We apologize for any inconvenience.',
    category: 'School',
    author: 'IT Department',
    date: new Date(Date.now() - 86400000),
    read: false,
    pinned: false,
    urgent: true,
    attachments: []
  },
  {
    id: 3,
    title: 'Department Meeting - Science Faculty',
    content:
      'The Science Department will hold a meeting on Wednesday at 3 PM to discuss the new lab equipment and experimental procedures. All science teachers are requested to attend.',
    category: 'Department',
    author: 'Science HOD',
    date: new Date(Date.now() - 172800000),
    read: true,
    pinned: false,
    urgent: false,
    attachments: [
      { id: 1, name: 'lab_procedures.docx', type: 'docx', size: 1240000 },
      { id: 2, name: 'equipment_list.xlsx', type: 'xlsx', size: 450000 }
    ]
  },
  {
    id: 4,
    title: 'Professional Development Opportunity',
    content:
      'You are invited to participate in an online workshop on innovative teaching methods. The workshop will be conducted over 3 days next month. Interested teachers should register by the end of this week. This is a great opportunity to enhance your teaching skills.',
    category: 'Personal',
    author: 'HR Department',
    date: new Date(Date.now() - 259200000),
    read: true,
    pinned: false,
    urgent: false,
    attachments: [
      { id: 1, name: 'registration_form.pdf', type: 'pdf', size: 123000 }
    ]
  },
  {
    id: 5,
    title: 'Holiday Schedule Update',
    content:
      'Please note that next week Friday has been declared a public holiday. School will be closed on that day. The revised holiday schedule has been uploaded to the school portal.',
    category: 'School',
    author: 'Administration',
    date: new Date(Date.now() - 345600000),
    read: true,
    pinned: false,
    urgent: false,
    attachments: []
  }
])

const filteredAnnouncements = computed(() => {
  return announcements.value.filter(a => {
    const categoryMatch = selectedCategory.value === 'All' || a.category === selectedCategory.value
    const searchMatch =
      a.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.value.toLowerCase())

    return categoryMatch && searchMatch
  })
})

const pinnedAnnouncements = computed(() => {
  return filteredAnnouncements.value.filter(a => a.pinned)
})

const regularAnnouncements = computed(() => {
  return filteredAnnouncements.value.filter(a => !a.pinned)
})

const unreadCount = computed(() => {
  return announcements.value.filter(a => !a.read).length
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now - d)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeAgo = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const seconds = Math.floor((now - d) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'

  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'

  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'

  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'

  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + 'm ago'

  return Math.floor(seconds) + 's ago'
}

const getExcerpt = (content, length) => {
  if (!content) return ''
  return content.length > length ? content.substring(0, length) + '...' : content
}

const getFileIcon = (type) => {
  const icons = {
    pdf: 'bi bi-file-pdf',
    docx: 'bi bi-file-word',
    xlsx: 'bi bi-file-excel',
    pptx: 'bi bi-file-powerpoint',
    default: 'bi bi-file'
  }
  return icons[type] || icons.default
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const markAsRead = (id) => {
  const announcement = announcements.value.find(a => a.id === id)
  if (announcement) {
    announcement.read = true
  }
}

const markAllAsRead = () => {
  announcements.value.forEach(a => {
    a.read = true
  })
}

const togglePin = (id) => {
  const announcement = announcements.value.find(a => a.id === id)
  if (announcement) {
    announcement.pinned = !announcement.pinned
  }
}

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const viewAnnouncement = (announcement) => {
  selectedAnnouncement.value = announcement
  markAsRead(announcement.id)
  showDetailsModal.value = true
}

const shareAnnouncement = (announcement) => {
  alert(`Sharing: ${announcement.title}\n\nShare functionality to be implemented`)
}

const downloadAnnouncement = (announcement) => {
  alert(`Downloading: ${announcement.title}\n\nDownload functionality to be implemented`)
}

const downloadFile = (attachment) => {
  alert(`Downloading: ${attachment.name}\n\nDownload functionality to be implemented`)
}
</script>

<style scoped>
.announcements-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f0f4f8 0%, #f9fafb 100%);
  min-height: 100vh;
}

.announcements-header {
  margin-bottom: 2rem;
}

.header-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.875rem;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.header-content h1 i {
  color: #2563eb;
}

.header-content p {
  color: #9ca3af;
  margin: 0;
}

.header-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  font-size: 1.1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.625rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.filter-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.unread-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: #0c4a6e;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.unread-banner i {
  font-size: 1.25rem;
}

.mark-all-read {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: rgba(12, 74, 110, 0.1);
  border: 1px solid rgba(12, 74, 110, 0.3);
  border-radius: 6px;
  color: #0c4a6e;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.mark-all-read:hover {
  background: rgba(12, 74, 110, 0.2);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3.5rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 1rem 0 0.5rem 0;
}

.empty-state p {
  color: #9ca3af;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  border-left: 4px solid #e5e7eb;
  position: relative;
}

.announcement-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.announcement-card.unread {
  background: linear-gradient(135deg, #f0f9ff 0%, #f9fafb 100%);
  border-left-color: #2563eb;
}

.announcement-card.pinned {
  border-top: 3px solid #f59e0b;
}

.pin-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f59e0b;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  z-index: 1;
}

.announcement-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.announcement-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: #111827;
}

.announcement-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-badge.category-school {
  background: #dbeafe;
  color: #0c4a6e;
}

.category-badge.category-department {
  background: #dcfce7;
  color: #15803d;
}

.category-badge.category-personal {
  background: #f3e8ff;
  color: #6b21a8;
}

.announcement-date {
  font-size: 0.85rem;
  color: #9ca3af;
}

.announcement-author {
  font-size: 0.85rem;
  color: #6b7280;
}

.header-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.unread-indicator {
  width: 12px;
  height: 12px;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.6rem;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
}

.unread-indicator:hover {
  transform: scale(1.5);
}

.action-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #2563eb;
}

.dropdown-menu {
  position: relative;
}

.dropdown-toggle {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.dropdown-toggle:hover {
  background: #f3f4f6;
  color: #2563eb;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background: #f9fafb;
  color: #2563eb;
}

.dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 8px 8px;
}

.announcement-body {
  padding: 0 1.5rem 1rem 1.5rem;
}

.announcement-excerpt {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.attachments {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6b7280;
}

.attachment-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.announcement-footer {
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.urgent-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.time-ago {
  color: #9ca3af;
  font-size: 0.85rem;
}

/* Modal Styles */
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
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.modal-close:hover {
  color: #111827;
  transform: rotate(90deg);
}

.announcement-details {
  padding: 2rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.details-header h2 {
  font-size: 1.75rem;
  margin: 0 0 0.75rem 0;
  color: #111827;
}

.details-meta-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
}

.meta-value {
  font-size: 0.95rem;
  color: #111827;
  margin: 0;
}

.details-content {
  margin-bottom: 1.5rem;
  line-height: 1.8;
  color: #374151;
}

.details-content p {
  margin: 1rem 0;
}

.attachments-section {
  margin-bottom: 1.5rem;
}

.attachments-section h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: #111827;
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
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.attachment-item:hover {
  background: #f3f4f6;
}

.attachment-item i {
  font-size: 1.5rem;
  color: #2563eb;
  min-width: 30px;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #111827;
}

.attachment-size {
  color: #9ca3af;
}

.download-btn {
  background: #2563eb;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: #1e40af;
  transform: scale(1.05);
}

.details-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1e40af;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #d1d5db;
}

@media (max-width: 768px) {
  .announcements-container {
    padding: 1rem;
  }

  .header-controls {
    flex-direction: column;
  }

  .search-box {
    min-width: unset;
  }

  .announcement-card {
    padding: 1rem;
  }

  .announcement-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .details-meta-info {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-content {
    margin: 1rem;
  }

  .announcement-details {
    padding: 1.5rem;
  }

  .details-actions {
    flex-direction: column;
  }
}
</style>

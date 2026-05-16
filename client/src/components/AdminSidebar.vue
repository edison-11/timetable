<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">TT</div>
      <div class="brand-text">
        <strong>Timetable</strong>
        <span>Admin Panel</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in adminSidebarItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="academic-card">
      <span>Academic Year</span>
      <strong>{{ academicYear }}</strong>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const adminSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Timetables', path: '/timetable', icon: '📅' },
  { name: 'Classes', path: '/classes', icon: '📚' },
  { name: 'Subjects', path: '/modules', icon: '📖' },
  { name: 'Rooms', path: '/rooms', icon: '🏠' },
  { name: 'Teachers', path: '/teachers', icon: '👨‍🏫' },
  { name: 'Sections', path: '/sections', icon: '📑' },
  { name: 'Assignments', path: '/assignments', icon: '✏️' },
  { name: 'Shifts', path: '/shifts', icon: '⏰' },
  { name: 'Settings', path: '/settings', icon: '⚙️' }
]

const academicYear = computed(() => {
  const now = new Date()
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${start} - ${start + 1}`
})
</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  flex-direction: column;
  z-index: 200;
  overflow-y: auto;
}

.admin-sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #334155;
  margin-bottom: 1rem;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 8px;
  font-weight: 700;
  color: white;
}

.brand-text strong {
  display: block;
  font-size: 1rem;
  color: white;
}

.brand-text span {
  font-size: 0.7rem;
  color: #94a3b8;
}

.sidebar-nav {
  flex: 1;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.nav-item:hover {
  background: #334155;
  color: white;
}

.nav-item.active {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  color: white;
}

.nav-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.academic-card {
  margin: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  text-align: center;
}

.academic-card span {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
}

.academic-card strong {
  font-size: 0.875rem;
  color: white;
}
</style>

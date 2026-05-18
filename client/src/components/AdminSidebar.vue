<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <img class="brand-logo" src="/timetable-logo.png" alt="Timetable logo">
      </div>
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
        <span class="nav-icon" v-html="item.icon"></span>
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

const icons = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  classes: '<svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Zm4-12h6M8 11h6"/></svg>',
  modules: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 7h8M8 11h6"/></svg>',
  rooms: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6"/></svg>',
  teachers: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1 2 2 3-4"/></svg>',
  sections: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  assignments: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  shifts: '<svg viewBox="0 0 24 24"><path d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 1 1-3.84 0L10 20a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 1 1 0-3.84L4 10a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 1 1 3.84 0L14 4a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.33.72.6 1l.08.08a2 2 0 1 1 0 3.84L20 14a1.7 1.7 0 0 0-.6 1Z"/></svg>'
}

const adminSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
  { name: 'Sections', path: '/sections', icon: icons.sections },
  { name: 'Rooms', path: '/rooms', icon: icons.rooms },
  { name: 'Shifts', path: '/shifts', icon: icons.shifts },
  { name: 'Teachers', path: '/teachers', icon: icons.teachers },
  { name: 'Subjects', path: '/modules', icon: icons.modules },
  { name: 'Classes', path: '/classes', icon: icons.classes },
  { name: 'Assignments', path: '/assignments', icon: icons.assignments },
  { name: 'Timetables', path: '/timetable', icon: icons.calendar },
  { name: 'Settings', path: '/settings', icon: icons.settings }
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
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 200;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 8px;
  font-weight: 800;
  color: white;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-text strong {
  display: block;
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 700;
}

.brand-text span {
  font-size: 0.7rem;
  color: #7f8c8d;
  font-weight: 600;
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
  min-height: 40px;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  color: #495057;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 600;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #e9ecef;
  color: #3498db;
  border-left-color: #3498db;
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-left-color: #2980b9;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
}

.nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.academic-card {
  margin: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #e8f4f8 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.academic-card span {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.academic-card strong {
  font-size: 1rem;
  color: #2980b9;
  font-weight: 800;
  display: block;
  margin-top: 0.35rem;
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>

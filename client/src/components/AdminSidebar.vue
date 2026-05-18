<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <img class="brand-logo" :src="logoUrl" alt="Timetable logo">
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
        @click="closeMobileSidebar"
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
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`

const closeMobileSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.remove('mobile-open')
  document.querySelector('.sidebar-backdrop')?.classList.remove('visible')
  document.body.classList.remove('sidebar-open')
  document.dispatchEvent(new Event('sidebar:closed'))
}

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
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 251, 255, 0.99) 100%);
  border-right: 1px solid #dbe5f3;
  box-shadow: 16px 0 34px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 200;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  padding: 1.4rem 1.15rem 1.2rem;
  border-bottom: 1px solid #e3ebf7;
  margin-bottom: 1rem;
}

.brand-mark {
  flex: 0 0 68px;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  font-weight: 800;
  color: #2563eb;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.16);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 5px;
}

.brand-text strong {
  display: block;
  font-size: 1.02rem;
  color: #172033;
  font-weight: 800;
  line-height: 1.15;
}

.brand-text span {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 46px;
  padding: 0.72rem 0.8rem;
  border-radius: 8px;
  color: #415169;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  font-size: 0.88rem;
  font-weight: 750;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: #eef6ff;
  color: #1d4ed8;
  border-color: #d7e7ff;
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border-color: #2563eb;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #eef2f7;
  color: #334155;
}

.nav-item.active .nav-icon {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.nav-icon :deep(svg) {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.academic-card {
  margin: 1rem 0.9rem 1.2rem;
  padding: 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
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
    transition: transform 0.24s ease;
    z-index: 300;
  }

  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>

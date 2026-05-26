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

    <nav class="sidebar-nav" aria-label="Admin navigation">
      <router-link
        v-for="item in adminSidebarItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        :aria-current="route.path === item.path ? 'page' : undefined"
        :title="item.name"
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
  dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5V5.5c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5h-4C4.7 15 4 14.3 4 13.5Zm9-4V5.5c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5Zm0 8.5v-4c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5ZM4 20.5v-2c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v2c0 .8-.7 1.5-1.5 1.5h-4C4.7 22 4 21.3 4 20.5Z"/></svg>',
  sections: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h14M7 12h14M7 18h14"/><path d="M3.5 6h.5M3.5 12h.5M3.5 18h.5"/></svg>',
  rooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>',
  shifts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v6l4 2"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
  teachers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-8 0v2"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M19 9h4"/><path d="M21 7v4"/></svg>',
  students: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21v-2a4 4 0 0 1 8 0v2"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 18v-1a3 3 0 0 1 3-3"/><path d="M20 18v-1a3 3 0 0 0-3-3"/></svg>',
  modules: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3H20v18H7.5A3.5 3.5 0 0 0 4 24V6.5Z" transform="translate(0 -1)"/><path d="M8 7h8"/><path d="M8 12h6"/></svg>',
  classes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 0 4 22v-3Z"/><path d="M8 8h8"/><path d="M8 12h6"/></svg>',
  assignments: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11h6"/><path d="M9 15h6"/><path d="M8 3h8l4 4v14H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><path d="M16 3v4h4"/></svg>',
  timetable: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v4M16 3v4"/><path d="M4 9h16"/><path d="M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M7 12h3M7 16h3M14 12h3M14 16h3"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 1 1-3.84 0L10 20a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 1 1 0-3.84L4 10a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 1 1 3.84 0L14 4a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.33.72.6 1l.08.08a2 2 0 1 1 0 3.84L20 14a1.7 1.7 0 0 0-.6 1Z"/></svg>'
}

const adminSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
  { name: 'Sections', path: '/sections', icon: icons.sections },
  { name: 'Rooms', path: '/rooms', icon: icons.rooms },
  { name: 'Shifts', path: '/shifts', icon: icons.shifts },
  { name: 'Teachers', path: '/teachers', icon: icons.teachers },
  { name: 'Students', path: '/students', icon: icons.students },
  { name: 'Subjects', path: '/modules', icon: icons.modules },
  { name: 'Classes', path: '/classes', icon: icons.classes },
  { name: 'Assignments', path: '/assignments', icon: icons.assignments },
  { name: 'Timetables', path: '/timetable', icon: icons.timetable },
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
  width: 248px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #dbe5f3;
  box-shadow: 16px 0 34px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 200;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.24s ease, transform 0.24s ease, box-shadow 0.24s ease;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 0.95rem 0.95rem;
  border-bottom: 1px solid #e3ebf7;
  margin-bottom: 0.9rem;
  min-height: 94px;
  transition: padding 0.24s ease, justify-content 0.24s ease;
}

.brand-mark {
  flex: 0 0 78px;
  width: 78px;
  height: 78px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef6ff;
  border: 1px solid #cfe2ff;
  border-radius: 14px;
  color: #2563eb;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 0;
  transform: scale(1.25);
}

.brand-text strong {
  display: block;
  font-size: 0.95rem;
  color: #172033;
  font-weight: 800;
  line-height: 1.15;
}

.brand-text span {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.66rem;
  color: #64748b;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 0 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 40px;
  padding: 0.58rem 0.65rem 0.58rem 0.85rem;
  border-radius: 12px;
  color: #475569;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 0.8rem;
  font-weight: 750;
  border: 1px solid transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0.45rem;
  top: 50%;
  width: 3px;
  height: 1.45rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0;
  transform: translateY(-50%) scaleY(0.35);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background: #eef6ff;
  color: #1d4ed8;
  border-color: #d7e7ff;
  transform: translateX(3px);
}

.nav-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #bfdbfe;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.02);
}

.nav-item.active::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 10px;
  background: transparent;
  color: currentColor;
  transition: color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
}

.nav-icon :deep(svg) {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease, transform 0.2s ease, width 0.2s ease;
}

.academic-card {
  margin: 1rem 0.9rem 1.2rem;
  padding: 1rem;
  background: #eef6ff;
  border: 1px solid #cfe2ff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.08);
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
  color: #2563eb;
  font-weight: 800;
  display: block;
  margin-top: 0.35rem;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: min(84vw, 280px);
    transform: translateX(-100%);
    z-index: 300;
  }

  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>

<style>
body.sidebar-collapsed .admin-sidebar {
  width: 72px;
}

body.sidebar-collapsed .admin-sidebar .sidebar-brand {
  justify-content: center;
  padding-inline: 0.5rem;
}

body.sidebar-collapsed .admin-sidebar .brand-text,
body.sidebar-collapsed .admin-sidebar .nav-label,
body.sidebar-collapsed .admin-sidebar .academic-card {
  opacity: 0;
  width: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-10px);
}

body.sidebar-collapsed .admin-sidebar .sidebar-brand {
  gap: 0;
}

body.sidebar-collapsed .admin-sidebar .brand-mark {
  flex-basis: 54px;
  width: 54px;
  height: 54px;
}

body.sidebar-collapsed .admin-sidebar .sidebar-nav {
  padding-inline: 0.5rem;
  align-items: stretch;
}

body.sidebar-collapsed .admin-sidebar .nav-item {
  justify-content: center;
  gap: 0;
  padding-inline: 0;
  padding-left: 0;
  border-radius: 16px;
  transform: none;
  background: transparent;
  border-color: transparent;
}

body.sidebar-collapsed .admin-sidebar .nav-item::before {
  left: 50%;
  top: auto;
  bottom: 0.35rem;
  width: 22px;
  height: 3px;
  transform: translateX(-50%) scaleX(0.25);
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover {
  background: #f1f5ff;
  color: #1d4ed8;
  transform: none;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active {
  background: transparent;
  color: #2563eb;
  border-color: transparent;
  box-shadow: none;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active::before {
  opacity: 1;
  transform: translateX(-50%) scaleX(1);
}

body.sidebar-collapsed .admin-sidebar .nav-icon {
  width: 34px;
  height: 34px;
  color: #64748b;
  background: transparent;
  border-radius: 999px;
  transition: color 0.2s ease, transform 0.2s ease;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-icon {
  color: #1d4ed8;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active .nav-icon {
  color: #2563eb;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-icon,
body.sidebar-collapsed .admin-sidebar .nav-item.active .nav-icon {
  background: transparent;
  transform: scale(1.04);
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover::before {
  opacity: 0.85;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-label {
  display: none;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover {
  transform: none;
}

body.admin-dark-mode .admin-sidebar {
  background: #111827;
  border-right-color: #263247;
  box-shadow: 16px 0 34px rgba(0, 0, 0, 0.32);
}

body.admin-dark-mode .admin-sidebar .sidebar-brand {
  border-bottom-color: #263247;
}

body.admin-dark-mode .admin-sidebar .brand-mark,
body.admin-dark-mode .admin-sidebar .academic-card {
  background: #172554;
  border-color: #1e40af;
}

body.admin-dark-mode .admin-sidebar .brand-text strong {
  color: #f8fafc;
}

body.admin-dark-mode .admin-sidebar .brand-text span,
body.admin-dark-mode .admin-sidebar .academic-card span {
  color: #94a3b8;
}

body.admin-dark-mode .admin-sidebar .nav-item {
  color: #cbd5e1;
}

body.admin-dark-mode .admin-sidebar .nav-item:hover {
  background: #172554;
  border-color: #1d4ed8;
  color: #bfdbfe;
}

body.admin-dark-mode .admin-sidebar .nav-item.active {
  background: #1e3a8a;
  border-color: #2563eb;
  color: #dbeafe;
}

body.admin-dark-mode .admin-sidebar .academic-card strong {
  color: #bfdbfe;
}

body.admin-dark-mode.sidebar-collapsed .admin-sidebar .nav-item:hover,
body.admin-dark-mode.sidebar-collapsed .admin-sidebar .nav-item.active {
  background: transparent;
  color: #bfdbfe;
}
</style>

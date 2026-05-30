<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <img class="brand-logo" :src="logoUrl" alt="Timetable logo">
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Admin navigation">
      <router-link
        v-for="item in adminSidebarItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        :data-label="item.name"
        :aria-current="route.path === item.path ? 'page' : undefined"
        :title="item.name"
        @click="closeMobileSidebar"
      >
        <span class="nav-icon">
          <component :is="item.icon" aria-hidden="true" />
        </span>
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
import { useAuthStore } from '@/stores/auth'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  GraduationCap,
  Home,
  LayoutDashboard,
  List,
  School,
  Settings,
  Users,
  UserRoundPlus
} from '@lucide/vue'

const route = useRoute()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`

const closeMobileSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.remove('mobile-open')
  document.querySelector('.sidebar-backdrop')?.classList.remove('visible')
  document.body.classList.remove('sidebar-open')
  document.dispatchEvent(new Event('sidebar:closed'))
}

const icons = {
  dashboard: LayoutDashboard,
  sections: List,
  rooms: Home,
  shifts: Clock,
  teachers: UserRoundPlus,
  students: GraduationCap,
  modules: BookOpen,
  classes: ClipboardList,
  assignments: ClipboardList,
  timetable: CalendarDays,
  attendance: Users,
  reports: ClipboardList,
  notifications: Bell,
  settings: Settings,
  schools: School
}

const superAdminSidebarItems = [
  { name: 'Dashboard', path: '/super-admin/dashboard', icon: icons.dashboard },
  { name: 'Schools', path: '/super-admin/schools', icon: icons.schools },
  { name: 'DOS', path: '/super-admin/schools', icon: icons.teachers },
  { name: 'Settings', path: '/settings', icon: icons.settings }
]

const dosSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
  { name: 'Teachers', path: '/teachers', icon: icons.teachers },
  { name: 'Students', path: '/students', icon: icons.students },
  { name: 'Classes', path: '/classes', icon: icons.classes },
  { name: 'Subjects', path: '/modules', icon: icons.modules },
  { name: 'Sections', path: '/sections', icon: icons.sections },
  { name: 'Rooms', path: '/rooms', icon: icons.rooms },
  { name: 'Shifts', path: '/shifts', icon: icons.shifts },
  { name: 'Assignments', path: '/assignments', icon: icons.assignments },
  { name: 'Timetable', path: '/timetable', icon: icons.timetable },
  { name: 'Attendance', path: '/dashboard#attendance', icon: icons.attendance },
  { name: 'Reports', path: '/dashboard#reports', icon: icons.reports },
  { name: 'Notifications', path: '/dashboard#notifications', icon: icons.notifications },
  { name: 'Settings', path: '/settings', icon: icons.settings }
]

const adminSidebarItems = computed(() => (
  authStore.currentUserType === 'super_admin' || authStore.currentUser?.role === 'super_admin'
    ? superAdminSidebarItems
    : dosSidebarItems
))

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
  padding: 1.35rem 0.95rem 1.15rem;
  border-bottom: 1px solid #e3ebf7;
  margin-bottom: 0.9rem;
  min-height: 126px;
  transition: padding 0.24s ease, justify-content 0.24s ease;
}

.brand-mark {
  flex: 0 0 110px;
  width: 110px;
  height: 110px;
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

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  background: #2563eb;
  color: #ffffff;
}

.nav-item.active::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  transition: color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
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
  width: 88px;
  overflow: visible;
}

body.sidebar-collapsed .admin-sidebar .sidebar-brand {
  justify-content: center;
  padding-inline: 0.5rem;
}

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
  color: #2563eb;
  background: #eff6ff;
  border-radius: 999px;
  transition: color 0.2s ease, transform 0.2s ease;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-icon,
body.sidebar-collapsed .admin-sidebar .nav-item.active .nav-icon {
  color: #ffffff;
  background: #2563eb;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-icon,
body.sidebar-collapsed .admin-sidebar .nav-item.active .nav-icon {
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

body.sidebar-collapsed .admin-sidebar .nav-item::after {
  content: attr(data-label);
  position: absolute;
  left: calc(100% + 0.65rem);
  top: 50%;
  z-index: 600;
  min-width: max-content;
  padding: 0.45rem 0.65rem;
  border-radius: 7px;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0;
  pointer-events: none;
  transform: translate(-4px, -50%);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover::after,
body.sidebar-collapsed .admin-sidebar .nav-item:focus-visible::after {
  opacity: 1;
  transform: translate(0, -50%);
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

body.admin-dark-mode .admin-sidebar .academic-card span {
  color: #94a3b8;
}

body.admin-dark-mode .admin-sidebar .nav-item {
  color: #cbd5e1;
}

body.admin-dark-mode .admin-sidebar .nav-icon {
  background: #172554;
  color: #93c5fd;
}

body.admin-dark-mode .admin-sidebar .nav-item:hover {
  background: #172554;
  border-color: #1d4ed8;
  color: #bfdbfe;
}

body.admin-dark-mode .admin-sidebar .nav-item:hover .nav-icon,
body.admin-dark-mode .admin-sidebar .nav-item.active .nav-icon {
  background: #3b82f6;
  color: #ffffff;
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

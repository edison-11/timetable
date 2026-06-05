<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <img class="brand-logo" :src="logoUrl" alt="Timetable logo">
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Admin navigation">
      <div v-for="group in adminSidebarGroups" :key="group.label" class="nav-group">
        <span v-if="group.label" class="nav-group-label">{{ group.label }}</span>
        <router-link
          v-for="item in group.items"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: isNavActive(item) }"
          :data-label="item.name"
          :aria-current="isNavActive(item) ? 'page' : undefined"
          :title="item.name"
          @click="closeMobileSidebar"
        >
          <component
            :is="item.icon"
            class="nav-icon"
            :style="{ color: item.color }"
            :size="18"
            :stroke-width="2.1"
            aria-hidden="true"
          />
          <span class="nav-label">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>

    <div v-if="!isSuperAdminAccount" class="academic-card">
      <span>Academic Year</span>
      <strong>{{ academicYear }}</strong>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  Bell,
  Megaphone,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  CreditCard,
  Database,
  DoorOpen,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListChecks,
  School,
  Settings,
  UserRoundPlus,
  Users
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`
const isSuperAdminAccount = computed(() => authStore.currentUserType === 'super_admin' || authStore.currentUser?.role === 'super_admin')

const closeMobileSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.remove('mobile-open')
  document.querySelector('.sidebar-backdrop')?.classList.remove('visible')
  document.body.classList.remove('sidebar-open')
  document.dispatchEvent(new Event('sidebar:closed'))
}

const isNavActive = (item) => {
  if (item.path === '/super-admin/schools') return route.path.startsWith('/super-admin/schools')
  if (item.path === '/super-admin/dos') return route.path.startsWith('/super-admin/dos')
  if (item.path.startsWith('/super-admin/') && item.path !== '/super-admin/dashboard') return route.path === item.path
  if (item.path.includes('#')) return route.fullPath === item.path
  if (item.path.includes('?')) return route.fullPath === item.path
  return route.path === item.path
}

const superAdminSidebarGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard, color: '#2563eb' },
      { name: 'Activity', path: '/super-admin/activity', icon: Activity, color: '#0891b2' }
    ]
  },
  {
    label: 'Academics',
    items: [
      { name: 'Schools', path: '/super-admin/schools', icon: School, color: '#16a34a' },
      { name: 'DOS', path: '/super-admin/dos', icon: UserRoundPlus, color: '#7c3aed' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { name: 'Reports', path: '/super-admin/reports', icon: FileText, color: '#f97316' },
      { name: 'Billing', path: '/super-admin/billing', icon: CreditCard, color: '#0f766e' }
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Databases', path: '/super-admin/databases', icon: Database, color: '#475569' },
      { name: 'Administration', path: '/super-admin/administration', icon: ListChecks, color: '#b45309' },
      { name: 'Announcements', path: '/announcements', icon: Megaphone, color: '#2563eb' },
      { name: 'Notifications', path: '/notifications', icon: Bell, color: '#d97706' },
      { name: 'Settings', path: '/settings', icon: Settings, color: '#64748b' }
    ]
  }
]

const dosSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: '#2563eb' },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap, color: '#7c3aed' },
  { name: 'Students', path: '/students', icon: Users, color: '#16a34a' },
  { name: 'Classes', path: '/classes', icon: Building2, color: '#0891b2' },
  { name: 'Subjects', path: '/modules', icon: BookOpen, color: '#f97316' },
  { name: 'Sections', path: '/sections', icon: Layers, color: '#0f766e' },
  { name: 'Rooms', path: '/rooms', icon: DoorOpen, color: '#64748b' },
  { name: 'Shifts', path: '/shifts', icon: Clock3, color: '#b45309' },
  { name: 'Assignments', path: '/assignments', icon: ClipboardList, color: '#475569' },
  { name: 'Timetable', path: '/timetable', icon: CalendarDays, color: '#e11d48' },
  { name: 'Attendance', path: '/students?view=attendance', icon: Users, color: '#16a34a' },
  { name: 'Reports', path: '/students?view=report', icon: FileText, color: '#f97316' },
  { name: 'Announcements', path: '/announcements', icon: Megaphone, color: '#2563eb' },
  { name: 'Notifications', path: '/notifications', icon: Bell, color: '#d97706' },
  { name: 'Settings', path: '/settings', icon: Settings, color: '#64748b' }
]

const adminSidebarGroups = computed(() => (
  isSuperAdminAccount.value
    ? superAdminSidebarGroups
    : [{ label: '', items: dosSidebarItems }]
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
  top: 64px;
  left: 0;
  width: 184px;
  height: calc(100vh - 64px);
  height: calc(100dvh - 64px);
  max-height: calc(100dvh - 64px);
  background: #ffffff;
  border-right: 1px solid #dbe5f3;
  box-shadow: 16px 0 34px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 200;
  overflow-y: hidden;
  overflow-x: hidden;
  transition: width 0.24s ease, transform 0.24s ease, box-shadow 0.24s ease;
}

.sidebar-brand {
  display: none;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0.6rem 0.55rem;
  border-bottom: 1px solid #e3ebf7;
  margin-bottom: 0.45rem;
  min-height: 72px;
  transition: padding 0.24s ease, justify-content 0.24s ease;
}

.brand-mark {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef6ff;
  border: 1px solid #cfe2ff;
  border-radius: 12px;
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
  min-height: 0;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.55) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 7px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.nav-group {
  display: grid;
  gap: 0.22rem;
}

.nav-group-label {
  padding: 0 0.52rem;
  color: #94a3b8;
  font-size: 0.58rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.58rem;
  min-height: 36px;
  padding: 0.48rem 0.5rem 0.48rem 0.72rem;
  border-radius: 10px;
  color: #475569;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 0.76rem;
  font-weight: 750;
  border: 1px solid transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0.36rem;
  top: 50%;
  width: 3px;
  height: 1.28rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0;
  transform: translateY(-50%) scaleY(0.35);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: transparent;
  transform: translateX(3px);
}

.nav-item.active {
  background: transparent;
  color: #0f172a;
  border-color: transparent;
  box-shadow: none;
}

.nav-item.active::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  background: transparent;
  transition: color 0.2s ease, transform 0.2s ease;
}

.nav-item:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.24);
  outline-offset: 3px;
}

.nav-item.active .nav-icon {
  background: transparent;
  transform: scale(1.08);
}

.nav-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease, transform 0.2s ease, width 0.2s ease;
}

.academic-card {
  flex: 0 0 auto;
  margin: 0.75rem 0.65rem 0.85rem;
  padding: 0.75rem;
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

.academic-card small {
  display: block;
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}

@media (max-width: 768px) {
  .admin-sidebar {
    top: 64px;
    height: calc(100dvh - 64px);
    width: min(78vw, 240px);
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
  width: 64px;
  overflow: hidden;
}

body.sidebar-collapsed .admin-sidebar .sidebar-brand {
  justify-content: center;
  padding-inline: 0.5rem;
}

body.sidebar-collapsed .admin-sidebar .brand-text,
body.sidebar-collapsed .admin-sidebar .nav-label,
body.sidebar-collapsed .admin-sidebar .nav-group-label,
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
  flex-basis: 44px;
  width: 44px;
  height: 44px;
}

body.sidebar-collapsed .admin-sidebar .sidebar-nav {
  padding-inline: 0.4rem;
  align-items: stretch;
  overflow-y: auto;
  overflow-x: visible;
}

body.sidebar-collapsed .admin-sidebar .nav-item {
  justify-content: center;
  gap: 0;
  padding-inline: 0;
  padding-left: 0;
  border-radius: 12px;
  transform: none;
  background: transparent;
  border-color: transparent;
}

body.sidebar-collapsed .admin-sidebar .nav-item::before {
  left: 50%;
  top: auto;
  bottom: 0.35rem;
  width: 18px;
  height: 3px;
  transform: translateX(-50%) scaleX(0.25);
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover {
  background: #f1f5ff;
  color: #0f172a;
  transform: none;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active {
  background: transparent;
  color: #0f172a;
  border-color: transparent;
  box-shadow: none;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active::before {
  opacity: 1;
  transform: translateX(-50%) scaleX(1);
}

body.sidebar-collapsed .admin-sidebar .nav-icon {
  width: 18px;
  height: 18px;
  background: transparent;
  transition: color 0.2s ease, transform 0.2s ease;
}

body.sidebar-collapsed .admin-sidebar .nav-item:hover .nav-icon {
  color: #0f172a;
}

body.sidebar-collapsed .admin-sidebar .nav-item.active .nav-icon {
  background: transparent;
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
  color: #bfdbfe !important;
}

body.admin-dark-mode .admin-sidebar .nav-item:hover {
  background: #1f2937;
  border-color: #334155;
  color: #f8fafc;
}

body.admin-dark-mode .admin-sidebar .nav-item.active {
  background: transparent;
  border-color: transparent;
  color: #f8fafc;
}

body.admin-dark-mode .admin-sidebar .nav-item:hover .nav-icon,
body.admin-dark-mode .admin-sidebar .nav-item.active .nav-icon {
  color: #ffffff !important;
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

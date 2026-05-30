<template>
  <div class="app-layout">
    <AdminSidebar />
    <div class="sidebar-backdrop" @click="closeSidebar"></div>
    <div class="main-wrapper">
      <AppNavbar />
      <main class="main-content">
        <nav v-if="breadcrumbs.length" class="app-breadcrumbs" aria-label="Breadcrumb">
          <router-link v-for="crumb in breadcrumbs.slice(0, -1)" :key="crumb.path" :to="crumb.path">
            {{ crumb.label }}
          </router-link>
          <span aria-current="page">{{ breadcrumbs[breadcrumbs.length - 1].label }}</span>
        </nav>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from './AdminSidebar.vue'
import AppNavbar from './AppNavbar.vue'

const route = useRoute()

const breadcrumbs = computed(() => {
  if (route.path.startsWith('/super-admin/schools/')) {
    return [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: 'Schools', path: '/super-admin/schools' },
      { label: route.meta?.schoolName || `School ${route.params.id}`, path: route.path }
    ]
  }
  if (route.path === '/super-admin/schools') {
    return [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: 'Schools', path: route.path }
    ]
  }
  if (route.path === '/super-admin/dos') {
    return [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: 'Directors of Studies', path: route.path }
    ]
  }
  const sectionLabels = {
    '/super-admin/databases': 'Databases',
    '/super-admin/billing': 'Billing',
    '/super-admin/activity': 'Activity',
    '/super-admin/reports': 'Reports',
    '/super-admin/administration': 'Administration'
  }
  if (sectionLabels[route.path]) {
    return [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: sectionLabels[route.path], path: route.path }
    ]
  }
  if (route.path === '/super-admin/dashboard') return [{ label: 'Dashboard', path: route.path }]
  if (route.path === '/settings') {
    return [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: 'Settings', path: route.path }
    ]
  }
  return []
})

const closeSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.remove('mobile-open')
  document.querySelector('.sidebar-backdrop')?.classList.remove('visible')
  document.body.classList.remove('sidebar-open')
  document.body.classList.remove('sidebar-collapsed')
  document.dispatchEvent(new Event('sidebar:closed'))
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
  transition: background 0.2s ease;
}

.main-wrapper {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.24s ease;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 250;
  background: rgba(15, 23, 42, 0.42);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.sidebar-backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}

:global(body.sidebar-open) {
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 1.45rem;
  margin-top: 62px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
  transition: background 0.2s ease;
}

.app-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  max-width: 1440px;
  margin: 0 auto 0.9rem;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.app-breadcrumbs a {
  color: #2563eb;
  text-decoration: none;
}

.app-breadcrumbs a::after {
  content: '/';
  margin-left: 0.45rem;
  color: #94a3b8;
}

.app-breadcrumbs a:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.24);
  outline-offset: 3px;
  border-radius: 6px;
}

.app-breadcrumbs span {
  color: #0f172a;
}

:global(body.admin-dark-mode) .app-layout,
:global(body.admin-dark-mode) .main-content {
  background: #0f172a;
}

:global(body.admin-dark-mode) .app-breadcrumbs,
:global(body.admin-dark-mode) .app-breadcrumbs a::after {
  color: #94a3b8;
}

:global(body.admin-dark-mode) .app-breadcrumbs span {
  color: #f8fafc;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>

<style>
body.sidebar-collapsed .main-wrapper {
  margin-left: 88px;
}
</style>

<template>
  <div class="app-layout">
    <AdminSidebar />
    <div class="sidebar-backdrop" @click="closeSidebar"></div>
    <div class="main-wrapper">
      <AppNavbar />
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from './AdminSidebar.vue'
import AppNavbar from './AppNavbar.vue'

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
  margin-left: 248px;
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

:global(body.admin-dark-mode) .app-layout,
:global(body.admin-dark-mode) .main-content {
  background: #0f172a;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>

<style>
body.sidebar-collapsed .main-wrapper {
  margin-left: 72px;
}
</style>

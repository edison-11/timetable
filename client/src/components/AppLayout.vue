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
}

.main-wrapper {
  flex: 1;
  margin-left: 260px;
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
  padding: 2rem;
  margin-top: 70px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>

<style>
body.sidebar-collapsed .main-wrapper {
  margin-left: 0;
}
</style>

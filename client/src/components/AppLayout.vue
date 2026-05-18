<template>
  <div class="app-layout">
    <AdminSidebar />
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
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
}

.main-wrapper {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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

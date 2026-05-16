<template>
  <header class="app-navbar">
    <button class="menu-toggle" type="button" @click="toggleSidebar">
      <span></span><span></span><span></span>
    </button>

    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="Search anything..." @keyup.enter="runSearch">
      <span class="search-icon">Search</span>
    </div>

    <div class="navbar-right">
      <button class="notifications-btn" type="button" title="Notifications" @click="goToDashboardNotifications">
        <span>Bell</span>
        <span class="badge">3</span>
      </button>

      <button class="user-menu" type="button" title="Sign out" @click="logout">
        <div class="user-avatar">A</div>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

const toggleSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.toggle('mobile-open')
}

const runSearch = () => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return

  const destinations = [
    { terms: ['dashboard', 'home', 'overview'], path: '/dashboard' },
    { terms: ['timetable', 'schedule'], path: '/timetable' },
    { terms: ['class', 'classes'], path: '/classes' },
    { terms: ['subject', 'module', 'modules'], path: '/modules' },
    { terms: ['room', 'rooms', 'classroom'], path: '/rooms' },
    { terms: ['teacher', 'teachers'], path: '/teachers' },
    { terms: ['section', 'sections'], path: '/sections' },
    { terms: ['assignment', 'assignments'], path: '/assignments' },
    { terms: ['shift', 'shifts'], path: '/shifts' },
    { terms: ['setting', 'settings'], path: '/settings' }
  ]
  const destination = destinations.find(item => item.terms.some(term => term.includes(query) || query.includes(term)))

  if (destination) router.push(destination.path)
}

const goToDashboardNotifications = () => {
  router.push({ path: '/dashboard', hash: '#notifications' })
}

const logout = () => {
  authStore.logout()
  localStorage.removeItem('token')
  localStorage.removeItem('userType')
  router.push('/login')
}
</script>

<style scoped>
.app-navbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 240px;
  height: 70px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 100;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.menu-toggle span {
  width: 20px;
  height: 2px;
  background: #64748b;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-bar input {
  width: 100%;
  height: 42px;
  padding: 0 4rem 0 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  outline: none;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.75rem;
  pointer-events: none;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notifications-btn {
  position: relative;
  width: 42px;
  height: 42px;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.65rem;
  color: #475569;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0 5px;
  border-radius: 999px;
}

.user-menu {
  background: transparent;
  border: none;
  padding: 0;
}

.user-avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

@media (max-width: 768px) {
  .app-navbar {
    left: 0;
  }
  .menu-toggle {
    display: flex;
  }
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard_Final.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('@/views/Teachers.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/modules',
      name: 'Modules',
      component: () => import('@/views/Modules.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/classes',
      name: 'Classes',
      component: () => import('@/views/Classes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sections',
      name: 'Sections',
      component: () => import('@/views/Sections.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rooms',
      name: 'Rooms',
      component: () => import('@/views/Rooms.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/shifts',
      name: 'Shifts',
      component: () => import('@/views/Shifts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/assignments',
      name: 'Assignments',
      component: () => import('@/views/Assignments.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bus-routes',
      name: 'BusRoutes',
      component: () => import('@/views/BusRoutes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/timetable',
      name: 'Timetable',
      component: () => import('@/views/Timetable.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

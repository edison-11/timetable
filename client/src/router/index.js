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
      component: () => import('@/views/Dashboard_Fixed.vue'),
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
    },
    {
      path: '/teacher/register',
      name: 'TeacherRegister',
      component: () => import('@/views/TeacherRegister.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/teacher/login',
      name: 'TeacherLogin',
      component: () => import('@/views/TeacherLogin.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/teacher/dashboard',
      name: 'TeacherDashboard',
      component: () => import('@/views/TeacherDashboard.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/under-timetable',
      name: 'UnderTimetable',
      component: () => import('@/views/UnderTimetable.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')
  const needsAuthCheck = token && (to.meta.requiresAuth || to.meta.requiresTeacherAuth || to.meta.requiresGuest)

  if (needsAuthCheck && !authStore.user) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresTeacherAuth && !authStore.isTeacherAuthenticated) {
    next('/teacher/login')
  } else if (to.meta.requiresAuth && !authStore.isAdminAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest) {
    if (authStore.isTeacherAuthenticated) {
      next('/teacher/dashboard')
    } else if (authStore.isAdminAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

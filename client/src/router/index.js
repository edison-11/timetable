import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 90,
        behavior: 'smooth'
      }
    }

    return { top: 0 }
  },
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
      component: () => import('@/views/Dashboard.vue'),
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
      path: '/rooms',
      name: 'Rooms',
      component: () => import('@/views/Rooms.vue'),
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
      component: () => import('@/views/TeacherRegister.vue')
    },
    {
      path: '/teacher/settings',
      name: 'TeacherSettings',
      component: () => import('@/views/TeacherSettings.vue'),
      meta: { requiresTeacherAuth: true }
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
      component: () => import('@/views/TeacherDashboardComplete.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/teacher/timetable',
      name: 'TeacherTimetable',
      component: () => import('@/views/TeacherTimetableComplete.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/teacher/profile',
      name: 'TeacherProfile',
      component: () => import('@/views/TeacherProfileComplete.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/teacher/requests',
      name: 'TeacherRequests',
      component: () => import('@/views/TeacherRequestsComplete.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/teacher/announcements',
      name: 'TeacherAnnouncements',
      component: () => import('@/views/TeacherAnnouncementsComplete.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/student-portal',
      name: 'StudentPortal',
      component: () => import('@/views/StudentPortal.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/teacher-portal',
      name: 'TeacherPortal',
      component: () => import('@/views/TeacherPortal.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')
  
  // Simple authentication check
  const isAuthenticated = !!token
  const isTeacher = userType === 'teacher'
  
  if (to.meta.requiresTeacherAuth && (!isAuthenticated || !isTeacher)) {
    next('/teacher/login')
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    if (isTeacher) {
      next('/teacher/dashboard')
    } else {
      next('/dashboard')
    }
  } else {
    next()
  }
})

export default router

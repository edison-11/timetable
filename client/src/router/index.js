import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'

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
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dos/register',
      name: 'DosRegister',
      component: () => import('@/views/DosRegister.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/ResetPassword.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/account-status',
      name: 'AccountStatus',
      component: () => import('@/views/AccountStatus.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/super-admin/dashboard',
      name: 'SuperAdminDashboard',
      component: () => import('@/views/SuperAdminDashboard.vue'),
      meta: { requiresAdminAuth: true, roles: ['super_admin'] }
    },
    {
      path: '/super-admin/schools',
      name: 'SuperAdminSchools',
      component: () => import('@/views/SuperAdminSchools.vue'),
      meta: { requiresAdminAuth: true, roles: ['super_admin'] }
    },
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('@/views/Teachers.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/modules',
      name: 'Modules',
      component: () => import('@/views/Modules.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/classes',
      name: 'Classes',
      component: () => import('@/views/Classes.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/students',
      name: 'Students',
      component: () => import('@/views/Students.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/sections',
      name: 'Sections',
      component: () => import('@/views/Sections.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/shifts',
      name: 'Shifts',
      component: () => import('@/views/Shifts.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/rooms',
      name: 'Rooms',
      component: () => import('@/views/Rooms.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/assignments',
      name: 'Assignments',
      component: () => import('@/views/Assignments.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/timetable',
      name: 'Timetable',
      component: () => import('@/views/Timetable.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/teacher/register',
      name: 'TeacherRegister',
      redirect: '/register'
    },
    {
      path: '/teacher/settings',
      name: 'TeacherSettings',
      component: () => import('@/views/TeacherSettings.vue'),
      meta: { requiresTeacherAuth: true }
    },
    {
      path: '/teacher/login',
      name: 'LegacyTeacherLoginRedirect',
      redirect: '/login'
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
      path: '/teacher/attendance',
      name: 'TeacherAttendance',
      component: () => import('@/views/TeacherAttendance.vue'),
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
      redirect: '/student/dashboard'
    },
    {
      path: '/student/dashboard',
      name: 'StudentDashboard',
      component: () => import('@/views/StudentPortal.vue'),
      meta: { requiresStudentAuth: true }
    },
    {
      path: '/teacher-portal',
      name: 'TeacherPortal',
      component: () => import('@/views/TeacherPortal.vue'),
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const loadingStore = useLoadingStore()
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')

  if (to.fullPath !== from.fullPath) {
    loadingStore.startRoute()
  }
  
  // Simple authentication check
  const isAuthenticated = !!token
  const isTeacher = userType === 'teacher'
  const isStudent = userType === 'student'
  const isAdmin = ['dos', 'super_admin'].includes(userType)

  const roleHome = () => {
    if (userType === 'super_admin') return '/super-admin/dashboard'
    if (userType === 'dos') return '/dashboard'
    if (userType === 'teacher') return '/teacher/dashboard'
    if (userType === 'student') return '/student/dashboard'
    return '/login'
  }

  if (to.path === '/login' && isAuthenticated && isTeacher) {
    next('/teacher/dashboard')
    return
  }

  if (to.meta.requiresAdminAuth) {
    if (!isAuthenticated || !isAdmin) {
      next(roleHome())
      return
    }

    const isStillAdmin = await authStore.checkAuth()
    if (!isStillAdmin || !['dos', 'super_admin'].includes(authStore.currentUserType)) {
      next(roleHome())
      return
    }

    if (to.meta.roles?.length && !to.meta.roles.includes(authStore.currentUserType)) {
      next(roleHome())
      return
    }

    next()
  } else if (to.meta.requiresTeacherAuth) {
    if (!isAuthenticated || !isTeacher) {
      next('/login')
      return
    }

    const isStillTeacher = await authStore.checkAuth()
    if (!isStillTeacher || authStore.currentUserType !== 'teacher') {
      next('/login')
      return
    }

    next()
  } else if (to.meta.requiresStudentAuth && (!isAuthenticated || !isStudent)) {
    next('/login')
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    if (isTeacher) {
      next('/teacher/dashboard')
    } else if (isStudent) {
      next('/student/dashboard')
    } else if (userType === 'super_admin') {
      next('/super-admin/dashboard')
    } else {
      next('/dashboard')
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  useLoadingStore().finishRoute()
})

router.onError(() => {
  useLoadingStore().finishRoute()
})

export default router

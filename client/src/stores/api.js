import axios from 'axios'
import { useAuthStore } from './auth'
import { useLoadingStore } from './loading'
import { useNotificationStore } from './notifications'

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL

  if (configuredUrl) {
    return configuredUrl
  }

  const { hostname, port, protocol } = window.location

  if (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    port !== '5000'
  ) {
    return `${protocol}//${hostname}:5000/api`
  }

  return '/api'
}

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000
})

// Normalize backend validation errors
const normalizeApiErrorMessage = (error) => {
  const data = error.response?.data

  // If no data or message already exists, stop
  if (!data || data.message) return

  // Convert validation errors array into one readable message
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    data.message = data.errors
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(', ')
  }
}

const isMutationRequest = (config) => {
  const method = (config?.method || 'get').toLowerCase()
  return ['post', 'put', 'patch', 'delete'].includes(method)
}

const successMessageFor = (response) => {
  if (response.data?.message) return response.data.message

  const method = (response.config?.method || '').toLowerCase()
  if (method === 'post') return 'Created successfully.'
  if (['put', 'patch'].includes(method)) return 'Updated successfully.'
  if (method === 'delete') return 'Deleted successfully.'
  return 'Action completed successfully.'
}

const tenantScopedPrefixes = [
  '/assignments',
  '/classes',
  '/dashboard',
  '/modules',
  '/notifications',
  '/rooms',
  '/sections',
  '/shifts',
  '/students',
  '/teachers',
  '/timetable'
]

const shouldAttachSchoolContext = (config) => {
  const authStore = useAuthStore()
  const userType = authStore.userType || localStorage.getItem('userType')
  const url = String(config.url || '')

  return userType === 'super_admin' && tenantScopedPrefixes.some((prefix) => url.startsWith(prefix))
}

const getSelectedSchoolId = () => {
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
    : ''
  const routeSchoolId = hashQuery ? new URLSearchParams(hashQuery).get('school_id') : ''

  if (routeSchoolId) {
    localStorage.setItem('selectedSchoolId', routeSchoolId)
    return routeSchoolId
  }

  return localStorage.getItem('selectedSchoolId')
}

const attachSelectedSchoolContext = (config) => {
  if (!shouldAttachSchoolContext(config)) return

  const selectedSchoolId = getSelectedSchoolId()
  if (!selectedSchoolId) return

  config.params = {
    ...(config.params || {}),
    school_id: config.params?.school_id || selectedSchoolId
  }

  if (
    isMutationRequest(config) &&
    config.data &&
    typeof config.data === 'object' &&
    !(config.data instanceof FormData) &&
    !Array.isArray(config.data)
  ) {
    config.data = {
      ...config.data,
      school_id: config.data.school_id || selectedSchoolId
    }
  }
}

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const loadingStore = useLoadingStore()

    if (config.showGlobalLoader !== false) {
      loadingStore.startRequest()
      config.globalLoaderStarted = true
    }

    let token = authStore.token

    // Fallback to localStorage if token not in store
    if (!token) {
      token = localStorage.getItem('token')
    }

    // Attach token to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    attachSelectedSchoolContext(config)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    if (response.config?.globalLoaderStarted) {
      useLoadingStore().finishRequest()
    }

    if (
      response.config?.showGlobalNotification !== false &&
      isMutationRequest(response.config)
    ) {
      useNotificationStore().success(successMessageFor(response))
    }

    return response
  },

  (error) => {
    const authStore = useAuthStore()

    if (error.config?.globalLoaderStarted) {
      useLoadingStore().finishRequest()
    }

    // Normalize validation error messages
    normalizeApiErrorMessage(error)

    if (error.config?.showGlobalNotification !== false) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Request failed'
      useNotificationStore().error(message)
    }

    // Prevent redirect loop on login request
    const isLoginRequest =
      error.config?.url?.includes('/login') || false

    // Handle unauthorized access
    if (error.response?.status === 401 && !isLoginRequest) {
      const userType = localStorage.getItem('userType')

      // Teacher logout handling
      if (userType === 'teacher') {
        localStorage.removeItem('token')
        localStorage.removeItem('teacher')
        localStorage.removeItem('userType')

        window.location.hash = '#/login'
      }

      // Admin logout handling
      else {
        authStore.logout()
        window.location.hash = '#/login'
      }
    }

    if (error.response?.status === 403 && ['SCHOOL_ACCESS_DISABLED', 'ACCOUNT_NOT_ACTIVE', 'SCHOOL_CONTEXT_REQUIRED'].includes(error.response?.data?.code)) {
      const reason = error.response.data.school_status || (error.response.data.code === 'ACCOUNT_NOT_ACTIVE' ? 'account' : 'deactivated')
      const message = encodeURIComponent(error.response.data.message || 'Please contact system administration.')
      authStore.logout()
      window.location.hash = `#/account-status?reason=${encodeURIComponent(reason)}&message=${message}`
    }

    return Promise.reject(error)
  }
)

export default api

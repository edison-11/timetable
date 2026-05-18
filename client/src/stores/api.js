import axios from 'axios'
import { useAuthStore } from './auth'

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

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    let token = authStore.token

    // Fallback to localStorage if token not in store
    if (!token) {
      token = localStorage.getItem('token')
    }

    // Attach token to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const authStore = useAuthStore()

    // Normalize validation error messages
    normalizeApiErrorMessage(error)

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

        window.location.href = '/teacher/login'
      }

      // Admin logout handling
      else {
        authStore.logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
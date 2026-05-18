import axios from 'axios'
import { useAuthStore } from './auth'

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL
  if (configuredUrl) return configuredUrl

  const { hostname, port, protocol } = window.location

  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '5000') {
    return `${protocol}//${hostname}:5000/api`
  }

  return '/api'
}

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000
})

const normalizeApiErrorMessage = (error) => {
  const data = error.response?.data

  if (!data || data.message) return

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    data.message = data.errors
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(', ')
  }
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    let token = authStore.token
    
    // If no token in store, check localStorage for teacher token
    if (!token) {
      token = localStorage.getItem('token')
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    const config = error.config || {}
    const requestUrl = String(config.url || '')
    const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/teacher-auth/login') || requestUrl.includes('/auth/register')

    if (error.response?.status === 401 && !isLoginRequest) {
      const userType = localStorage.getItem('userType')
      
      if (userType === 'teacher') {
        localStorage.removeItem('token')
        localStorage.removeItem('teacher')
        localStorage.removeItem('userType')
        window.location.href = '/teacher/login'
      } else {
        authStore.logout()
        window.location.href = '/login'
      }
    }
    
    normalizeApiErrorMessage(error)
    return Promise.reject(error)
  }
)

export default api

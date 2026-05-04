import axios from 'axios'
import { useAuthStore } from './auth'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

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
    
    if (error.response?.status === 401) {
      const userType = localStorage.getItem('userType')
      
      if (userType === 'teacher') {
        // Clear teacher auth data
        localStorage.removeItem('token')
        localStorage.removeItem('teacher')
        localStorage.removeItem('userType')
        window.location.href = '/teacher/login'
      } else {
        // Clear admin auth data
        authStore.logout()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

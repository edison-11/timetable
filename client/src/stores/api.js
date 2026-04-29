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
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
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
      authStore.logout()
      // Redirect to login
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api

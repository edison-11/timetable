import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    userType: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdminAuthenticated: (state) => !!state.token && state.userType === 'admin' && state.user?.role === 'admin',
    isTeacherAuthenticated: (state) => !!state.token && state.userType === 'teacher',
    currentUser: (state) => state.user,
    currentUserType: (state) => state.userType
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        let response
        let loginType = 'admin'

        try {
          response = await axios.post('/api/auth/login', credentials)
        } catch (error) {
          // If admin login fails, try teacher login
          if (error.response?.status === 401 || error.response?.status === 403) {
            response = await axios.post('/api/teacher-auth/login', credentials)
            loginType = 'teacher'
          } else {
            throw error
          }
        }

        const { token } = response.data
        const user = loginType === 'teacher' ? response.data.teacher : response.data.user
        
        this.token = token
        this.user = user
        this.userType = loginType
        
        localStorage.setItem('token', token)
        localStorage.setItem('userType', loginType)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

        if (loginType === 'teacher') {
          localStorage.setItem('teacher', JSON.stringify(user))
        } else {
          localStorage.removeItem('teacher')
        }
        
        return { success: true, userType: loginType }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/register', userData)
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        this.userType = 'admin'
        
        localStorage.setItem('token', token)
        localStorage.setItem('userType', 'admin')
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.userType = null
      this.error = null
      
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
      localStorage.removeItem('teacher')
      delete axios.defaults.headers.common['Authorization']
    },

    async checkAuth() {
      const token = this.token || localStorage.getItem('token')
      const userType = this.userType || localStorage.getItem('userType') || 'admin'

      if (!token) {
        this.logout()
        return false
      }

      this.token = token
      this.userType = userType
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      try {
        if (userType === 'teacher') {
          const response = await axios.get('/api/teacher-auth/me')
          this.user = response.data.teacher
          localStorage.setItem('userType', 'teacher')
          return true
        }

        const response = await axios.get('/api/auth/me')
        const user = response.data.user

        if (user?.role !== 'admin') {
          this.logout()
          return false
        }

        this.user = user
        this.userType = 'admin'
        localStorage.setItem('userType', 'admin')
        localStorage.removeItem('teacher')
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  }
})

import { defineStore } from 'pinia'
import api from './api'

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
        const response = await api.post('/auth/login', credentials)

        const { token } = response.data
        const user = response.data.user
        const loginType = user?.role || response.data.role || 'admin'
        
        this.token = token
        this.user = user
        this.userType = loginType
        
        localStorage.setItem('token', token)
        localStorage.setItem('userType', loginType)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        if (loginType === 'teacher') {
          localStorage.setItem('teacher', JSON.stringify(user))
          localStorage.removeItem('user')
        } else {
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.removeItem('teacher')
        }
        
        return { success: true, userType: loginType, user, redirectTo: response.data.redirectTo }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.errors?.[0]?.msg ||
          error?.response?.data?.errors?.[0]?.message ||
          'Login failed'
        this.error = message
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.post('/auth/register', userData)
        if (response.status === 202) {
          return {
            success: true,
            requiresOtp: true,
            email: response.data.email,
            role: response.data.role,
            expiresInSeconds: response.data.expires_in_seconds,
            resendCooldownSeconds: response.data.resend_cooldown_seconds
          }
        }

        const { token, user } = response.data
        const userType = user?.role || response.data.role || userData.role || 'teacher'
        
        this.token = token
        this.user = user
        this.userType = userType
        
        localStorage.setItem('token', token)
        localStorage.setItem('userType', userType)
        if (userType === 'teacher') {
          localStorage.setItem('teacher', JSON.stringify(user))
          localStorage.removeItem('user')
        } else {
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.removeItem('teacher')
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        return { success: true, userType, redirectTo: response.data.redirectTo }
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
      localStorage.removeItem('user')
      localStorage.removeItem('teacher')
      delete api.defaults.headers.common['Authorization']
    },

    async updateProfile(profileData) {
      this.loading = true
      this.error = null

      try {
        const endpoint = this.userType === 'teacher'
          ? '/teacher-auth/me'
          : '/auth/me'
        const token = this.token || localStorage.getItem('token')
        const response = await api.put(endpoint, profileData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const user = this.userType === 'teacher'
          ? response.data.teacher
          : response.data.user

        this.user = user

        if (this.userType === 'teacher') {
          localStorage.setItem('teacher', JSON.stringify(user))
        } else {
          localStorage.setItem('user', JSON.stringify(user))
        }

        return { success: true, user }
      } catch (error) {
        this.error = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Profile update failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async checkAuth() {
      const token = this.token || localStorage.getItem('token')
      const storedUserType = this.userType || localStorage.getItem('userType')
      const userType = storedUserType || (localStorage.getItem('teacher') ? 'teacher' : localStorage.getItem('user') ? 'admin' : null)

      if (!token) {
        this.logout()
        return false
      }

      if (!userType) {
        this.logout()
        return false
      }

      this.token = token
      this.userType = userType
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      const cachedUser = userType === 'teacher'
        ? localStorage.getItem('teacher')
        : localStorage.getItem('user')

      if (cachedUser) {
        try {
          this.user = JSON.parse(cachedUser)
        } catch (error) {
          this.user = null
        }
      }

      try {
        if (userType === 'teacher') {
          const response = await api.get('/teacher-auth/me')
          this.user = response.data.teacher
          localStorage.setItem('userType', 'teacher')
          localStorage.setItem('teacher', JSON.stringify(this.user))
          return true
        }

        const response = await api.get('/auth/me')
        const user = response.data.user

        if (!['admin', 'student'].includes(user?.role)) {
          this.logout()
          return false
        }

        this.user = user
        this.userType = user.role
        localStorage.setItem('userType', user.role)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.removeItem('teacher')
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  }
})

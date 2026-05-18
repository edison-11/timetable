import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    visible: true,
    bootLoading: true,
    routeLoading: false,
    pendingRequests: 0,
    hideTimer: null
  }),

  getters: {
    isLoading: (state) => state.visible
  },

  actions: {
    show() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer)
        this.hideTimer = null
      }

      this.visible = true
    },

    scheduleHide(delay = 520) {
      if (this.bootLoading || this.routeLoading || this.pendingRequests > 0) return

      if (this.hideTimer) clearTimeout(this.hideTimer)

      this.hideTimer = setTimeout(() => {
        this.visible = false
        this.hideTimer = null
      }, delay)
    },

    startBoot() {
      this.bootLoading = true
      this.show()
    },

    finishBoot() {
      this.bootLoading = false
      this.scheduleHide(650)
    },

    startRoute() {
      this.routeLoading = true
      this.show()
    },

    finishRoute() {
      this.routeLoading = false
      this.scheduleHide()
    },

    startRequest() {
      this.pendingRequests += 1
      this.show()
    },

    finishRequest() {
      this.pendingRequests = Math.max(this.pendingRequests - 1, 0)
      this.scheduleHide()
    }
  }
})

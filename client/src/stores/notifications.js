import { defineStore } from 'pinia'

let nextId = 1
const timers = new Map()

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: []
  }),

  actions: {
    push(notification) {
      const id = nextId++
      const timeout = notification.timeout ?? 4200
      const item = {
        id,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        timeout,
        progress: 1,
        complete: false
      }

      this.items.push(item)

      const progressTimer = window.setInterval(() => {
        const current = this.items.find((entry) => entry.id === id)
        if (!current) {
          window.clearInterval(progressTimer)
          timers.delete(id)
          return
        }

        current.progress = Math.min(100, current.progress + 4)

        if (current.progress >= 100) {
          current.complete = true
          window.clearInterval(progressTimer)

          if (timeout > 0) {
            const dismissTimer = window.setTimeout(() => {
              this.remove(id)
            }, timeout)
            timers.set(id, dismissTimer)
          } else {
            timers.delete(id)
          }
        }
      }, 32)

      timers.set(id, progressTimer)

      return id
    },

    success(message, title = 'Success') {
      return this.push({ type: 'success', title, message })
    },

    error(message, title = 'Error') {
      return this.push({ type: 'error', title, message, timeout: 5200 })
    },

    info(message, title = 'Info') {
      return this.push({ type: 'info', title, message })
    },

    warning(message, title = 'Warning') {
      return this.push({ type: 'warning', title, message })
    },

    remove(id) {
      const timer = timers.get(id)
      if (timer) {
        window.clearInterval(timer)
        window.clearTimeout(timer)
        timers.delete(id)
      }
      this.items = this.items.filter((item) => item.id !== id)
    }
  }
})

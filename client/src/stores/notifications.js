import { defineStore } from 'pinia'

let nextId = 1

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
        timeout
      }

      this.items.push(item)

      if (timeout > 0) {
        window.setTimeout(() => {
          this.remove(id)
        }, timeout)
      }

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
      this.items = this.items.filter((item) => item.id !== id)
    }
  }
})

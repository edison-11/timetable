import { useNotificationStore } from '@/stores/notifications'

export const notifySuccess = (message, title = 'Success') => {
  useNotificationStore().success(message, title)
}

export const notifyError = (message, title = 'Error') => {
  useNotificationStore().error(message, title)
}

export const notifyInfo = (message, title = 'Info') => {
  useNotificationStore().info(message, title)
}

export const notifyWarning = (message, title = 'Warning') => {
  useNotificationStore().warning(message, title)
}

export const notifyFromError = (error, fallback = 'Request failed') => {
  notifyError(error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback)
}

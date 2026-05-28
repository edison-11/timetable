import api from '@/stores/api'

const getApiRoot = () => {
  const baseUrl = api.defaults.baseURL || ''
  if (!/^https?:\/\//i.test(baseUrl)) return ''

  return baseUrl.replace(/\/api\/?$/, '')
}

export const resolveAssetUrl = (path) => {
  const value = String(path || '').trim()
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  if (normalizedPath.startsWith('/uploads/')) return normalizedPath

  const apiRoot = getApiRoot()

  return apiRoot ? `${apiRoot}${normalizedPath}` : normalizedPath
}

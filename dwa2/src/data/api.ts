export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const authHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

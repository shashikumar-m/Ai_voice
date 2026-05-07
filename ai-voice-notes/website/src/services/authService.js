import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password }).then(r => r.data)

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export function saveSession(data) {
  localStorage.setItem('auth_token', data.access_token)
  localStorage.setItem('auth_user', JSON.stringify(data.user))
  localStorage.setItem('auth_mode', 'loggedIn')
}

export function saveGuestMode() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.setItem('auth_mode', 'guest')
}

export function clearSession() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_mode')
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('auth_user')) } catch { return null }
}

export function getAuthMode() {
  return localStorage.getItem('auth_mode')
}

export function getToken() {
  return localStorage.getItem('auth_token')
}

export function isAuthenticated() {
  return getAuthMode() !== null
}

export { api }

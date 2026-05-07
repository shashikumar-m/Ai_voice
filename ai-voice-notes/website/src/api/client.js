import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
})

// Inject auth token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Notes
export const getNotes = (params = {}) =>
  api.get('/notes', { params }).then(r => r.data)

export const getNoteById = (id) =>
  api.get(`/notes/${id}`).then(r => r.data)

export const deleteNote = (id) =>
  api.delete(`/notes/${id}`).then(r => r.data)

export const getPdfUrl = (id) => `${BASE_URL}/notes/${id}/export/pdf`

export const downloadPdf = async (id, title) => {
  const response = await api.get(`/notes/${id}/export/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${title || 'note'}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// Upload — don't override headers, let interceptor add auth token
export const uploadFile = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  }).then(r => r.data)

// Live Meeting
export const startMeeting = () =>
  api.post('/meeting/start').then(r => r.data)

export const endMeeting = (id) =>
  api.post(`/meeting/${id}/end`).then(r => r.data)

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api'

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE_URL })

export const uploadFile = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })

export const getNotes = (params = {}) => api.get('/notes', { params })
export const getNoteById = id => api.get(`/notes/${id}`)
export const deleteNote = id => api.delete(`/notes/${id}`)
export const getPdfUrl = id => `${BASE_URL}/notes/${id}/export/pdf`

export const startMeeting = () => api.post('/meeting/start')
export const endMeeting = id => api.post(`/meeting/${id}/end`)

export const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api')

import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Notes from './pages/Notes'
import NoteDetail from './pages/NoteDetail'
import Profile from './pages/Profile'
import History from './pages/History'
import Share from './pages/Share'
import Auth from './pages/Auth'
import { getAuthMode } from './services/authService'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

export default function App() {
  // Check auth synchronously — localStorage is always available immediately
  const [authed, setAuthed] = useState(() => getAuthMode() !== null)

  if (!authed) return (
    <ThemeProvider>
      <Auth onDone={() => setAuthed(true)} />
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px' },
      }} />
    </ThemeProvider>
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar onLogout={() => {
          setAuthed(false)
          // Clear query cache so notes don't show from previous user
          queryClient.clear()
        }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/profile" element={<Profile onLogout={() => {
            setAuthed(false)
            queryClient.clear()
          }} />} />
          <Route path="/history" element={<History />} />
          <Route path="/share" element={<Share />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { Mic, Menu, X, LogOut, ChevronDown, LayoutDashboard, Upload, History, Share2, UserCircle, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStoredUser, getAuthMode, clearSession } from '../services/authService'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const links = [
  { to: '/',          label: 'Home',      icon: Mic            },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload',    label: 'Upload',    icon: Upload          },
  { to: '/history',   label: 'History',   icon: History         },
  { to: '/share',     label: 'Share',     icon: Share2          },
]

function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="relative w-14 h-7 rounded-full border border-slate-600 bg-slate-800 flex items-center px-1 transition-colors hover:border-indigo-500/50"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Track */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.15)' }}
        transition={{ duration: 0.3 }}
      />
      {/* Thumb */}
      <motion.div
        className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
        animate={{
          x: isDark ? 0 : 28,
          backgroundColor: isDark ? '#6366f1' : '#f59e0b',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Moon size={11} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sun size={11} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  )
}

export default function Navbar({ onLogout }) {
  const { pathname } = useLocation()
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  const user = getStoredUser()
  const isGuest = getAuthMode() === 'guest'

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    clearSession()
    toast.success('Signed out')
    onLogout?.()
  }

  const navBg    = isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'
  const linkBase = isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  const linkActive = isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
  const mobileBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
  const dropBg   = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-xl'
  const dropText = isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
  const logoText = isDark ? 'text-white' : 'text-gray-900'
  const userText = isDark ? 'text-slate-300' : 'text-gray-700'
  const mobileLink = (active) => active
    ? 'bg-indigo-600 text-white'
    : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Mic size={18} className="text-white" />
            </div>
            <span className={`font-bold text-lg hidden sm:block ${logoText}`}>
              AI Voice <span className="text-indigo-500">Notes</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === l.to ? linkActive : linkBase
                }`}>
                <l.icon size={16} />
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isGuest ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-semibold rounded-full border border-amber-500/30">
                  Guest Mode
                </span>
                <button onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
                  Sign In
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setDropOpen(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <span className={`text-sm font-medium ${userText}`}>{user?.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border py-2 z-50 ${dropBg}`}
                    >
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setDropOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dropText}`}>
                        <UserCircle size={15} /> Profile
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t px-4 py-3 space-y-1 overflow-hidden ${mobileBg}`}
          >
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mobileLink(pathname === l.to)}`}>
                <l.icon size={18} />
                {l.label}
              </Link>
            ))}
            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              {isGuest ? (
                <button onClick={handleLogout} className="w-full text-center py-2 text-indigo-500 text-sm font-semibold">
                  Sign In / Register
                </button>
              ) : (
                <div className="px-4 py-2">
                  <Link to="/profile" onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <UserCircle size={14} /> Profile
                  </Link>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                  <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user?.email}</p>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-medium">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Shield, Bell, Moon, Globe, Trash2, 
  Download, Key, LogOut, Camera, Check, ChevronRight,
  Award, FileText, Clock, Calendar
} from 'lucide-react'
import { getStoredUser, clearSession, getAuthMode } from '../services/authService'
import toast from 'react-hot-toast'

const settings = [
  { icon: Bell, label: 'Notifications', desc: 'Email alerts for new features', key: 'notifications' },
  { icon: Moon, label: 'Dark Mode', desc: 'Use dark theme (always on)', key: 'darkMode' },
  { icon: Globe, label: 'Language', desc: 'Interface language', key: 'language' },
  { icon: Shield, label: 'Privacy', desc: 'Data and privacy settings', key: 'privacy' },
]

export default function Profile({ onLogout }) {
  const user = getStoredUser()
  const isGuest = getAuthMode() === 'guest'
  
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [editing, setEditing] = useState(false)
  const [toggles, setToggles] = useState({
    notifications: true,
    darkMode: true,
    language: false,
    privacy: false,
  })

  const handleSave = () => {
    setEditing(false)
    toast.success('Profile updated!')
  }

  const handleLogout = () => {
    clearSession()
    toast.success('Signed out')
    onLogout?.()
  }

  const handleExport = () => {
    toast.success('Export started. Check your downloads.')
  }

  const handleDelete = () => {
    if (confirm('Are you sure? This will permanently delete your account and all data.')) {
      toast.success('Account deleted')
      onLogout?.()
    }
  }

  // Mock stats
  const stats = {
    notes: 24,
    hours: 12.5,
    streak: 7,
    joined: 'Jan 2025',
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Profile Settings</h1>
          <p className="text-slate-400 text-sm">Manage your account and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6"
        >
          <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-black/20" />
          </div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-slate-800 shadow-xl">
                  <span className="text-white text-3xl font-bold">
                    {name?.[0]?.toUpperCase() || 'G'}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-slate-800 hover:bg-indigo-500 transition-colors">
                  <Camera size={14} className="text-white" />
                </button>
              </div>
              
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3 mt-4">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-white">{name || 'Guest User'}</h2>
                    <p className="text-slate-400 text-sm">{email || 'No email set'}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2"
                    >
                      <Check size={16} /> Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {isGuest && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm">
                  You're in Guest Mode. Sign in to save your data permanently.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {[
            { icon: FileText, label: 'Notes', value: stats.notes, color: 'text-indigo-400' },
            { icon: Clock, label: 'Hours', value: stats.hours, color: 'text-purple-400' },
            { icon: Award, label: 'Day Streak', value: stats.streak, color: 'text-yellow-400' },
            { icon: Calendar, label: 'Joined', value: stats.joined, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-slate-400 text-sm">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Shield size={18} className="text-indigo-400" />
              Preferences
            </h3>
          </div>

          <div className="divide-y divide-slate-700">
            {settings.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <s.icon size={18} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{s.label}</p>
                    <p className="text-slate-400 text-sm">{s.desc}</p>
                  </div>
                </div>
                
                {s.key === 'darkMode' ? (
                  <div className="text-emerald-400 text-sm font-medium">Always On</div>
                ) : (
                  <button
                    onClick={() => setToggles(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      toggles[s.key] ? 'bg-indigo-600' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      toggles[s.key] ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Key size={18} className="text-indigo-400" />
              Account
            </h3>
          </div>

          <div className="divide-y divide-slate-700">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Download size={18} className="text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Export Data</p>
                  <p className="text-slate-400 text-sm">Download all your notes</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                  <LogOut size={18} className="text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Sign Out</p>
                  <p className="text-slate-400 text-sm">Log out of your account</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-red-400 font-medium">Delete Account</p>
                  <p className="text-slate-400 text-sm">Permanently delete your data</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-slate-500 text-sm"
        >
          <p>AI Voice Notes v1.0.0</p>
          <p className="mt-1">Built with Groq AI • Whisper • LLaMA 3.3</p>
        </motion.div>
      </div>
    </div>
  )
}

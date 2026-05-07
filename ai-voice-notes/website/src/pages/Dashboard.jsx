import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, Upload, FileText, Clock, TrendingUp,
  PlayCircle, Video, Brain, Zap, Calendar,
  ChevronRight, Activity, Target, Award, Sparkles, ArrowUpRight
} from "lucide-react"
import { getNotes } from "../api/client"
import { getStoredUser } from "../services/authService"

const quickActions = [
  { icon: Upload,     label: "Upload File",  to: "/upload",          color: "from-indigo-500 to-purple-600", glow: "shadow-indigo-500/30", desc: "Audio or video" },
  { icon: PlayCircle, label: "YouTube Link", to: "/upload?tab=youtube", color: "from-red-500 to-rose-600",   glow: "shadow-red-500/30",    desc: "Paste URL"      },
  { icon: FileText,   label: "My Notes",     to: "/history",         color: "from-emerald-500 to-teal-600",  glow: "shadow-emerald-500/30",desc: "View all"       },
]

const statCards = [
  { icon: FileText, label: "Total Notes",    key: "notes",    color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { icon: Clock,    label: "Hours Recorded", key: "hours",    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { icon: Brain,    label: "AI Summaries",   key: "summaries",color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20"   },
  { icon: Target,   label: "Keywords Found", key: "keywords", color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
]

function CountUp({ target, duration = 1500 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{count}</span>
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("week")
  const [hoveredBar, setHoveredBar] = useState(null)
  const user = getStoredUser()

  const { data, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes({ limit: 100 }),
    select: d => d.notes,
  })

  const stats = {
    notes:     data?.length || 0,
    hours:     data ? Math.round(data.reduce((a, n) => a + (n.duration || 0), 0) / 3600) : 0,
    summaries: data?.length || 0,
    keywords:  data ? data.reduce((a, n) => a + (n.keywords?.length || 0), 0) : 0,
  }

  const recentNotes = data?.slice(0, 5) || []

  const activityData = [
    { day: "Mon", value: 4 }, { day: "Tue", value: 7 }, { day: "Wed", value: 3 },
    { day: "Thu", value: 8 }, { day: "Fri", value: 5 }, { day: "Sat", value: 2 }, { day: "Sun", value: 6 },
  ]
  const maxVal = Math.max(...activityData.map(d => d.value))

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-16">
      {/* Subtle background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm mb-1">{greeting()}, {user?.name || "there"} 👋</p>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700">
              {["day", "week", "month"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === r ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.to}
              className="group relative overflow-hidden bg-slate-800 rounded-2xl border border-slate-700 p-6 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-all duration-500`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:${a.glow} transition-all`}>
                <a.icon size={22} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{a.label}</h3>
              <p className="text-slate-400 text-sm">{a.desc}</p>
              <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }}
              className={`bg-slate-800 rounded-2xl border ${s.border} p-5 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className={`text-3xl font-black ${s.color} mb-1`}>
                {isLoading ? "..." : <CountUp target={stats[s.key]} />}
              </div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" /> Activity Overview
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Notes Created
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-40 mb-3">
              {activityData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                  <AnimatePresence>
                    {hoveredBar === i && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-slate-700 text-white text-xs px-2 py-1 rounded-lg font-bold">
                        {d.value}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    className={`w-full rounded-lg transition-colors ${hoveredBar === i ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-gradient-to-t from-indigo-600/60 to-indigo-400/60"}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / maxVal) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              {activityData.map((d, i) => <span key={i}>{d.day}</span>)}
            </div>
          </motion.div>

          {/* Weekly Goal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6">
              <Award size={18} className="text-yellow-400" /> Weekly Goal
            </h3>
            <div className="flex justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" r="60" fill="none" stroke="#1e293b" strokeWidth="12" />
                  <motion.circle cx="72" cy="72" r="60" fill="none"
                    stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="377"
                    initial={{ strokeDashoffset: 377 }}
                    animate={{ strokeDashoffset: 377 - Math.min(377, (stats.notes / 20) * 377) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{stats.notes}</span>
                  <span className="text-slate-400 text-xs">of 20 notes</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-bold">{Math.min(100, Math.round((stats.notes / 20) * 100))}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.notes / 20) * 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-6 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" /> Recent Notes
            </h3>
            <Link to="/history" className="flex items-center gap-1 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-700/50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-slate-500" />
              </div>
              <p className="text-slate-400 mb-4">No notes yet</p>
              <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
                <Upload size={16} /> Upload Your First File
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {recentNotes.map((note, i) => (
                <motion.div key={note.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/notes/${note.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      note.source_type === "youtube" ? "bg-red-500/20" :
                      note.source_type === "video"   ? "bg-purple-500/20" : "bg-indigo-500/20"}`}>
                      {note.source_type === "youtube" ? <PlayCircle size={18} className="text-red-400" /> :
                       note.source_type === "video"   ? <Video size={18} className="text-purple-400" /> :
                       <Mic size={18} className="text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-indigo-400 transition-colors">{note.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {note.duration ? `${Math.floor(note.duration/60)}m` : "N/A"} •{" "}
                        {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-6 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-xl mb-1 flex items-center gap-2">
                <Sparkles size={20} /> Powered by Local AI
              </h3>
              <p className="text-white/70 text-sm">Fine-tuned T5-small + Whisper — no API keys, no cost, 100% private.</p>
            </div>
            <Link to="/upload"
              className="flex-shrink-0 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">
              Try It Now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
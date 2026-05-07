import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Calendar, Clock, Mic, Video, PlayCircle, Trash2, Download, Share2, MoreVertical, ChevronDown, FileText, Tag, SortAsc, Grid, List, Filter } from "lucide-react"
import toast from "react-hot-toast"
import { getNotes, deleteNote } from "../api/client"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "longest", label: "Longest Duration" },
  { value: "alpha",  label: "Alphabetical" },
]
const FILTERS = [
  { value: "all",          label: "All",     icon: FileText   },
  { value: "audio",        label: "Audio",   icon: Mic        },
  { value: "video",        label: "Video",   icon: Video      },
  { value: "youtube",      label: "YouTube", icon: PlayCircle },
  { value: "live_meeting", label: "Live",    icon: Mic        },
]
const srcCfg = {
  audio:        { icon: Mic,        color: "text-indigo-400", bg: "bg-indigo-500/20"  },
  video:        { icon: Video,      color: "text-purple-400", bg: "bg-purple-500/20"  },
  youtube:      { icon: PlayCircle, color: "text-red-400",    bg: "bg-red-500/20"     },
  live_meeting: { icon: Mic,        color: "text-orange-400", bg: "bg-orange-500/20"  },
}

export default function History() {
  const [search, setSearch]           = useState("")
  const [filter, setFilter]           = useState("all")
  const [sortBy, setSortBy]           = useState("newest")
  const [viewMode, setViewMode]       = useState("grid")
  const [selectedNotes, setSelected]  = useState([])
  const [showSort, setShowSort]       = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["notes", search, filter],
    queryFn: () => getNotes({ search, source_type: filter === "all" ? "" : filter, limit: 100 }),
    select: d => d.notes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => { qc.invalidateQueries(["notes"]); toast.success("Note deleted") },
    onError: () => toast.error("Failed to delete note"),
  })

  const sorted = data ? [...data].sort((a, b) => {
    if (sortBy === "oldest")  return new Date(a.created_at) - new Date(b.created_at)
    if (sortBy === "longest") return (b.duration||0) - (a.duration||0)
    if (sortBy === "alpha")   return a.title.localeCompare(b.title)
    return new Date(b.created_at) - new Date(a.created_at)
  }) : []

  const grouped = sorted.reduce((g, note) => {
    const d = new Date(note.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })
    if (!g[d]) g[d] = []
    g[d].push(note)
    return g
  }, {})

  const toggleSelect = id => setSelected(p => p.includes(id) ? p.filter(n => n !== id) : [...p, id])

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-16">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">History</h1>
              <p className="text-slate-400 text-sm">
                {isLoading ? "Loading..." : `${sorted.length} note${sorted.length !== 1 ? "s" : ""} recorded`}
              </p>
            </div>
            <AnimatePresence>
              {selectedNotes.length > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2">
                  <span className="text-slate-300 text-sm">{selectedNotes.length} selected</span>
                  <button onClick={() => { if (confirm(`Delete ${selectedNotes.length} notes?`)) { selectedNotes.forEach(id => deleteMutation.mutate(id)); setSelected([]) } }}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notes, transcripts, keywords..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl border border-slate-700 p-1.5 flex-wrap">
              <Filter size={14} className="text-slate-500 ml-1" />
              {FILTERS.map(f => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                  <f.icon size={14} /> {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative">
                <button onClick={() => setShowSort(!showSort)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:border-slate-600 transition-colors text-sm">
                  <SortAsc size={14} />
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                  <ChevronDown size={14} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10 min-w-[160px]">
                      {SORT_OPTIONS.map(s => (
                        <button key={s.value} onClick={() => { setSortBy(s.value); setShowSort(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors ${sortBy === s.value ? "text-indigo-400 bg-slate-700/50" : "text-slate-300"}`}>
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
                {[{ mode: "grid", icon: Grid }, { mode: "list", icon: List }].map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)}
                    className={`p-2 rounded-lg transition-colors ${viewMode === v.mode ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                    <v.icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-slate-800 rounded-2xl border border-slate-700 h-48 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <FileText size={36} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">{search ? "No notes found" : "No notes yet"}</h3>
            <p className="text-slate-500 text-sm mb-6">{search ? "Try a different search term" : "Start recording to build your history"}</p>
            {!search && (
              <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors">
                Upload Recording
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, notes]) => (
              <motion.div key={date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-slate-400 text-sm font-medium">{date}</span>
                  <span className="text-slate-600 text-xs">({notes.length})</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {notes.map((note, i) => <NoteCard key={note.id} note={note} selected={selectedNotes.includes(note.id)} onSelect={() => toggleSelect(note.id)} onDelete={() => deleteMutation.mutate(note.id)} delay={i * 0.05} />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note, i) => <NoteListItem key={note.id} note={note} selected={selectedNotes.includes(note.id)} onSelect={() => toggleSelect(note.id)} onDelete={() => deleteMutation.mutate(note.id)} delay={i * 0.03} />)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, selected, onSelect, onDelete, delay }) {
  const [showMenu, setShowMenu] = useState(false)
  const s = srcCfg[note.source_type] || srcCfg.audio
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -2 }}
      className={`relative bg-slate-800 rounded-2xl border transition-all overflow-hidden group ${selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-700 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"}`}>
      <div onClick={onSelect}
        className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 transition-all cursor-pointer z-10 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-slate-500 bg-slate-800 opacity-0 group-hover:opacity-100"}`}>
        {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
      </div>
      <Link to={`/notes/${note.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
            <s.icon size={18} className={s.color} />
          </div>
          <div className="relative">
            <button onClick={e => { e.preventDefault(); setShowMenu(!showMenu) }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
              <MoreVertical size={16} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 bg-slate-700 rounded-xl shadow-xl border border-slate-600 overflow-hidden z-20 min-w-[120px]">
                  <button className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 text-sm w-full"><Share2 size={14} /> Share</button>
                  <button className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 text-sm w-full"><Download size={14} /> Export</button>
                  <button onClick={e => { e.preventDefault(); onDelete(); setShowMenu(false) }}
                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm w-full"><Trash2 size={14} /> Delete</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors text-sm">{note.title}</h3>
        <div className="flex items-center gap-3 text-slate-500 text-xs mb-3">
          <span className="flex items-center gap-1"><Clock size={11} />{note.duration ? `${Math.floor(note.duration/60)}m` : "N/A"}</span>
          <span>{new Date(note.created_at).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })}</span>
        </div>
        {note.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.keywords.slice(0,3).map((kw,i) => <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{kw}</span>)}
            {note.keywords.length > 3 && <span className="text-slate-500 text-xs">+{note.keywords.length-3}</span>}
          </div>
        )}
      </Link>
    </motion.div>
  )
}

function NoteListItem({ note, selected, onSelect, onDelete, delay }) {
  const s = srcCfg[note.source_type] || srcCfg.audio
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} whileHover={{ x: 2 }}
      className={`bg-slate-800 rounded-xl border transition-all group ${selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-700 hover:border-indigo-500/40"}`}>
      <div className="flex items-center gap-4 p-4">
        <div onClick={onSelect}
          className={`w-5 h-5 rounded-md border-2 transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-slate-500 bg-slate-800"}`}>
          {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
          <s.icon size={18} className={s.color} />
        </div>
        <Link to={`/notes/${note.id}`} className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate group-hover:text-indigo-400 transition-colors">{note.title}</h3>
          <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5">
            <span className="flex items-center gap-1"><Clock size={11} />{note.duration ? `${Math.floor(note.duration/60)}m ${note.duration%60}s` : "N/A"}</span>
            <span className="flex items-center gap-1"><Tag size={11} />{note.keywords?.length||0} keywords</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"><Share2 size={15} /></button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"><Download size={15} /></button>
          <button onClick={onDelete} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
        </div>
      </div>
    </motion.div>
  )
}
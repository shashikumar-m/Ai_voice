import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, FileText, Mic, Video, PlayCircle, Upload, Clock, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { getNotes, deleteNote } from '../api/client'
import NoteCard from '../components/NoteCard'

const FILTERS = [
  { label: 'All',     value: '',            icon: FileText   },
  { label: 'Audio',   value: 'audio',       icon: Mic        },
  { label: 'Video',   value: 'video',       icon: Video      },
  { label: 'YouTube', value: 'youtube',     icon: PlayCircle },
  { label: 'Live',    value: 'live_meeting',icon: PlayCircle },
]

export default function Notes() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search, filter],
    queryFn: () => getNotes({ search, source_type: filter, limit: 50 }),
    select: d => d.notes,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => { qc.invalidateQueries(['notes']); toast.success('Note deleted') },
    onError: () => toast.error('Failed to delete note'),
  })

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">My Notes</h1>
              <p className="text-slate-400 text-sm">
                {isLoading ? '...' : `${data?.length ?? 0} note${data?.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              <Upload size={16} /> New Note
            </Link>
          </div>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes, transcripts, summaries..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder-slate-500"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl border border-slate-700 p-1.5">
            <SlidersHorizontal size={14} className="text-slate-500 ml-1" />
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <f.icon size={13} />
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 h-52 animate-pulse" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <FileText size={36} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">
              {search ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {search ? 'Try a different search term' : 'Upload a recording to get started'}
            </p>
            {!search && (
              <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors">
                <Upload size={16} /> Upload Recording
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data?.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <NoteCard note={note} onDelete={(id) => deleteMutation.mutate(id)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

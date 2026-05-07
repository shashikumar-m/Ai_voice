import { Link } from 'react-router-dom'
import { Calendar, Clock, Trash2, FileText, Mic, Video, Radio, PlayCircle } from 'lucide-react'

const sourceConfig = {
  audio:        { icon: Mic,        color: 'text-indigo-400', bg: 'bg-indigo-500/20',  bar: 'from-indigo-500 to-purple-500',  label: 'Audio'   },
  video:        { icon: Video,      color: 'text-purple-400', bg: 'bg-purple-500/20',  bar: 'from-purple-500 to-pink-500',    label: 'Video'   },
  live_meeting: { icon: Radio,      color: 'text-red-400',    bg: 'bg-red-500/20',     bar: 'from-red-500 to-orange-500',     label: 'Live'    },
  youtube:      { icon: PlayCircle, color: 'text-red-400',    bg: 'bg-red-500/20',     bar: 'from-red-500 to-rose-500',       label: 'YouTube' },
}

export default function NoteCard({ note, onDelete }) {
  const cfg = sourceConfig[note.source_type] || sourceConfig.audio
  const Icon = cfg.icon

  const duration = note.duration
    ? `${Math.floor(note.duration / 60)}m ${Math.floor(note.duration % 60)}s`
    : 'N/A'

  const date = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="group relative bg-slate-800 rounded-2xl border border-slate-700 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden">
      {/* Top gradient bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.bar}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={cfg.color} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm leading-tight truncate">
                {note.title}
              </h3>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onDelete?.(note.id) }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Summary */}
        {note.summary && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
            {note.summary}
          </p>
        )}

        {/* Keywords */}
        {note.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.keywords.slice(0, 3).map((k, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium">
                {k}
              </span>
            ))}
            {note.keywords.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
                +{note.keywords.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {duration}
            </span>
          </div>
          <Link
            to={`/notes/${note.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <FileText size={12} /> View
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Share2, Link2, Mail, Copy, Check, Lock, Globe, Clock,
  FileText, QrCode, Download, Eye, Mic, Video, PlayCircle,
  AlertCircle, Loader, ChevronDown
} from "lucide-react"
import toast from "react-hot-toast"
import { getNotes, downloadPdf } from "../api/client"

const EXPIRY_OPTIONS = [
  { value: "1day",   label: "1 Day"    },
  { value: "7days",  label: "7 Days"   },
  { value: "30days", label: "30 Days"  },
  { value: "never",  label: "Never"    },
]

const srcCfg = {
  audio:        { icon: Mic,        color: "text-indigo-400", bg: "bg-indigo-500/20"  },
  video:        { icon: Video,      color: "text-purple-400", bg: "bg-purple-500/20"  },
  youtube:      { icon: PlayCircle, color: "text-red-400",    bg: "bg-red-500/20"     },
  live_meeting: { icon: Mic,        color: "text-orange-400", bg: "bg-orange-500/20"  },
}

export default function Share() {
  const [selectedNoteId, setSelectedNoteId] = useState("")
  const [accessLevel,    setAccessLevel]    = useState("anyone")
  const [expiresIn,      setExpiresIn]      = useState("7days")
  const [message,        setMessage]        = useState("")
  const [generatedLink,  setGeneratedLink]  = useState("")
  const [copied,         setCopied]         = useState(false)
  const [generating,     setGenerating]     = useState(false)
  const [sharedLinks,    setSharedLinks]    = useState([])

  // Fetch real notes from backend
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes({ limit: 100 }),
    select: d => d.notes,
  })

  const notes = notesData || []
  const selectedNote = notes.find(n => String(n.id) === String(selectedNoteId))

  // Generate a shareable link (uses note data + window.location)
  const handleGenerate = async () => {
    if (!selectedNoteId) {
      toast.error("Please select a note to share")
      return
    }
    setGenerating(true)
    await new Promise(r => setTimeout(r, 600)) // simulate link generation

    const base = window.location.origin
    const link = `${base}/notes/${selectedNoteId}`
    setGeneratedLink(link)

    // Add to recent shares list
    setSharedLinks(prev => [{
      id: Date.now(),
      noteId: selectedNoteId,
      title: selectedNote?.title || "Untitled",
      link,
      expires: expiresIn,
      access: accessLevel,
      createdAt: new Date().toLocaleTimeString(),
    }, ...prev.slice(0, 4)])

    setGenerating(false)
    toast.success("Share link generated!")
  }

  const handleCopy = (link) => {
    navigator.clipboard.writeText(link || generatedLink)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmailShare = () => {
    if (!selectedNote) return
    const subject = encodeURIComponent(`Notes: ${selectedNote.title}`)
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share my notes with you.\n\n` +
      `Title: ${selectedNote.title}\n` +
      `Summary: ${selectedNote.summary || "N/A"}\n` +
      `Keywords: ${selectedNote.keywords?.join(", ") || "N/A"}\n\n` +
      `View here: ${generatedLink || window.location.origin + "/notes/" + selectedNoteId}\n\n` +
      (message ? `Message: ${message}` : "")
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleNativeShare = async () => {
    if (!selectedNote) return
    const shareData = {
      title: selectedNote.title,
      text: `Check out my notes: ${selectedNote.title}\n\n${selectedNote.summary || ""}`,
      url: generatedLink || `${window.location.origin}/notes/${selectedNoteId}`,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) }
      catch (e) { if (e.name !== "AbortError") toast.error("Share failed") }
    } else {
      handleCopy(shareData.url)
    }
  }

  const handlePdfDownload = async () => {
    if (!selectedNoteId) { toast.error("Select a note first"); return }
    try {
      await downloadPdf(selectedNoteId, selectedNote?.title)
      toast.success("PDF downloaded!")
    } catch { toast.error("PDF download failed") }
  }

  const handleExportText = () => {
    if (!selectedNote) return
    const txt = `${selectedNote.title}\n${"=".repeat(selectedNote.title.length)}\n\nSUMMARY\n${selectedNote.summary || "N/A"}\n\nKEYWORDS\n${selectedNote.keywords?.join(", ") || "N/A"}`
    const blob = new Blob([txt], { type: "text/plain" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `${selectedNote.title.replace(/[^a-z0-9]/gi,"_")}.txt`
    a.click(); URL.revokeObjectURL(url)
    toast.success("Text exported!")
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-16">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Share Notes</h1>
          <p className="text-slate-400 text-sm">Share your real notes with anyone via link, email or PDF</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Main Panel ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Share2 size={18} className="text-indigo-400" /> Create Share Link
              </h3>
            </div>

            <div className="p-6 space-y-5">

              {/* Note selector — REAL DATA */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Select Note to Share
                  {notesLoading && <span className="ml-2 text-slate-500 text-xs">(loading...)</span>}
                </label>
                {notesLoading ? (
                  <div className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl flex items-center gap-2 text-slate-400">
                    <Loader size={16} className="animate-spin" /> Loading your notes...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} /> No notes found. Upload a recording first.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedNoteId}
                      onChange={e => { setSelectedNoteId(e.target.value); setGeneratedLink("") }}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none pr-10"
                    >
                      <option value="">-- Choose a note --</option>
                      {notes.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.title} ({n.source_type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                )}

                {/* Note preview */}
                <AnimatePresence>
                  {selectedNote && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${(srcCfg[selectedNote.source_type]||srcCfg.audio).bg}`}>
                        {(() => { const C = (srcCfg[selectedNote.source_type]||srcCfg.audio).icon; return <C size={16} className={(srcCfg[selectedNote.source_type]||srcCfg.audio).color} /> })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">{selectedNote.title}</p>
                        <p className="text-slate-400 text-xs">
                          {selectedNote.source_type} •{" "}
                          {selectedNote.duration ? `${Math.floor(selectedNote.duration/60)}m` : "N/A"} •{" "}
                          {selectedNote.keywords?.length || 0} keywords
                        </p>
                      </div>
                      <span className="text-emerald-400 text-xs font-medium">Selected</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Access Level */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-3 block">Who can access</label>
                <div className="space-y-2">
                  {[
                    { value: "anyone",   icon: Globe, label: "Anyone with the link", desc: "No sign-in required"  },
                    { value: "email",    icon: Mail,  label: "Share via Email",       desc: "Opens email client"   },
                    { value: "password", icon: Lock,  label: "Password protected",    desc: "Requires password"    },
                  ].map((opt, i) => (
                    <button key={i} onClick={() => setAccessLevel(opt.value)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${
                        accessLevel === opt.value ? "border-indigo-500 bg-indigo-500/10" : "border-slate-600 hover:border-slate-500 bg-slate-700/50"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accessLevel === opt.value ? "bg-indigo-600" : "bg-slate-600"}`}>
                        <opt.icon size={16} className="text-white" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${accessLevel === opt.value ? "text-white" : "text-slate-300"}`}>{opt.label}</p>
                        <p className="text-slate-500 text-xs">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  <Clock size={13} className="inline mr-1.5 text-slate-400" /> Link Expires
                </label>
                <div className="flex gap-2 flex-wrap">
                  {EXPIRY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setExpiresIn(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        expiresIn === opt.value ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Message <span className="text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Add a message for recipients..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none text-sm" />
              </div>

              {/* Generate button */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!selectedNoteId || generating}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {generating ? <><Loader size={18} className="animate-spin" /> Generating...</> : <><Share2 size={18} /> Generate Share Link</>}
              </motion.button>

              {/* Generated link */}
              <AnimatePresence>
                {generatedLink && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-900 rounded-xl p-4 border border-indigo-500/30 space-y-3">
                    <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">Share Link Ready</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 min-w-0">
                        <Link2 size={13} className="text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 text-sm truncate">{generatedLink}</span>
                      </div>
                      <button onClick={() => handleCopy(generatedLink)}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 flex-shrink-0 ${copied ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}>
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>

                    {/* Quick share actions */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleNativeShare}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                        <Share2 size={13} /> Share
                      </button>
                      <button onClick={handleEmailShare}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                        <Mail size={13} /> Email
                      </button>
                      <button onClick={handlePdfDownload}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                        <Download size={13} /> PDF
                      </button>
                      <button onClick={handleExportText}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                        <FileText size={13} /> TXT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Side Panel ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4">

            {/* Live stats from real notes */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Eye size={16} className="text-indigo-400" /> Your Notes Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Notes",  value: notes.length,                                                                icon: FileText },
                  { label: "Audio Notes",  value: notes.filter(n => n.source_type === "audio").length,                        icon: Mic      },
                  { label: "Video Notes",  value: notes.filter(n => n.source_type === "video").length,                        icon: Video    },
                  { label: "YouTube",      value: notes.filter(n => n.source_type === "youtube").length,                      icon: PlayCircle},
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                      <s.icon size={11} /> {s.label}
                    </div>
                    <div className="text-2xl font-black text-white">
                      {notesLoading ? <span className="text-slate-600">...</span> : s.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent shares — real generated links */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Link2 size={16} className="text-indigo-400" /> Recent Links
                </h3>
              </div>
              {sharedLinks.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No links generated yet.<br />Select a note and click Generate.
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {sharedLinks.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="p-4 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>Expires: {EXPIRY_OPTIONS.find(o => o.value === item.expires)?.label}</span>
                            <span>•</span>
                            <span>{item.createdAt}</span>
                          </div>
                        </div>
                        <button onClick={() => handleCopy(item.link)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors flex-shrink-0">
                          <Copy size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* QR Code — shows for selected note */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative">
                <QrCode size={16} /> QR Code
              </h3>
              <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-4 relative">
                <div className="w-28 h-28 flex items-center justify-center">
                  {selectedNoteId ? (
                    <div className="text-center">
                      <QrCode size={56} className="text-slate-800 mx-auto" />
                      <p className="text-slate-500 text-xs mt-1">Note #{selectedNoteId}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode size={56} className="text-slate-300 mx-auto" />
                      <p className="text-slate-400 text-xs mt-1">Select a note</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => { if (!generatedLink) { toast.error("Generate a link first"); return }; handleCopy(generatedLink) }}
                className="w-full py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-sm relative">
                <Download size={14} /> Copy Link for QR
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FileAudio, FileVideo, CheckCircle, AlertCircle, X, Globe, PlayCircle, Link, Sparkles, Mic, Wand2, Brain, FileText, Upload as UploadIcon, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import { uploadFile } from "../api/client"
import { api as authApi } from "../services/authService"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

const LANGUAGES = {
  auto:"Auto Detect (Recommended)",en:"English",hi:"Hindi",te:"Telugu",ta:"Tamil",
  kn:"Kannada",ml:"Malayalam",mr:"Marathi",bn:"Bengali",gu:"Gujarati",pa:"Punjabi",
  es:"Spanish",fr:"French",de:"German",it:"Italian",pt:"Portuguese",zh:"Chinese",ja:"Japanese",ko:"Korean",
}
const AUDIO_EXTS = ["mp3","wav","m4a","ogg","flac","webm"]
const VIDEO_EXTS = ["mp4","mov","avi","mkv"]

const STEPS = [
  { icon: Mic,      label: "Upload Audio / Video",        color: "text-indigo-400", bg: "bg-indigo-500/20" },
  { icon: Brain,    label: "AI Transcribes Speech",       color: "text-purple-400", bg: "bg-purple-500/20" },
  { icon: Wand2,    label: "Summarize & Extract Keywords",color: "text-pink-400",   bg: "bg-pink-500/20"   },
  { icon: FileText, label: "Get Smart Notes",             color: "text-emerald-400",bg: "bg-emerald-500/20"},
]

const WHAT_YOU_GET = [
  { icon: "��", label: "Full Transcript",     desc: "Word-for-word text"         },
  { icon: "📋", label: "AI Summary",          desc: "Bullet-point takeaways"     },
  { icon: "🏷️", label: "Keywords",            desc: "Important terms extracted"  },
  { icon: "🃏", label: "Flashcards",          desc: "Study cards for concepts"   },
  { icon: "❓", label: "Practice Questions",  desc: "MCQ questions to test"      },
  { icon: "🧠", label: "Mind Map",            desc: "Visual topic connections"   },
  { icon: "🎓", label: "Mock Exam",           desc: "Timed test with scoring"    },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("file")
  const [file, setFile] = useState(null)
  const [ytUrl, setYtUrl] = useState("")
  const [ytInfo, setYtInfo] = useState(null)
  const [ytFetching, setYtFetching] = useState(false)
  const [language, setLanguage] = useState("auto")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("idle")
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState("")
  const [currentStep, setCurrentStep] = useState(-1)

  const onDrop = useCallback((accepted) => { if (accepted[0]) setFile(accepted[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": AUDIO_EXTS.map(e => `.${e}`), "video/*": VIDEO_EXTS.map(e => `.${e}`) },
    maxFiles: 1, maxSize: 100 * 1024 * 1024,
  })

  const isVideo = file && VIDEO_EXTS.includes(file.name.split(".").pop().toLowerCase())

  const fetchYtInfo = async (url) => {
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) return
    setYtFetching(true); setYtInfo(null)
    try {
      const res = await authApi.get(`${BASE_URL}/youtube/info`, { params: { url } })
      setYtInfo(res.data)
    } catch { setYtInfo(null) }
    finally { setYtFetching(false) }
  }

  const handleFileSubmit = async () => {
    if (!file) return
    setStatus("uploading"); setProgress(10); setStep("Uploading file..."); setCurrentStep(0)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("language", language)
      fd.append("title", title || file.name.replace(/\.[^.]+$/, ""))
      setStep("Transcribing with Whisper AI..."); setProgress(35); setCurrentStep(1)
      const result = await uploadFile(fd, (p) => setProgress(10 + p * 0.5))
      setStep("Generating summary..."); setProgress(80); setCurrentStep(2)
      await new Promise(r => setTimeout(r, 400))
      setStep("Extracting keywords..."); setProgress(95); setCurrentStep(3)
      await new Promise(r => setTimeout(r, 300))
      setProgress(100); setStatus("done")
      toast.success("Note created!")
      setTimeout(() => navigate(`/notes/${result.note_id}`), 700)
    } catch (err) {
      setStatus("error"); toast.error(err.response?.data?.detail || "Upload failed")
    }
  }

  const handleYtSubmit = async () => {
    if (!ytUrl.trim()) return
    setStatus("uploading"); setProgress(10); setStep("Fetching YouTube video..."); setCurrentStep(0)
    try {
      setStep("Downloading audio..."); setProgress(25); setCurrentStep(1)
      const res = await authApi.post(`${BASE_URL}/youtube`, { url: ytUrl.trim(), language, title: title.trim() })
      setStep("Transcribing audio..."); setProgress(60); setCurrentStep(2)
      await new Promise(r => setTimeout(r, 400))
      setStep("Generating summary & keywords..."); setProgress(90); setCurrentStep(3)
      await new Promise(r => setTimeout(r, 400))
      setProgress(100); setStatus("done")
      toast.success("YouTube note created!")
      setTimeout(() => navigate(`/notes/${res.data.note_id}`), 700)
    } catch (err) {
      setStatus("error"); toast.error(err.response?.data?.detail || "YouTube processing failed")
    }
  }

  const reset = () => {
    setFile(null); setYtUrl(""); setYtInfo(null)
    setStatus("idle"); setProgress(0); setStep(""); setTitle(""); setCurrentStep(-1)
  }

  const canSubmit = tab === "file" ? !!file : !!ytUrl.trim()
  const isProcessing = status === "uploading"

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-16">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-medium mb-6">
            <Sparkles size={14} className="animate-pulse" /> AI-Powered Note Generation
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Turn Any Audio Into
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Smart Study Notes
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Upload a recording or paste a YouTube link. Get transcription, summary, flashcards and more.
          </p>
        </motion.div>

        {/* Steps strip */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {STEPS.map((s, i) => (
            <motion.div key={i} whileHover={{ scale: 1.03 }}
              className={`rounded-2xl border p-4 flex flex-col items-center text-center transition-all ${
                currentStep === i ? "bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10" :
                currentStep > i  ? "bg-emerald-500/10 border-emerald-500/30" :
                "bg-slate-800 border-slate-700"}`}>
              <div className={`w-10 h-10 rounded-xl ${currentStep > i ? "bg-emerald-500/20" : s.bg} flex items-center justify-center mb-2 transition-all`}>
                {currentStep > i
                  ? <CheckCircle size={18} className="text-emerald-400" />
                  : <s.icon size={18} className={currentStep === i ? "text-indigo-400 animate-pulse" : s.color} />}
              </div>
              <div className={`text-xs font-medium ${currentStep === i ? "text-white" : currentStep > i ? "text-emerald-400" : "text-slate-400"}`}>
                {i + 1}. {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-3 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {[
                { id: "file",    label: "Upload File",  icon: FileAudio,   active: "text-indigo-400 border-indigo-500 bg-indigo-500/10" },
                { id: "youtube", label: "YouTube URL",  icon: PlayCircle,  active: "text-red-400 border-red-500 bg-red-500/10"          },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); reset() }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all border-b-2 ${
                    tab === t.id ? t.active : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-700/50"}`}>
                  <t.icon size={16} /> {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* File tab */}
                {tab === "file" && (
                  <motion.div key="file" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                    <div {...getRootProps()} className={`relative rounded-2xl cursor-pointer transition-all duration-300 ${isDragActive ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800" : ""}`}>
                      <input {...getInputProps()} />
                      <AnimatePresence mode="wait">
                        {file ? (
                          <motion.div key="has-file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4 p-5 bg-indigo-500/10 rounded-2xl border-2 border-indigo-500/30">
                            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                              {isVideo ? <FileVideo size={28} className="text-purple-400" /> : <FileAudio size={28} className="text-indigo-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{file.name}</p>
                              <p className="text-sm text-slate-400">{(file.size/1024/1024).toFixed(1)} MB · {isVideo ? "Video" : "Audio"}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                              isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700/30"}`}>
                            <motion.div animate={{ y: isDragActive ? -8 : 0 }} transition={{ type: "spring" }}
                              className="relative w-20 h-20 mx-auto mb-5">
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <UploadIcon size={32} className="text-indigo-400" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">+</span>
                              </div>
                            </motion.div>
                            <p className="text-white font-bold text-lg mb-1">{isDragActive ? "Drop it here!" : "Drop your file here"}</p>
                            <p className="text-slate-500 text-sm mb-4">or click to browse from your device</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {["MP3","WAV","M4A","MP4","MOV"].map(f => (
                                <span key={f} className="px-2.5 py-1 bg-slate-700 text-slate-400 text-xs rounded-lg font-medium">{f}</span>
                              ))}
                              <span className="px-2.5 py-1 bg-slate-700 text-slate-500 text-xs rounded-lg">Max 100MB</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* YouTube tab */}
                {tab === "youtube" && (
                  <motion.div key="youtube" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                    <div className="rounded-2xl border-2 border-dashed border-red-500/30 bg-red-500/5 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <PlayCircle size={24} className="text-red-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">YouTube Video</p>
                          <p className="text-sm text-slate-400">Paste any public YouTube link</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Link size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="url" value={ytUrl}
                          onChange={e => { setYtUrl(e.target.value); if (e.target.value.length > 20) fetchYtInfo(e.target.value) }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-600 bg-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none text-sm text-white placeholder-slate-500 transition-all" />
                      </div>
                      <AnimatePresence>
                        {ytFetching && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                            <div className="w-4 h-4 border-2 border-slate-600 border-t-red-500 rounded-full animate-spin" />
                            Fetching video info...
                          </motion.div>
                        )}
                        {ytInfo && !ytFetching && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-3 p-3 bg-slate-700 rounded-xl border border-slate-600">
                            {ytInfo.thumbnail && <img src={ytInfo.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white text-sm truncate">{ytInfo.title}</p>
                              <p className="text-xs text-slate-400">{ytInfo.channel} · {Math.floor(ytInfo.duration/60)}m {ytInfo.duration%60}s</p>
                            </div>
                            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Note Title <span className="text-slate-500 font-normal text-xs">(optional)</span>
                  </label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder={tab === "youtube" ? "Leave blank to use video title" : "e.g. Physics Lecture 5"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white placeholder-slate-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <Globe size={13} className="inline mr-1.5 text-indigo-400" /> Language
                  </label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white transition-all text-sm">
                    {Object.entries(LANGUAGES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-5 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-indigo-300">{step}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-400">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">This may take a few minutes for longer recordings...</p>
                  </motion.div>
                )}
                {status === "done" && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-5 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-300 font-semibold">Note created! Redirecting...</span>
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-5 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-300 font-semibold">Something went wrong. Please try again.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="mt-5 flex gap-3">
                {status === "error" && (
                  <button onClick={reset} className="px-5 py-3.5 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-all text-sm">
                    Reset
                  </button>
                )}
                <motion.button whileHover={{ scale: canSubmit && !isProcessing ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
                  onClick={tab === "file" ? handleFileSubmit : handleYtSubmit}
                  disabled={!canSubmit || isProcessing || status === "done"}
                  className={`flex-1 py-3.5 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    tab === "youtube"
                      ? "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/20"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/20"}`}>
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Processing...
                    </span>
                  ) : tab === "youtube" ? "Get Notes from YouTube" : "Generate Smart Notes"}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" /> What you get
              </h3>
              <div className="space-y-3">
                {WHAT_YOU_GET.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 group">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <h3 className="font-bold mb-3 flex items-center gap-2 relative">
                <Brain size={16} /> Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-indigo-100 relative">
                {["Clear audio gives better transcription","Select the correct language for accuracy","YouTube lectures work great for study notes","Processing takes 1-5 min depending on length"].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-300">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
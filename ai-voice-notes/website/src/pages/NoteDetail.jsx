import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Mic, Video, Radio, Copy, Share2, Trash2, FileText,
  BookOpen, Layers, HelpCircle, Brain, GraduationCap, PlayCircle,
  Check, X, FileDown, Loader, RefreshCw
} from "lucide-react"
import toast from "react-hot-toast"
import { getNoteById, deleteNote, downloadPdf } from "../api/client"
import { api as authApi } from "../services/authService"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState("notes")
  const [showExport, setShowExport] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => getNoteById(id),
    select: d => d.note,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(id),
    onSuccess: () => { qc.invalidateQueries(["notes"]); toast.success("Note deleted"); navigate("/notes") },
  })

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return null

  const srcCfg = {
    audio:        { icon: Mic,        color: "text-indigo-400", bg: "bg-indigo-500/20", label: "Audio"        },
    video:        { icon: Video,      color: "text-purple-400", bg: "bg-purple-500/20", label: "Video"        },
    live_meeting: { icon: Radio,      color: "text-red-400",    bg: "bg-red-500/20",    label: "Live Meeting" },
    youtube:      { icon: PlayCircle, color: "text-red-400",    bg: "bg-red-500/20",    label: "YouTube"      },
  }
  const cfg  = srcCfg[data.source_type] || srcCfg.audio
  const Icon = cfg.icon
  const duration = data.duration ? `${Math.floor(data.duration/60)}m ${Math.floor(data.duration%60)}s` : "N/A"
  const date = new Date(data.created_at).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })

  const tabs = [
    { id:"notes",      label:"Lecture Notes",     icon:BookOpen      },
    { id:"summary",    label:"Summary Notes",      icon:FileText      },
    { id:"flashcards", label:"Flashcards",         icon:Layers        },
    { id:"practice",   label:"Practice Questions", icon:HelpCircle    },
    { id:"mindmap",    label:"Mind Map",           icon:Brain         },
    { id:"exam",       label:"Mock Exams",         icon:GraduationCap },
  ]

  return (
    <div className="min-h-screen bg-slate-900 pt-16">
      <div className="flex h-[calc(100vh-64px)]">
        <AnimatePresence>
          {showExport && <ExportModal data={data} noteId={id} onClose={() => setShowExport(false)} />}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-700">
            <Link to="/notes" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to Notes
            </Link>
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={cfg.color} />
            </div>
            <h2 className="font-bold text-white text-sm leading-tight">{data.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{cfg.label} · {duration}</p>
            <p className="text-xs text-slate-600 mt-0.5">{date}</p>
          </div>

          <nav className="p-3 flex-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Content</p>
            {tabs.slice(0,2).map(t => <SidebarItem key={t.id} tab={t} active={activeTab===t.id} onClick={() => setActiveTab(t.id)} />)}
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mt-4 mb-2">Interactive</p>
            {tabs.slice(2,5).map(t => <SidebarItem key={t.id} tab={t} active={activeTab===t.id} onClick={() => setActiveTab(t.id)} />)}
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mt-4 mb-2">Assessment</p>
            {tabs.slice(5).map(t => <SidebarItem key={t.id} tab={t} active={activeTab===t.id} onClick={() => setActiveTab(t.id)} />)}
          </nav>

          <div className="p-3 border-t border-slate-700 space-y-2">
            <button onClick={() => setShowExport(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
              <Share2 size={15} /> Export & Share
            </button>
            <button onClick={() => deleteMutation.mutate()}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-400 text-sm hover:bg-red-500/10 rounded-xl transition-colors">
              <Trash2 size={14} /> Delete Note
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>AI Voice Notes</span><span>/</span>
                <span className="text-slate-400 truncate max-w-xs">{data.title}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">{tabs.find(t => t.id===activeTab)?.label}</h1>
                <button onClick={() => setShowExport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all flex-shrink-0">
                  <Share2 size={15} /> Export & Share
                </button>
              </div>
              {data.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.keywords.map((k,i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium border border-indigo-500/20">{k}</span>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}>
                {activeTab==="notes"      && <LectureNotes data={data} />}
                {activeTab==="summary"    && <SummaryNotes data={data} />}
                {activeTab==="flashcards" && <Flashcards noteId={id} />}
                {activeTab==="practice"   && <PracticeQuestions noteId={id} />}
                {activeTab==="mindmap"    && <MindMap noteId={id} />}
                {activeTab==="exam"       && <MockExam noteId={id} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${
        active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
      <tab.icon size={16} className={active ? "text-white" : "text-slate-500"} />
      {tab.label}
    </button>
  )
}

function LectureNotes({ data }) {
  const copy = t => { navigator.clipboard.writeText(t); toast.success("Copied!") }
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <div>
          <h3 className="font-bold text-white">Full Transcript</h3>
          <p className="text-xs text-slate-500 mt-0.5">{data.transcript.split(" ").length} words</p>
        </div>
        <button onClick={() => copy(data.transcript)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <Copy size={14} /> Copy
        </button>
      </div>
      <div className="p-6"><p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{data.transcript}</p></div>
    </div>
  )
}

function SummaryNotes({ data }) {
  const copy = t => { navigator.clipboard.writeText(t); toast.success("Copied!") }
  const lines = (data.summary || "").split("\n").filter(Boolean)
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h3 className="font-bold text-white">AI-Generated Summary</h3>
        <button onClick={() => copy(data.summary || "")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <Copy size={14} /> Copy
        </button>
      </div>
      <div className="p-6 space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{line.replace(/^[•\-\*]\s*/, "")}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
function GeneratePrompt({ title, desc, icon: Icon, onGenerate, loading, color }) {
  const colors = {
    indigo:  "from-indigo-500 to-purple-600",
    purple:  "from-purple-500 to-pink-600",
    emerald: "from-emerald-500 to-teal-600",
    amber:   "from-amber-500 to-orange-500",
  }
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
        <Icon size={28} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      <button onClick={onGenerate} disabled={loading}
        className={`px-8 py-3 bg-gradient-to-r ${colors[color]} text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 mx-auto`}>
        {loading ? <><Loader size={16} className="animate-spin" /> Generating...</> : `Generate ${title}`}
      </button>
    </div>
  )
}

function Flashcards({ noteId }) {
  const [cards, setCards]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await authApi.post(`${BASE_URL}/notes/${noteId}/flashcards`)
      setCards(res.data.flashcards)
      setCurrent(0); setFlipped(false)
      toast.success(`${res.data.flashcards.length} flashcards generated!`)
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate flashcards")
    } finally { setLoading(false) }
  }

  if (!cards) return <GeneratePrompt title="Flashcards" desc="Generate interactive flashcards from your lecture content" icon={Layers} onGenerate={generate} loading={loading} color="indigo" />

  const card = cards[current]
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Card {current+1} of {cards.length}</p>
        <button onClick={() => { setCards(null); setCurrent(0) }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>

      <div className="cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: "1000px" }}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }}
          style={{ transformStyle: "preserve-3d" }} className="relative h-64">
          {/* Front */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex flex-col items-center justify-center p-8 shadow-xl"
            style={{ backfaceVisibility: "hidden" }}>
            <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-4">Question</div>
            <p className="text-white text-xl font-bold text-center leading-relaxed">{card.front}</p>
            <div className="mt-6 text-indigo-300 text-xs">Click to reveal answer</div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-slate-800 border-2 border-indigo-500/30 rounded-2xl flex flex-col items-center justify-center p-8 shadow-xl"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">Answer</div>
            <p className="text-white text-base text-center leading-relaxed">{card.back}</p>
          </div>
        </motion.div>
      </div>

      <p className="text-center text-xs text-slate-500">Click card to flip</p>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => { setCurrent(c => Math.max(0,c-1)); setFlipped(false) }} disabled={current===0}
          className="px-5 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all">
          Previous
        </button>
        <div className="flex gap-1.5">
          {cards.map((_,i) => (
            <button key={i} onClick={() => { setCurrent(i); setFlipped(false) }}
              className={`h-2 rounded-full transition-all ${i===current ? "bg-indigo-500 w-6" : "bg-slate-600 w-2 hover:bg-slate-500"}`} />
          ))}
        </div>
        <button onClick={() => { setCurrent(c => Math.min(cards.length-1,c+1)); setFlipped(false) }} disabled={current===cards.length-1}
          className="px-5 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all">
          Next
        </button>
      </div>
    </div>
  )
}

function PracticeQuestions({ noteId }) {
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState({})
  const [revealed, setRevealed]   = useState({})

  const generate = async () => {
    setLoading(true)
    try {
      const res = await authApi.post(`${BASE_URL}/notes/${noteId}/practice-questions`)
      setQuestions(res.data.questions)
      setSelected({}); setRevealed({})
      toast.success(`${res.data.questions.length} questions generated!`)
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate questions")
    } finally { setLoading(false) }
  }

  if (!questions) return <GeneratePrompt title="Practice Questions" desc="Test your understanding with AI-generated MCQ questions" icon={HelpCircle} onGenerate={generate} loading={loading} color="purple" />

  const score = Object.keys(revealed).filter(qi => selected[qi] === questions[qi].answer).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{questions.length} questions</p>
        <div className="flex items-center gap-3">
          {Object.keys(revealed).length > 0 && (
            <span className="text-sm font-bold text-emerald-400">{score}/{Object.keys(revealed).length} correct</span>
          )}
          <button onClick={() => { setQuestions(null); setSelected({}); setRevealed({}) }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      </div>

      {questions.map((q, qi) => {
        const sel = selected[qi]
        const rev = revealed[qi]
        return (
          <motion.div key={qi} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: qi*0.05 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <p className="font-semibold text-white mb-4 text-sm">Q{qi+1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const letter = ["A","B","C","D"][oi]
                const isSelected = sel === letter
                const isCorrect  = letter === q.answer
                let cls = "border-slate-600 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                if (rev) {
                  if (isCorrect)              cls = "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  else if (isSelected)        cls = "border-red-500 bg-red-500/10 text-red-300"
                  else                        cls = "border-slate-700 text-slate-500"
                } else if (isSelected)        cls = "border-indigo-500 bg-indigo-500/10 text-white"
                return (
                  <button key={oi} onClick={() => !rev && setSelected(s => ({...s,[qi]:letter}))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${cls} ${rev ? "cursor-default" : "cursor-pointer"}`}>
                    <span className="font-bold w-5 flex-shrink-0">{letter}.</span>
                    <span className="flex-1">{opt.replace(/^[A-D]\.\s*/,"")}</span>
                    {rev && isCorrect  && <Check size={15} className="text-emerald-400 flex-shrink-0" />}
                    {rev && isSelected && !isCorrect && <X size={15} className="text-red-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            {!rev ? (
              <button onClick={() => sel && setRevealed(r => ({...r,[qi]:true}))} disabled={!sel}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-indigo-500 transition-colors">
                Check Answer
              </button>
            ) : (
              <div className="mt-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                <p className="text-xs font-semibold text-slate-400 mb-1">Explanation</p>
                <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function MindMap({ noteId }) {
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await authApi.post(`${BASE_URL}/notes/${noteId}/mindmap`)
      setMindmap(res.data.mindmap)
      toast.success("Mind map generated!")
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate mind map")
    } finally { setLoading(false) }
  }

  if (!mindmap) return <GeneratePrompt title="Mind Map" desc="Visualize key concepts and their relationships" icon={Brain} onGenerate={generate} loading={loading} color="emerald" />

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white">Mind Map</h3>
        <button onClick={() => setMindmap(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl text-sm shadow-lg mb-8">
          {mindmap.center}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {mindmap.branches?.map((branch, i) => (
            <motion.div key={i} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.08 }}
              className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: branch.color }}>
              <div className="px-4 py-2.5 font-bold text-white text-sm" style={{ backgroundColor: branch.color }}>
                {branch.topic}
              </div>
              <div className="p-3 space-y-1.5 bg-slate-900">
                {branch.subtopics?.map((sub, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />
                    {sub}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockExam({ noteId }) {
  const [exam, setExam]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [answers, setAnswers]   = useState({})
  const [submitted, setSubmit]  = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await authApi.post(`${BASE_URL}/notes/${noteId}/mock-exam`)
      setExam(res.data); setAnswers({}); setSubmit(false)
      toast.success(`Mock exam with ${res.data.questions.length} questions ready!`)
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate mock exam")
    } finally { setLoading(false) }
  }

  if (!exam) return <GeneratePrompt title="Mock Exam" desc="Take a timed mock exam to test your knowledge" icon={GraduationCap} onGenerate={generate} loading={loading} color="amber" />

  const score = submitted ? exam.questions.filter((q,i) => answers[i] === q.answer).length : 0
  const pct   = submitted ? Math.round((score / exam.questions.length) * 100) : 0
  const diffColor = { easy:"bg-emerald-500/20 text-emerald-400", medium:"bg-amber-500/20 text-amber-400", hard:"bg-red-500/20 text-red-400" }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-white">Mock Exam</h3>
            <p className="text-sm text-slate-400">{exam.questions.length} questions · {exam.total_marks} marks · {exam.duration_minutes} min</p>
          </div>
          <div className="flex items-center gap-3">
            {submitted && (
              <div className={`px-4 py-2 rounded-xl font-bold text-sm ${pct>=60 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                Score: {score}/{exam.questions.length} ({pct}%)
              </div>
            )}
            {!submitted && (
              <button onClick={() => { setExam(null); setAnswers({}) }}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={14} /> Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {exam.questions.map((q, qi) => {
        const sel = answers[qi]
        return (
          <motion.div key={qi} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: qi*0.04 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="font-semibold text-white text-sm">Q{qi+1}. {q.question}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diffColor[q.difficulty] || diffColor.medium}`}>{q.difficulty}</span>
                <span className="text-xs text-slate-500">{q.marks}m</span>
              </div>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const letter = ["A","B","C","D"][oi]
                const isSelected = sel === letter
                let cls = "border-slate-600 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                if (submitted) {
                  if (letter === q.answer)    cls = "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  else if (isSelected)        cls = "border-red-500 bg-red-500/10 text-red-300"
                  else                        cls = "border-slate-700 text-slate-500"
                } else if (isSelected)        cls = "border-indigo-500 bg-indigo-500/10 text-white"
                return (
                  <button key={oi} onClick={() => !submitted && setAnswers(a => ({...a,[qi]:letter}))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}>
                    <span className="font-bold w-5 flex-shrink-0">{letter}.</span>
                    <span>{opt.replace(/^[A-D]\.\s*/,"")}</span>
                    {submitted && letter===q.answer  && <Check size={14} className="ml-auto text-emerald-400 flex-shrink-0" />}
                    {submitted && isSelected && letter!==q.answer && <X size={14} className="ml-auto text-red-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <div className="mt-3 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                <p className="text-xs font-semibold text-slate-400 mb-1">Explanation</p>
                <p className="text-xs text-slate-300">{q.explanation}</p>
              </div>
            )}
          </motion.div>
        )
      })}

      {!submitted && (
        <button onClick={() => { setSubmit(true); const s = exam.questions.filter((q,i) => answers[i]===q.answer).length; toast.success(`Submitted! Score: ${s}/${exam.questions.length}`) }}
          disabled={Object.keys(answers).length < exam.questions.length}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          Submit Exam ({Object.keys(answers).length}/{exam.questions.length} answered)
        </button>
      )}
    </div>
  )
}

function ExportModal({ data, noteId, onClose }) {
  const [copied, setCopied] = useState(null)

  const copy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label); toast.success(`${label} copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePdf = async () => {
    try { await downloadPdf(noteId, data.title); toast.success("PDF downloaded!") }
    catch { toast.error("PDF download failed") }
  }

  const handleShare = async () => {
    const text = `${data.title}\n\nSummary:\n${data.summary||""}\n\nKeywords: ${data.keywords?.join(", ")||""}`
    if (navigator.share) {
      try { await navigator.share({ title: data.title, text }) } catch {}
    } else { copy(text, "Note") }
  }

  const exportMd = () => {
    const md = `# ${data.title}\n\n## Summary\n${data.summary||""}\n\n## Keywords\n${data.keywords?.map(k=>`- ${k}`).join("\n")||""}\n\n## Transcript\n${data.transcript}`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([md], { type:"text/markdown" }))
    a.download = `${data.title.replace(/[^a-z0-9]/gi,"_")}.md`
    a.click()
    toast.success("Markdown exported!")
  }

  const exportTxt = () => {
    const txt = `${data.title}\n\nSUMMARY\n${data.summary||""}\n\nKEYWORDS\n${data.keywords?.join(", ")||""}\n\nTRANSCRIPT\n${data.transcript}`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([txt], { type:"text/plain" }))
    a.download = `${data.title.replace(/[^a-z0-9]/gi,"_")}.txt`
    a.click()
    toast.success("Text exported!")
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale:0.95, opacity:0, y:10 }} animate={{ scale:1, opacity:1, y:0 }}
        exit={{ scale:0.95, opacity:0, y:10 }} transition={{ type:"spring", duration:0.3 }}
        className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Export & Share</h2>
            <p className="text-sm text-slate-400 truncate max-w-xs">{data.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Download</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"PDF",      fn: handlePdf,  color:"bg-indigo-600",  icon: FileDown  },
                { label:"Markdown", fn: exportMd,   color:"bg-purple-600",  icon: FileText  },
                { label:"Text",     fn: exportTxt,  color:"bg-slate-600",   icon: FileDown  },
              ].map(item => (
                <button key={item.label} onClick={item.fn}
                  className={`${item.color} text-white rounded-xl py-3 flex flex-col items-center gap-1.5 hover:opacity-90 transition-opacity`}>
                  <item.icon size={18} />
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Copy</p>
            <div className="space-y-2">
              {[
                { label:"Summary",    text: data.summary||"" },
                { label:"Keywords",   text: data.keywords?.join(", ")||"" },
                { label:"Transcript", text: data.transcript },
              ].map(item => (
                <button key={item.label} onClick={() => copy(item.text, item.label)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                  <span className="text-slate-300 text-sm">{item.label}</span>
                  {copied===item.label
                    ? <Check size={14} className="text-emerald-400" />
                    : <Copy size={14} className="text-slate-400" />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleShare}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Share2 size={16} /> Share Note
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

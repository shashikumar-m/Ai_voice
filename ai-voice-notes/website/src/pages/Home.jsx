import { Link } from "react-router-dom"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import {
  Mic, Upload, FileText, Search, Globe, Download,
  Zap, Shield, Brain, Sparkles, ChevronRight,
  Play, Star, ArrowRight, Check, Cpu, Database, Code2
} from "lucide-react"

const features = [
  { icon: Mic,      title: "Audio Upload",     desc: "MP3, WAV, M4A — instant transcription",         gradient: "from-indigo-500 to-indigo-600",  glow: "shadow-indigo-500/20" },
  { icon: Upload,   title: "Video Upload",     desc: "MP4, MOV — audio extracted via FFmpeg",          gradient: "from-purple-500 to-purple-600",  glow: "shadow-purple-500/20" },
  { icon: Brain,    title: "Own AI Model",     desc: "Fine-tuned T5-small trained on our data",        gradient: "from-pink-500 to-rose-600",      glow: "shadow-pink-500/20"   },
  { icon: FileText, title: "AI Summary",       desc: "Bullet-point key takeaways generated locally",   gradient: "from-emerald-500 to-teal-600",   glow: "shadow-emerald-500/20"},
  { icon: Search,   title: "Smart Search",     desc: "Search across all notes and transcripts",        gradient: "from-blue-500 to-cyan-600",      glow: "shadow-blue-500/20"   },
  { icon: Globe,    title: "Multi-language",   desc: "10+ languages via local Whisper model",          gradient: "from-orange-500 to-amber-600",   glow: "shadow-orange-500/20" },
  { icon: Download, title: "PDF Export",       desc: "Export beautifully formatted notes as PDF",      gradient: "from-pink-500 to-pink-600",      glow: "shadow-pink-500/20"   },
  { icon: Zap,      title: "100% Local AI",    desc: "No API keys — runs entirely on your machine",    gradient: "from-yellow-500 to-orange-500",  glow: "shadow-yellow-500/20" },
]

const stats = [
  { value: "10+",   label: "Languages",       icon: Globe   },
  { value: "100MB", label: "Max File Size",   icon: Upload  },
  { value: "0",     label: "API Cost",        icon: Zap     },
  { value: "100%",  label: "Private & Local", icon: Shield  },
]

const steps = [
  { step: "01", title: "Upload or Record",  desc: "Upload audio/video or paste a YouTube link. Supports MP3, MP4, WAV and more.", icon: Upload,   color: "indigo" },
  { step: "02", title: "Local AI Processes",desc: "Whisper transcribes speech locally. Our fine-tuned T5 model generates summary.", icon: Brain,    color: "purple" },
  { step: "03", title: "Get Smart Notes",   desc: "View transcript, summary, keywords, flashcards, MCQs and export as PDF.",       icon: FileText, color: "emerald" },
]

const techStack = [
  { name: "React 18",    category: "Frontend",  color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  { name: "FastAPI",     category: "Backend",   color: "text-green-400",   bg: "bg-green-500/10"   },
  { name: "Whisper",     category: "AI",        color: "text-purple-400",  bg: "bg-purple-500/10"  },
  { name: "T5-small",    category: "Our Model", color: "text-pink-400",    bg: "bg-pink-500/10"    },
  { name: "Python 3.11", category: "Language",  color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  { name: "SQLite",      category: "Database",  color: "text-orange-400",  bg: "bg-orange-500/10"  },
  { name: "FFmpeg",      category: "Audio",     color: "text-red-400",     bg: "bg-red-500/10"     },
  { name: "Tailwind",    category: "Styling",   color: "text-sky-400",     bg: "bg-sky-500/10"     },
]

// Animated typing effect
function TypeWriter({ words }) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [text, setText] = useState("")

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !deleting) {
      setTimeout(() => setDeleting(true), 1500)
      return
    }
    if (subIndex === 0 && deleting) {
      setDeleting(false)
      setIndex(i => (i + 1) % words.length)
      return
    }
    const timeout = setTimeout(() => {
      setText(words[index].substring(0, subIndex))
      setSubIndex(s => s + (deleting ? -1 : 1))
    }, deleting ? 50 : 80)
    return () => clearTimeout(timeout)
  }, [subIndex, deleting, index, words])

  return (
    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
      {text}<span className="animate-pulse">|</span>
    </span>
  )
}

// Floating particle
function Particle({ style }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-30"
      style={style}
      animate={{ y: [-20, 20], opacity: [0.1, 0.5, 0.1] }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

export default function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
  }))

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Glow orbs */}
        <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-15" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600 rounded-full blur-[100px] opacity-10" />
        </motion.div>

        {/* Floating particles */}
        {particles.map((p, i) => <Particle key={i} style={p} />)}

        <motion.div style={{ opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            100% Local AI — No API Keys Required
            <ChevronRight size={14} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6"
          >
            Turn Voice Into
            <br />
            <TypeWriter words={["Smart Notes", "AI Summaries", "Flashcards", "Study Material"]} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload audio, video or YouTube links. Our fine-tuned AI model transcribes,
            summarizes and creates study material — entirely on your machine.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/upload"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 text-lg"
            >
              <Upload size={20} />
              Upload Recording
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/dashboard"
              className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700 transition-all hover:-translate-y-1 text-lg"
            >
              <Play size={20} className="text-indigo-400" />
              Go to Dashboard
            </Link>
          </motion.div>

          {/* Hero mockup — dark terminal style */}
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-20" />

            <div className="relative bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* Window bar */}
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-900 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="flex-1 mx-4 bg-slate-700 rounded-lg h-6 flex items-center px-3">
                  <span className="text-slate-400 text-xs">localhost:5173/notes/42</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-3 gap-4">
                {/* Transcript panel */}
                <div className="col-span-2 bg-slate-900 rounded-2xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Mic size={12} className="text-indigo-400" />
                    </div>
                    <div className="h-3 bg-slate-700 rounded w-32" />
                    <div className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Live</div>
                  </div>
                  <div className="space-y-2">
                    {[100, 85, 92, 70, 88].map((w, i) => (
                      <motion.div key={i} className="h-2 bg-indigo-500/30 rounded-full"
                        style={{ width: `${w}%` }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-xs leading-relaxed">
                      "The transformer architecture uses self-attention mechanisms to process sequential data in parallel, enabling much faster training compared to RNNs..."
                    </p>
                  </div>
                </div>

                {/* Side panels */}
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                    <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                      <Sparkles size={10} /> Keywords
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["Transformer", "Attention", "NLP", "BERT"].map(k => (
                        <span key={k} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                    <div className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                      <Brain size={10} /> AI Summary
                    </div>
                    <div className="space-y-1.5">
                      {[90, 75, 85].map((w, i) => (
                        <div key={i} className="h-1.5 bg-purple-500/30 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-3">
                    <div className="text-xs font-bold text-white mb-1">T5-small</div>
                    <div className="text-xs text-indigo-200">Fine-tuned model</div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-white rounded-full"
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-16 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/20 transition-colors">
                  <s.icon size={22} className="text-indigo-400" />
                </div>
                <div className="text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-4">
              <Sparkles size={14} /> Everything You Need
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Packed with AI Features</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              A complete AI-powered note-taking system — all running locally on your machine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className={`group relative bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-indigo-500/50 hover:shadow-xl hover:${f.glow} hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/5 group-hover:to-purple-600/5 transition-all duration-300" />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">Three steps to organized AI notes</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30" />

            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-indigo-500/50 hover:shadow-xl transition-all"
              >
                <div className="text-7xl font-black text-slate-700 mb-4 leading-none">{s.step}</div>
                <div className={`w-12 h-12 rounded-2xl bg-${s.color}-500/20 flex items-center justify-center mb-4`}>
                  <s.icon size={22} className={`text-${s.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-4">
              <Code2 size={14} /> Tech Stack
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Built with Modern Tools</h2>
            <p className="text-slate-400">Everything runs locally — no cloud dependency</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2 px-4 py-2.5 ${t.bg} border border-slate-700 rounded-xl hover:border-slate-500 transition-colors`}
              >
                <span className={`font-bold text-sm ${t.color}`}>{t.name}</span>
                <span className="text-slate-600 text-xs">{t.category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-900" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-10" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6">
              <Star size={14} className="text-yellow-400" /> Free to use — no account needed
            </div>
            <h2 className="text-5xl font-black text-white mb-6">
              Ready to Transform<br />Your Notes?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Upload your first recording and get AI-powered notes in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 text-lg"
              >
                <Upload size={20} /> Upload Your First Recording
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/dashboard"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-all hover:-translate-y-1 text-lg"
              >
                View Dashboard
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-slate-500 text-sm">
              {[
                { icon: Shield, text: "100% Private" },
                { icon: Cpu,    text: "Runs Locally" },
                { icon: Zap,    text: "No API Cost"  },
                { icon: Check,  text: "Open Source"  },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <b.icon size={14} className="text-indigo-400" />
                  {b.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Mic size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">AI Voice <span className="text-indigo-400">Notes</span></span>
            </div>
            <p className="text-slate-500 text-sm">
              Built with Whisper · Fine-tuned T5-small · FastAPI · React · FFmpeg
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Shield size={14} className="text-indigo-400" />
              <span>Your data stays on your machine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
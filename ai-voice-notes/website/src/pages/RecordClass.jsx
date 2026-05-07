import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Radio, Square, Pause, Play, Mic, Loader, 
  Video, Monitor, Clock, 
  Brain, FileText, Sparkles, Volume2, Check, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { WS_URL } from '../api/client'
import { api } from '../services/authService'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const devices = [
  { icon: Mic,     label: 'Microphone', value: 'mic',    desc: 'Record audio only' },
  { icon: Video,   label: 'Webcam',     value: 'webcam', desc: 'Audio + video' },
  { icon: Monitor, label: 'Screen',     value: 'screen', desc: 'Screen share + audio' },
]

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect' },
  { code: 'en',   label: 'English' },
  { code: 'hi',   label: 'Hindi' },
  { code: 'te',   label: 'Telugu' },
  { code: 'ta',   label: 'Tamil' },
  { code: 'es',   label: 'Spanish' },
]

export default function RecordClass() {
  const navigate = useNavigate()

  const [status,     setStatus]     = useState('setup') // setup | recording | paused | processing | error
  const [deviceType, setDeviceType] = useState('mic')
  const [language,   setLanguage]   = useState('auto')
  const [classTitle, setClassTitle] = useState('')
  const [sessionId,  setSessionId]  = useState(null)
  const [elapsed,    setElapsed]    = useState(0)
  const [transcript, setTranscript] = useState('')
  const [summary,    setSummary]    = useState('')
  const [keywords,   setKeywords]   = useState([])
  const [errorMsg,   setErrorMsg]   = useState('')

  const mediaRecorderRef = useRef(null)
  const wsRef            = useRef(null)
  const timerRef         = useRef(null)
  const chunkTimerRef    = useRef(null)
  const streamRef        = useRef(null)
  const sessionIdRef     = useRef(null)   // keep a ref so handleEnd always has latest value
  const transcriptEndRef = useRef(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => () => cleanup(), [])

  const cleanup = () => {
    clearInterval(timerRef.current)
    clearInterval(chunkTimerRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null   // prevent error on intentional close
      wsRef.current.close()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const formatTime = (s) => {
    const h   = Math.floor(s / 3600).toString().padStart(2, '0')
    const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  // ── Step 1: get media stream ──────────────────────────────────────────────
  const getStream = async () => {
    if (deviceType === 'mic') {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    }
    if (deviceType === 'webcam') {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    }
    // screen
    return navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
  }

  // ── Start recording ───────────────────────────────────────────────────────
  const handleStart = async () => {
    setErrorMsg('')

    // 1. Get media first — so browser permission prompt shows immediately
    let stream
    try {
      stream = await getStream()
    } catch (err) {
      console.error('Media error:', err.name, err.message)
      const msg =
        err.name === 'NotAllowedError'  ? 'Permission denied. Please allow microphone/camera access in your browser.' :
        err.name === 'NotFoundError'    ? 'No microphone/camera found. Please connect a device.' :
        err.name === 'NotReadableError' ? 'Device is already in use by another application.' :
        `Could not access device: ${err.message}`
      setErrorMsg(msg)
      toast.error(msg)
      return
    }

    streamRef.current = stream

    // 2. Start backend session
    let sid
    try {
      const res = await api.post(`${BASE_URL}/meeting/start`)
      sid = res.data?.session_id
      if (!sid) throw new Error('No session_id returned from server')
    } catch (err) {
      console.error('Backend error:', err)
      stream.getTracks().forEach(t => t.stop())
      const msg = 'Failed to start recording session. Is the backend running?'
      setErrorMsg(msg)
      toast.error(msg)
      return
    }

    setSessionId(sid)
    sessionIdRef.current = sid

    // 3. Connect WebSocket
    const ws = new WebSocket(`${WS_URL}/meeting/${sid}/stream`)
    wsRef.current = ws

    ws.onopen  = () => console.log('WS connected, session', sid)
    ws.onerror = (e) => console.error('WS error', e)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'partial_transcript' && msg.text) {
          setTranscript(prev => prev ? prev + ' ' + msg.text : msg.text)
        }
        if (msg.type === 'summary'  && msg.text)     setSummary(msg.text)
        if (msg.type === 'keywords' && msg.keywords) setKeywords(msg.keywords)
      } catch (_) {}
    }

    // 4. Start MediaRecorder (audio only for transcription)
    const audioStream = new MediaStream(stream.getAudioTracks())
    let mimeType = 'audio/webm'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''

    const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : {})
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(e.data)
      }
    }

    recorder.start()

    // Send chunk every 30s
    chunkTimerRef.current = setInterval(() => {
      if (recorder.state === 'recording') recorder.requestData()
    }, 30000)

    // Timer
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    setStatus('recording')
    setElapsed(0)
    setTranscript('')
    setSummary('')
    setKeywords([])
  }

  // ── Pause / Resume ────────────────────────────────────────────────────────
  const handlePause = () => {
    if (status === 'recording') {
      mediaRecorderRef.current?.pause()
      clearInterval(timerRef.current)
      setStatus('paused')
    } else {
      mediaRecorderRef.current?.resume()
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
      setStatus('recording')
    }
  }

  // ── End & summarise ───────────────────────────────────────────────────────
  const handleEnd = async () => {
    const sid = sessionIdRef.current
    if (!sid) {
      toast.error('No active session found.')
      return
    }

    // flush last chunk
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.requestData()
    }

    cleanup()
    setStatus('processing')

    // small delay so last WS chunk can arrive
    await new Promise(r => setTimeout(r, 800))

    try {
      const res = await api.post(`${BASE_URL}/meeting/${sid}/end`)
      const noteId = res.data?.note_id

      if (!noteId) {
        toast.error('No audio was recorded or transcription failed.')
        setStatus('setup')
        return
      }

      toast.success('Class notes ready!')
      navigate(`/notes/${noteId}`)
    } catch (err) {
      console.error('End meeting error:', err)
      const detail = err.response?.data?.detail || 'Failed to process recording'
      toast.error(detail)
      setStatus('setup')
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    cleanup()
    setStatus('setup')
    setSessionId(null)
    sessionIdRef.current = null
    setElapsed(0)
    setTranscript('')
    setSummary('')
    setKeywords([])
    setErrorMsg('')
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl shadow-red-500/20 mb-4">
            <Radio size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Record Class</h1>
          <p className="text-slate-400">Record your class and get AI-powered notes instantly</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main Panel ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'recording'  ? 'bg-red-500 animate-pulse' :
                  status === 'paused'     ? 'bg-orange-500' :
                  status === 'processing' ? 'bg-indigo-500 animate-pulse' :
                  status === 'error'      ? 'bg-red-600' :
                  'bg-slate-500'
                }`} />
                <span className="text-slate-300 text-sm font-medium">
                  {status === 'setup'      ? 'Ready to Record' :
                   status === 'recording'  ? 'Recording in Progress' :
                   status === 'paused'     ? 'Paused' :
                   status === 'processing' ? 'Processing...' : 'Error'}
                </span>
              </div>
              {(status === 'recording' || status === 'paused') && (
                <div className="flex items-center gap-2 text-slate-300 font-mono text-lg">
                  <Clock size={16} className="text-slate-400" />
                  {formatTime(elapsed)}
                </div>
              )}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">

                {/* ── Setup ── */}
                {status === 'setup' && (
                  <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                    {/* Error banner */}
                    {errorMsg && (
                      <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{errorMsg}</p>
                      </div>
                    )}

                    {/* Device Selection */}
                    <div>
                      <label className="text-slate-300 text-sm font-medium mb-3 block">Select Input Device</label>
                      <div className="grid grid-cols-3 gap-3">
                        {devices.map((d, i) => (
                          <button
                            key={i}
                            onClick={() => setDeviceType(d.value)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              deviceType === d.value
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                            }`}
                          >
                            <d.icon size={24} className={deviceType === d.value ? 'text-indigo-400' : 'text-slate-400'} />
                            <p className={`font-medium mt-2 text-sm ${deviceType === d.value ? 'text-white' : 'text-slate-300'}`}>{d.label}</p>
                            <p className="text-slate-500 text-xs mt-1">{d.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Class Title */}
                    <div>
                      <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Class Title <span className="text-slate-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={classTitle}
                        onChange={e => setClassTitle(e.target.value)}
                        placeholder="e.g., Physics — Quantum Mechanics"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>

                    {/* Language */}
                    <div>
                      <label className="text-slate-300 text-sm font-medium mb-2 block">Language</label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang, i) => (
                          <button
                            key={i}
                            onClick={() => setLanguage(lang.code)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              language === lang.code ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={handleStart}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-lg"
                    >
                      <Radio size={22} /> Start Recording
                    </button>

                    {/* Permission hint */}
                    <p className="text-center text-slate-500 text-xs">
                      Your browser will ask for microphone/camera permission when you click Start.
                    </p>
                  </motion.div>
                )}

                {/* ── Recording / Paused ── */}
                {(status === 'recording' || status === 'paused') && (
                  <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                    {/* Live Transcript */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Live Transcript</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 h-56 overflow-y-auto">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {transcript || <span className="text-slate-500 italic">Listening… speak clearly into your microphone</span>}
                        </p>
                        <div ref={transcriptEndRef} />
                      </div>
                    </div>

                    {/* AI Summary Preview */}
                    {summary && (
                      <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-indigo-400" />
                          <span className="text-indigo-300 text-xs font-semibold">AI Summary</span>
                        </div>
                        <p className="text-slate-300 text-sm">{summary}</p>
                      </div>
                    )}

                    {/* Keywords */}
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">{kw}</span>
                        ))}
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-3">
                      <button
                        onClick={handlePause}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                          status === 'paused'
                            ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
                            : 'border-orange-500 text-orange-400 hover:bg-orange-500/10'
                        }`}
                      >
                        {status === 'paused' ? <><Play size={20} /> Resume</> : <><Pause size={20} /> Pause</>}
                      </button>
                      <button
                        onClick={handleEnd}
                        className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Square size={20} /> End & Get Notes
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Processing ── */}
                {status === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Loader size={36} className="text-indigo-400 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Generating Your Notes</h3>
                    <p className="text-slate-400 mb-6">AI is processing your recording…</p>
                    <div className="space-y-3 max-w-sm mx-auto">
                      {[
                        { icon: FileText,  label: 'Creating Transcript' },
                        { icon: Brain,     label: 'Generating Summary' },
                        { icon: Sparkles,  label: 'Extracting Keywords' },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-xl p-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <step.icon size={16} className="text-indigo-400" />
                          </div>
                          <span className="text-slate-300">{step.label}</span>
                          <div className="ml-auto w-4 h-4 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Side Panel ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Tips */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Volume2 size={16} className="text-indigo-400" /> Recording Tips
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  'Click Start — browser will ask for permission',
                  'Ensure quiet environment for best quality',
                  'Speak clearly and at moderate pace',
                  'Transcription happens every 30 seconds',
                  'Click End & Get Notes when done',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Features */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Brain size={16} /> AI Features
              </h3>
              <div className="space-y-3 text-sm text-white/90">
                {[
                  { icon: FileText, label: 'Real-time Transcript' },
                  { icon: Sparkles, label: 'Instant Summary' },
                  { icon: Brain,    label: 'Keyword Extraction' },
                  { icon: Volume2,  label: 'Multi-language Support' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <f.icon size={14} className="text-white/70" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Session Stats */}
            {status !== 'setup' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-5"
              >
                <h3 className="text-white font-bold mb-4">Session Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-mono">{formatTime(elapsed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Words</span>
                    <span className="text-white">{transcript.split(' ').filter(w => w).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Keywords</span>
                    <span className="text-white">{keywords.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Session ID</span>
                    <span className="text-white font-mono">#{sessionId}</span>
                  </div>
                </div>
                {(status === 'recording' || status === 'paused') && (
                  <button
                    onClick={handleReset}
                    className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/50 rounded-lg transition-colors"
                  >
                    Cancel Recording
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

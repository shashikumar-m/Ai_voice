import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Square, Pause, Play, Mic, MicOff, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { startMeeting, endMeeting, WS_URL } from '../api/client'

export default function Meeting() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | recording | paused | processing
  const [sessionId, setSessionId] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [parts, setParts] = useState([])

  const mediaRecorderRef = useRef(null)
  const wsRef = useRef(null)
  const timerRef = useRef(null)
  const chunkTimerRef = useRef(null)
  const streamRef = useRef(null)
  const transcriptEndRef = useRef(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => () => cleanup(), [])

  const cleanup = () => {
    clearInterval(timerRef.current)
    clearInterval(chunkTimerRef.current)
    wsRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const result = await startMeeting()
      const sid = result.session_id
      setSessionId(sid)

      // Connect WebSocket
      const ws = new WebSocket(`${WS_URL}/meeting/${sid}/stream`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === 'partial_transcript' && msg.text) {
          setParts(prev => [...prev, msg.text])
          setTranscript(prev => prev ? prev + ' ' + msg.text : msg.text)
        }
      }

      ws.onerror = () => toast.error('WebSocket error')

      // Start recording
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data)
        }
      }

      recorder.start()

      // Send chunk every 30s
      chunkTimerRef.current = setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.requestData()
        }
      }, 30000)

      // Timer
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

      setStatus('recording')
      setElapsed(0)
      setTranscript('')
      setParts([])
    } catch (err) {
      toast.error('Could not access microphone. Please allow permission.')
    }
  }

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

  const handleEnd = async () => {
    if (!sessionId) return
    cleanup()
    setStatus('processing')

    try {
      const result = await endMeeting(sessionId)
      toast.success('Meeting notes ready!')
      navigate(`/notes/${result.note_id}`)
    } catch (err) {
      toast.error('Failed to process meeting')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl shadow-red-200 mb-4">
            <Radio size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Live Meeting</h1>
          <p className="text-gray-500">Record and transcribe your meeting in real-time</p>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="p-8">
            {/* Recording Indicator */}
            <div className="flex flex-col items-center mb-8">
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-32 h-32 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center"
                  >
                    <MicOff size={48} className="text-red-300" />
                  </motion.div>
                )}

                {(status === 'recording' || status === 'paused') && (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative"
                  >
                    {status === 'recording' && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-red-400"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                          className="absolute inset-0 rounded-full bg-red-400"
                        />
                      </>
                    )}
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                      status === 'paused' ? 'bg-orange-100 border-4 border-orange-200' : 'bg-red-100 border-4 border-red-200'
                    }`}>
                      <Mic size={48} className={status === 'paused' ? 'text-orange-500' : 'text-red-500'} />
                    </div>
                  </motion.div>
                )}

                {status === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-32 h-32 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center"
                  >
                    <Loader size={48} className="text-indigo-500 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer */}
              {(status === 'recording' || status === 'paused') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-5xl font-black text-gray-900 tabular-nums"
                >
                  {formatTime(elapsed)}
                </motion.div>
              )}

              {status === 'processing' && (
                <p className="mt-4 text-lg font-semibold text-indigo-600">
                  Generating your notes...
                </p>
              )}

              {/* Status badge */}
              {status !== 'idle' && status !== 'processing' && (
                <div className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                  status === 'recording' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                  }`} />
                  {status === 'recording' ? 'Recording' : 'Paused'}
                </div>
              )}
            </div>

            {/* Live Transcript */}
            <AnimatePresence>
              {(status === 'recording' || status === 'paused') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 h-48 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Transcript</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {transcript || (
                        <span className="text-gray-400 italic">
                          Listening... speak clearly into your microphone
                        </span>
                      )}
                    </p>
                    <div ref={transcriptEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="space-y-3">
              {status === 'idle' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-red-200 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Radio size={22} />
                  Start Live Meeting
                </motion.button>
              )}

              {(status === 'recording' || status === 'paused') && (
                <div className="flex gap-3">
                  <button
                    onClick={handlePause}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                      status === 'paused'
                        ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                        : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {status === 'paused' ? <><Play size={20} /> Resume</> : <><Pause size={20} /> Pause</>}
                  </button>
                  <button
                    onClick={handleEnd}
                    className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Square size={20} />
                    End & Summarize
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100"
              >
                <p className="text-sm font-semibold text-indigo-700 mb-3">How it works</p>
                <ul className="space-y-2 text-sm text-indigo-600">
                  {[
                    '🎙️ Click Start — microphone permission required',
                    '📡 Audio transcribed every 30 seconds automatically',
                    '⏸️ Pause and resume anytime during the meeting',
                    '⏹️ End meeting to generate full AI summary',
                    '📝 Get organized notes with keywords instantly',
                  ].map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

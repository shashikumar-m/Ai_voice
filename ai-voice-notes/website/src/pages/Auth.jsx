import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Eye, EyeOff, AlertTriangle, Check } from "lucide-react"
import toast from "react-hot-toast"
import { registerUser, loginUser, saveSession, saveGuestMode } from "../services/authService"

export default function Auth({ onDone }) {
  const [tab, setTab] = useState("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showGuestWarning, setShowGuestWarning] = useState(false)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPass, setLoginPass] = useState("")
  const [showLoginPass, setShowLoginPass] = useState(false)

  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPass, setRegPass] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [showRegPass, setShowRegPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPass) { setError("Please fill in all fields"); return }
    setLoading(true); setError("")
    try {
      const data = await loginUser(loginEmail, loginPass)
      saveSession(data)
      toast.success(`Welcome back, ${data.user.name}!`)
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed")
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPass || !regConfirm) { setError("Please fill in all fields"); return }
    if (regPass !== regConfirm) { setError("Passwords do not match"); return }
    if (regPass.length < 6) { setError("Password must be at least 6 characters"); return }
    setLoading(true); setError("")
    try {
      const data = await registerUser(regName, regEmail, regPass)
      saveSession(data)
      toast.success(`Account created! Welcome, ${data.user.name}!`)
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed")
    } finally { setLoading(false) }
  }

  const handleGuest = () => {
    const warned = localStorage.getItem("guest_warning_shown")
    if (!warned) { setShowGuestWarning(true) }
    else { saveGuestMode(); onDone() }
  }

  const confirmGuest = () => {
    localStorage.setItem("guest_warning_shown", "true")
    saveGuestMode()
    setShowGuestWarning(false)
    onDone()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">

      {/* Guest Warning Modal */}
      <AnimatePresence>
        {showGuestWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-5">
                <AlertTriangle size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Guest Mode</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                In guest mode, your notes are <strong>not saved to an account</strong>.
                If you clear your browser data or switch devices, your notes will be lost.
                <br /><br />
                Create a free account to keep your notes safe and access them from anywhere.
              </p>
              <button onClick={confirmGuest}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl mb-3 hover:shadow-lg transition-all">
                Continue as Guest
              </button>
              <button onClick={() => setShowGuestWarning(false)}
                className="w-full py-3 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors">
                Go back and sign in
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <Mic size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">AI Voice Notes</h1>
          <p className="text-gray-500 mt-2 text-sm">Your AI-powered voice notes assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-50 border border-gray-100 p-8">

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError("") }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle size={15} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} onSubmit={handleLogin} className="space-y-4">
                <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com" />
                <PasswordField label="Password" value={loginPass} onChange={setLoginPass}
                  show={showLoginPass} toggle={() => setShowLoginPass(v => !v)} placeholder="••••••••" />
                <SubmitBtn loading={loading} label="Sign In" />
              </motion.form>
            ) : (
              <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} onSubmit={handleRegister} className="space-y-4">
                <Field label="Full Name" type="text" value={regName} onChange={setRegName} placeholder="John Doe" />
                <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@example.com" />
                <PasswordField label="Password" value={regPass} onChange={setRegPass}
                  show={showRegPass} toggle={() => setShowRegPass(v => !v)} placeholder="Min. 6 characters" />
                <PasswordField label="Confirm Password" value={regConfirm} onChange={setRegConfirm}
                  show={showConfirm} toggle={() => setShowConfirm(v => !v)} placeholder="••••••••" />
                <SubmitBtn loading={loading} label="Create Account" />
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Guest */}
          <button onClick={handleGuest} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all">
            Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all" />
    </div>
  )
}

function PasswordField({ label, value, onChange, show, toggle, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all" />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Please wait...
        </span>
      ) : label}
    </button>
  )
}

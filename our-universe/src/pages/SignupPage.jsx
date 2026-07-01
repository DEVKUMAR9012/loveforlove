import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginWithGoogle, signupWithEmail } from '../features/auth/authService'
import { isMissingConfig } from '../lib/firebase'
import useAuthStore from '../store/authStore'
import FloatingOrbs from '../components/layout/FloatingOrbs'

const SignupPage = () => {
  const navigate    = useNavigate()
  const setProfile  = useAuthStore(s => s.setProfile)

  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSuccess = (profile) => {
    setProfile(profile)
    // New signups must go to onboarding to get an invite code
    navigate('/onboarding', { replace: true })
  }

  const handleEmailSignup = async e => {
    e.preventDefault()
    setError('')

    if (isMissingConfig) {
      setError('Firebase is not configured. Please check your .env file.')
      return
    }

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const { profile } = await signupWithEmail(form.email, form.password, form.name)
      handleSuccess(profile)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    
    if (isMissingConfig) {
      setError('Firebase is not configured. Please check your .env file.')
      setGoogleLoading(false)
      return
    }

    try {
      const { profile } = await loginWithGoogle()
      handleSuccess(profile)
    } catch (err) {
      if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="page-container flex items-center justify-center p-4 min-h-[100dvh]">
      <FloatingOrbs />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="text-white/40 text-sm mt-2">Start your universe today 🌌</p>
        </div>

        <div className="glass-strong p-7 space-y-6">
          <button 
            type="button"
            className="btn-glass w-full h-12 flex items-center justify-center gap-3"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <span className="spinner-sm" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.09 1.35-.26 1.98H12v-3.74h7.66a7.12 7.12 0 0 0-1.01-3.55L5.27 9.76z"/>
                <path fill="#34A853" d="M12 19.08a7.07 7.07 0 0 1-6.73-4.84L1.63 16.3A11.08 11.08 0 0 0 12 23.08c2.97 0 5.46-1.08 7.28-2.85l-3.57-2.77a7.08 7.08 0 0 1-3.71 1.62z"/>
                <path fill="#4A90D9" d="M5.27 14.24A7.08 7.08 0 0 1 4.92 12c0-.77.13-1.52.35-2.24L1.63 7.7A11.1 11.1 0 0 0 .92 12c0 1.78.42 3.46 1.18 4.93l3.17-2.69z"/>
                <path fill="#FBBC05" d="M12 4.92a7.08 7.08 0 0 1 4.61 1.7l3.3-3.3A11.07 11.07 0 0 0 12 .92a11.08 11.08 0 0 0-10.37 6.78l3.64 2.06A7.08 7.08 0 0 1 12 4.92z"/>
              </svg>
            )}
            Sign up with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="divider-gradient flex-1" />
            <span className="text-white/30 text-xs font-medium uppercase tracking-widest">or</span>
            <div className="divider-gradient flex-1" />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4" noValidate>
            <div>
              <label className="input-label" htmlFor="signup-name">Display Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Stargazer"
                className="input"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="input"
              />
            </div>

            {error && (
              <motion.div className="alert-error text-sm" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <span>{error}</span>
              </motion.div>
            )}

            <button type="submit" className="btn-primary w-full h-12 mt-2" disabled={loading || googleLoading}>
              {loading ? <span className="spinner-sm" /> : 'Create Account ✨'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const friendlyError = (code) => {
  const map = {
    'auth/email-already-in-use':   'An account already exists with this email.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password is too weak. Use at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/unauthorized':           'Unauthorized: Only the true stargazer (dk25042008@gmail.com) can enter.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

export default SignupPage

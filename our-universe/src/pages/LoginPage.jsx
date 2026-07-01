import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginWithGoogle, loginWithEmail } from '../features/auth/authService'
import { isMissingConfig } from '../lib/firebase'
import useAuthStore from '../store/authStore'
import FloatingOrbs from '../components/layout/FloatingOrbs'

const LoginPage = () => {
  const navigate    = useNavigate()
  const location    = useLocation()
  const setProfile  = useAuthStore(s => s.setProfile)

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Default redirect is dashboard, unless they came from somewhere else
  const from = location.state?.from?.pathname ?? '/dashboard'

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSuccess = (profile, isNewUser) => {
    setProfile(profile)
    // If they have no coupleId, they MUST go through onboarding
    if (!profile?.coupleId) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleEmailLogin = async e => {
    e.preventDefault()
    setError('')

    if (isMissingConfig) {
      setError('Firebase is not configured. Please check your .env file.')
      return
    }

    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const { profile, isNewUser } = await loginWithEmail(form.email, form.password)
      handleSuccess(profile, isNewUser)
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
      const { profile, isNewUser } = await loginWithGoogle()
      handleSuccess(profile, isNewUser)
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

      {/* Ambient background particles */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:  Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left:   `${Math.random() * 100}%`,
              top:    `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-4"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--glow-pink)' }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🌌
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text">Our Universe</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, stargazer 💫</p>
        </div>

        {/* Login Card */}
        <div className="glass-strong p-7 space-y-6">
          
          {/* Google Login Button */}
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
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="divider-gradient flex-1" />
            <span className="text-white/30 text-xs font-medium uppercase tracking-widest">or</span>
            <div className="divider-gradient flex-1" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
            <div>
              <label className="input-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
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
              <label className="input-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="alert-error text-sm"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-primary w-full h-12 mt-2"
              disabled={loading || googleLoading}
            >
              {loading ? <span className="spinner-sm" /> : 'Enter the Universe ✨'}
            </button>
          </form>

          {/* Footer links */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-white/40 text-sm">
              New here?{' '}
              <Link to="/signup" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Friendly Firebase Error Messages ────────────────────────────────────────
const friendlyError = (code) => {
  const map = {
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-api-key':        'Firebase configuration error. Please update your .env.',
    'auth/app-deleted':            'Firebase app has been deleted.',
    'auth/invalid-user-token':     'Please sign in again.',
    'auth/unauthorized':           'Unauthorized: Only the true stargazer (dk25042008@gmail.com) can enter.',
    'firestore/not-created':       'Database missing! Please enable Firestore Database in the Firebase Console.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

export default LoginPage

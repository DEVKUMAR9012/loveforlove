import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blush-50 via-white to-sky-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blush-200 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-sky-200 rounded-full opacity-30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass p-8 rounded-3xl shadow-xl w-full max-w-sm mx-4 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >
            🌸
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignUp ? 'Join the universe' : 'Welcome back'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignUp ? 'Create your personal space' : 'Sign in to your safe space'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <input
                  id="name-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-3 rounded-2xl border border-blush-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blush-400 text-gray-800 placeholder-gray-400 transition"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            id="email-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border border-blush-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blush-400 text-gray-800 placeholder-gray-400 transition"
          />
          <input
            id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border border-blush-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blush-400 text-gray-800 placeholder-gray-400 transition"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-blush-400 to-blush-500 hover:from-blush-500 hover:to-blush-600 text-white py-3 rounded-2xl font-semibold transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 mt-5 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            id="toggle-auth-mode"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-blush-600 font-semibold ml-1 hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;

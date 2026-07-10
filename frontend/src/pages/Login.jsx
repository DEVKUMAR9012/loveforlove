import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaInstagram, FaFacebook } from 'react-icons/fa';

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');

function Login() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const navigate = useNavigate();
  const { user, signInWithSocial, acceptPartnerInvite } = useAuth();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSocialAuth = async (provider) => {
    setError('');
    setLoading(provider);
    const inviteCode = normalizeInviteCode(
      searchParams.get('code') || sessionStorage.getItem('pendingInviteCode') || ''
    );
    try {
      await signInWithSocial(provider);
      if (inviteCode) {
        await acceptPartnerInvite(inviteCode);
        sessionStorage.removeItem('pendingInviteCode');
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  };

  const socialButtons = [
    {
      id: 'google',
      label: 'Continue with Google',
      icon: <FcGoogle className="text-2xl" />,
      className: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md',
    },
    {
      id: 'instagram',
      label: 'Continue with Instagram',
      icon: <FaInstagram className="text-2xl text-white" />,
      className: 'text-white hover:opacity-90 shadow-sm hover:shadow-md',
      style: { background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' },
    },
    {
      id: 'facebook',
      label: 'Continue with Facebook',
      icon: <FaFacebook className="text-2xl text-white" />,
      className: 'bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-sm hover:shadow-md',
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blush-50 via-white to-sky-50 relative overflow-hidden px-4">
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blush-200 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-sky-200 rounded-full opacity-30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass p-8 rounded-3xl shadow-xl w-full max-w-sm relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-5xl mb-4"
          >
            🌸
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your safe space</p>
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          {socialButtons.map((btn) => (
            <motion.button
              key={btn.id}
              id={`login-${btn.id}-btn`}
              type="button"
              disabled={!!loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              onClick={() => handleSocialAuth(btn.id)}
              className={`relative flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all ${btn.className}`}
              style={btn.style}
            >
              {loading === btn.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
                  <span className="opacity-70">Signing in…</span>
                </>
              ) : (
                <>
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
                    {btn.icon}
                  </span>
                  <span>{btn.label}</span>
                </>
              )}
            </motion.button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2 mt-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-300 mt-8">
          Your memories are private & secure 🔒
        </p>
      </motion.div>
    </div>
  );
}

export default Login;

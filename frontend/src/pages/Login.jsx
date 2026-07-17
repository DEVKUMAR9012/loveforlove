import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import { AnimatedMainLogo } from '../components/MainLogo';

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');


function Login() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [showLoginOptions, setShowLoginOptions] = useState(false);
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
      className: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    },
    {
      id: 'instagram',
      label: 'Continue with Instagram',
      icon: <FaInstagram className="text-2xl text-white" />,
      className: 'text-white hover:opacity-90',
      style: { background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' },
    },
    {
      id: 'facebook',
      label: 'Continue with Facebook',
      icon: <FaFacebook className="text-2xl text-white" />,
      className: 'bg-[#1877F2] text-white hover:bg-[#166fe5]',
    },
  ];


  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full z-10 relative">
        <div className="flex items-center gap-2">
          <AnimatedMainLogo className="w-10 h-10" />
          <span className="text-[#8b1c31] font-bold text-2xl tracking-tight">loveforlove</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</Link>
          <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
          <button
            onClick={() => setShowLoginOptions(true)}
            className="px-6 py-2 rounded-full text-white font-medium bg-gradient-to-r from-[#ee2a7b] to-[#f9ce34] hover:opacity-90 transition-opacity"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center pt-20 pb-32 px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <AnimatedMainLogo className="w-64 h-64 md:w-80 md:h-80 mb-6 drop-shadow-xl" />
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
            className="text-6xl md:text-8xl font-extrabold text-[#8b1c31] tracking-tighter mb-4"
          >
            loveforlove
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.75 }}
            className="text-xl md:text-2xl text-gray-700 font-medium mb-12"
          >
            Your Connection, Everlasting.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.9 }}
            onClick={() => setShowLoginOptions(true)}
            className="px-10 py-4 rounded-full text-white font-bold text-xl shadow-lg bg-gradient-to-r from-[#ee2a7b] to-[#f9ce34] hover:scale-105 transition-transform"
          >
            Start Your Journey
          </motion.button>
        </motion.div>
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative border border-gray-100"
            >
              <button
                onClick={() => setShowLoginOptions(false)}
                className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>

              <div className="text-center mb-8">
                <AnimatedMainLogo className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#8b1c31]">Sign in</h2>
                <p className="text-gray-500 text-sm mt-1">to your safe space</p>
              </div>

              <div className="flex flex-col gap-3">
                {socialButtons.map((btn) => (
                  <button
                    key={btn.id}
                    disabled={!!loading}
                    onClick={() => handleSocialAuth(btn.id)}
                    className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${btn.className}`}
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
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2 mt-4">
                  {error}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Login;
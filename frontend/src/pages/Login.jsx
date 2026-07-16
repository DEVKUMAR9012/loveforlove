import { useState, useEffect, useId } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaInstagram, FaFacebook } from 'react-icons/fa';

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');

// Draw-in variants for each ribbon stroke of the logo
const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, delay: i * 0.25, ease: 'easeInOut' },
      opacity: { duration: 0.3, delay: i * 0.25 },
    },
  }),
};

const gloss = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 0.35,
    transition: { duration: 0.5, delay: 1 + i * 0.1 },
  }),
};

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

  // SVG for the Woven Infinity-Heart Logo.
  // Both strokes draw themselves in on mount (like being sketched), then
  // settle in place. Wrapped by AnimatedLogo below for the heartbeat pulse.
  const LogoSVG = ({ className, animateDraw = true }) => {
    const uid = useId();
    const gradId = `logoGradient-${uid}`;
    const gradSoftId = `logoGradientSoft-${uid}`;

    return (
      <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ee2a7b" />
            <stop offset="50%" stopColor="#f26e4e" />
            <stop offset="100%" stopColor="#f9ce34" />
          </linearGradient>
          <linearGradient id={gradSoftId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ee2a7b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#f26e4e" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f9ce34" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Back strand: starts left of the cleft, loops up into the RIGHT hump,
            then sweeps down the outer-right edge to the shared bottom point */}
        <motion.path
          d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
          fill="none"
          stroke={`url(#${gradSoftId})`}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animateDraw ? 'hidden' : false}
          animate="visible"
          custom={0}
          variants={drawPath}
        />

        {/* Front strand: starts right of the cleft, loops up into the LEFT hump,
            then sweeps down the outer-left edge to the shared bottom point.
            Drawn second so it appears to weave over the back strand at the cleft. */}
        <motion.path
          d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animateDraw ? 'hidden' : false}
          animate="visible"
          custom={1}
          variants={drawPath}
        />

        {/* Subtle gloss highlight along the top of each hump for depth */}
        <motion.path
          d="M100,42 C108,26 126,18 148,20"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          initial={animateDraw ? 'hidden' : false}
          animate="visible"
          custom={0}
          variants={gloss}
        />
        <motion.path
          d="M100,42 C92,26 74,18 52,20"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          initial={animateDraw ? 'hidden' : false}
          animate="visible"
          custom={1}
          variants={gloss}
        />
      </svg>
    );
  };

  // Wraps LogoSVG: lets the strokes draw themselves in, then settles into a
  // gentle, looping heartbeat pulse.
  const AnimatedLogo = ({ className }) => (
    <motion.div
      className="inline-block"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1, 1.08, 1, 1.05, 1] }}
      transition={{
        duration: 1.6,
        delay: 1.4,
        repeat: Infinity,
        repeatDelay: 1.8,
        ease: 'easeInOut',
      }}
    >
      <LogoSVG className={className} />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full z-10 relative">
        <div className="flex items-center gap-2">
          <AnimatedLogo className="w-10 h-10" />
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
          <AnimatedLogo className="w-64 h-64 md:w-80 md:h-80 mb-6 drop-shadow-xl" />
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
                <AnimatedLogo className="w-12 h-12 mx-auto mb-4" />
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
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    emoji: '📸',
    title: 'Memory Gallery',
    desc: 'Upload & relive your precious photos together',
    bg: 'bg-pink-50',
    from: '#f472b6',
    to: '#f43f5e',
  },
  {
    emoji: '📅',
    title: 'Shared Calendar',
    desc: 'Mark anniversaries, dates & special moments',
    bg: 'bg-sky-50',
    from: '#38bdf8',
    to: '#3b82f6',
  },
  {
    emoji: '💛',
    title: 'Mood Journal',
    desc: 'Track your feelings and share your emotions',
    bg: 'bg-amber-50',
    from: '#fbbf24',
    to: '#f59e0b',
  },
  {
    emoji: '🎙️',
    title: 'Voice Notes',
    desc: 'Record and send sweet voice messages',
    bg: 'bg-violet-50',
    from: '#a78bfa',
    to: '#8b5cf6',
  },
  {
    emoji: '💌',
    title: 'Love Messages',
    desc: 'Write heartfelt letters & private notes',
    bg: 'bg-teal-50',
    from: '#2dd4bf',
    to: '#10b981',
  },
  {
    emoji: '📷',
    title: 'Snap',
    desc: 'Capture selfies & spontaneous moments',
    bg: 'bg-orange-50',
    from: '#fb923c',
    to: '#ef4444',
  },
];

const STORAGE_KEY = 'lfl_banner_seen';

export default function WelcomeBanner({ user }) {
  const [visible, setVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const intervalRef = useRef(null);

  // Reset and start auto‑cycling interval
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveFeature((p) => (p + 1) % features.length);
    }, 1800);
  }, []);

  useEffect(() => {
    // Only show if user is logged in, show every time after login
    if (!user) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (visible) {
      startInterval();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [visible, startInterval]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  const handleFeatureSelect = (index) => {
    setActiveFeature(index);
    startInterval();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-banner"
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 10, 30, 0.65)', backdropFilter: 'blur(12px)' }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-heading"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '2rem',
              boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-400 via-sky-400 to-violet-400" />

            <button
              type="button"
              aria-label="Close welcome banner"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10 text-lg font-light"
            >
              ✕
            </button>

            <div className="px-8 pt-10 pb-8">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="text-5xl mb-3 inline-block"
                  aria-hidden="true"
                >
                  🌸
                </motion.div>
                <h2 id="banner-heading" className="text-2xl font-bold text-gray-800 mb-1">
                  Welcome to{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #f472b6, #818cf8)' }}
                  >
                    LoveForLove
                  </span>
                </h2>
                <p className="text-gray-400 text-sm">Your private space for two 💑</p>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      role="button"
                      tabIndex={0}
                      aria-label={`Feature: ${f.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleFeatureSelect(i);
                        }
                      }}
                      animate={{
                        scale: activeFeature === i ? 1.06 : 1,
                        opacity: activeFeature === i ? 1 : 0.55,
                      }}
                      transition={{ duration: 0.35 }}
                      className={`${f.bg} rounded-2xl p-3 text-center cursor-pointer border-2 border-transparent transition-all`}
                      style={
                        activeFeature === i
                          ? {
                            border: '2px solid transparent',
                            background: `linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, ${f.from}, ${f.to}) border-box`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          }
                          : {}
                      }
                      onClick={() => handleFeatureSelect(i)}
                    >
                      <div className="text-2xl mb-1" aria-hidden="true">
                        {f.emoji}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{f.title}</p>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-sm text-gray-500 font-medium">
                      <span className="mr-1" aria-hidden="true">
                        {features[activeFeature].emoji}
                      </span>
                      {features[activeFeature].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-center gap-1.5 mb-6">
                {features.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show feature ${i + 1}: ${features[i].title}`}
                    onClick={() => handleFeatureSelect(i)}
                    className="transition-all rounded-full"
                    style={{
                      width: activeFeature === i ? 20 : 6,
                      height: 6,
                      background:
                        activeFeature === i
                          ? 'linear-gradient(90deg, #f472b6, #818cf8)'
                          : '#e5e7eb',
                    }}
                  />
                ))}
              </div>

              <motion.button
                type="button"
                aria-label="Explore your space"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f472b6 0%, #818cf8 100%)',
                  boxShadow: '0 8px 24px rgba(244,114,182,0.35)',
                }}
              >
                Explore your space ✨
              </motion.button>

              <p className="text-center text-xs text-gray-300 mt-3">
                Tap outside or press Esc to dismiss.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
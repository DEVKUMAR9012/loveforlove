import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    emoji: '📸',
    title: 'Memory Gallery',
    desc: 'Upload & relive your precious photos together',
    color: 'from-pink-400 to-rose-400',
    bg: 'bg-pink-50',
  },
  {
    emoji: '📅',
    title: 'Shared Calendar',
    desc: 'Mark anniversaries, dates & special moments',
    color: 'from-sky-400 to-blue-400',
    bg: 'bg-sky-50',
  },
  {
    emoji: '💛',
    title: 'Mood Journal',
    desc: 'Track your feelings and share your emotions',
    color: 'from-amber-400 to-yellow-400',
    bg: 'bg-amber-50',
  },
  {
    emoji: '🎙️',
    title: 'Voice Notes',
    desc: 'Record and send sweet voice messages',
    color: 'from-violet-400 to-purple-400',
    bg: 'bg-violet-50',
  },
  {
    emoji: '💌',
    title: 'Love Messages',
    desc: 'Write heartfelt letters & private notes',
    color: 'from-teal-400 to-emerald-400',
    bg: 'bg-teal-50',
  },
  {
    emoji: '📷',
    title: 'Snap',
    desc: 'Capture selfies & spontaneous moments',
    color: 'from-orange-400 to-red-400',
    bg: 'bg-orange-50',
  },
];

const STORAGE_KEY = 'lfl_banner_seen';

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Only show once per session
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) return;

    // Show after 10 seconds
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveFeature((p) => (p + 1) % features.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [visible]);

  const handleClose = () => {
    setClosing(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setVisible(false), 400);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: closing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 10, 30, 0.65)', backdropFilter: 'blur(12px)' }}
          onClick={handleClose}
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
            {/* Top gradient stripe */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-400 via-sky-400 to-violet-400" />

            {/* Close button */}
            <button
              id="banner-close-btn"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10 text-lg font-light"
            >
              ✕
            </button>

            <div className="px-8 pt-10 pb-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="text-5xl mb-3 inline-block"
                >
                  🌸
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
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

              {/* Features showcase - animated spotlight */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: activeFeature === i ? 1.06 : 1,
                        opacity: activeFeature === i ? 1 : 0.55,
                      }}
                      transition={{ duration: 0.35 }}
                      className={`${f.bg} rounded-2xl p-3 text-center cursor-pointer border-2 transition-all`}
                      style={{
                        borderColor: activeFeature === i ? 'transparent' : 'transparent',
                        boxShadow:
                          activeFeature === i
                            ? '0 8px 24px rgba(0,0,0,0.12)'
                            : 'none',
                        backgroundImage:
                          activeFeature === i
                            ? `linear-gradient(135deg, white, white), linear-gradient(135deg, ${f.color.replace('from-', '').replace('to-', ', ')})`
                            : undefined,
                      }}
                      onClick={() => setActiveFeature(i)}
                    >
                      <div className="text-2xl mb-1">{f.emoji}</div>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{f.title}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Active feature description */}
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
                      <span className="mr-1">{features[activeFeature].emoji}</span>
                      {features[activeFeature].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
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

              {/* CTA */}
              <motion.button
                id="banner-explore-btn"
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
                This will only show once. Tap outside to dismiss.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

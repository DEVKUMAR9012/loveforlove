/**
 * MainLogo — single source of truth for the Together Forever woven-heart logo.
 *
 * Two thick rounded strokes cross at the top centre to form the iconic
 * "woven ribbon" heart silhouette with a pink→orange→yellow gradient.
 *
 * Usage:
 *   <MainLogo className="w-16 h-16" />
 *   <AnimatedMainLogo className="w-16 h-16" />   ← draws in + heartbeat pulse
 */
import { useId } from 'react';
import { motion } from 'framer-motion';

/* ─── Static version ──────────────────────────────────────────────────── */
export function MainLogo({ className = 'w-12 h-12' }) {
  const uid = useId();
  const gId  = `ml-g-${uid}`;
  const gId2 = `ml-g2-${uid}`;

  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Together Forever logo">
      <defs>
        <linearGradient id={gId2} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ee2a7b" stopOpacity="0.85" />
          <stop offset="50%"  stopColor="#f26e4e" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f9ce34" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ee2a7b" />
          <stop offset="50%"  stopColor="#f26e4e" />
          <stop offset="100%" stopColor="#f9ce34" />
        </linearGradient>
      </defs>

      {/* Back strand — right hump, drawn first so front strand weaves over it */}
      <path
        d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
        fill="none"
        stroke={`url(#${gId2})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Front strand — left hump, crosses over the back strand at the cleft */}
      <path
        d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gloss highlights for depth */}
      <path d="M100,42 C108,26 126,18 148,20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
      <path d="M100,42 C92,26 74,18 52,20"  fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/* ─── Draw-in animation variants ─────────────────────────────────────── */
const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, delay: i * 0.25, ease: 'easeInOut' },
      opacity:    { duration: 0.3, delay: i * 0.25 },
    },
  }),
};

const gloss = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 0.35,
    transition: { duration: 0.5, delay: 1 + i * 0.1 },
  }),
};

/* ─── Animated version — draws in on mount then heartbeat pulses ─────── */
export function AnimatedMainLogo({ className = 'w-16 h-16' }) {
  const uid = useId();
  const gId  = `aml-g-${uid}`;
  const gId2 = `aml-g2-${uid}`;

  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Together Forever logo"
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
      <defs>
        <linearGradient id={gId2} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ee2a7b" stopOpacity="0.85" />
          <stop offset="50%"  stopColor="#f26e4e" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f9ce34" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ee2a7b" />
          <stop offset="50%"  stopColor="#f26e4e" />
          <stop offset="100%" stopColor="#f9ce34" />
        </linearGradient>
      </defs>

      {/* Back strand */}
      <motion.path
        d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
        fill="none"
        stroke={`url(#${gId2})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={drawPath}
      />

      {/* Front strand — weaves over the back */}
      <motion.path
        d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={drawPath}
      />

      {/* Gloss highlights */}
      <motion.path d="M100,42 C108,26 126,18 148,20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" initial="hidden" animate="visible" custom={0} variants={gloss} />
      <motion.path d="M100,42 C92,26 74,18 52,20"  fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" initial="hidden" animate="visible" custom={1} variants={gloss} />
    </motion.svg>
  );
}

export default MainLogo;

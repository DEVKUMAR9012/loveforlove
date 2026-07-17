/**
 * MainLogo — the single source of truth for the Together Forever heart logo.
 *
 * Matches the main brand logo exactly:
 *  - Thick, rounded, gradient-filled heart strokes that form a V shape
 *  - Gradient: #ee2a7b → #f26e4e → #f9a825 (pink → orange → gold)
 *  - A small teardrop overlap at the top centre (the "knot")
 *  - Clean, filled silhouette — NOT a thin outlined stroke
 *
 * Usage:
 *   <MainLogo className="w-16 h-16" />
 *   <AnimatedMainLogo className="w-16 h-16" />
 */
import { useId } from 'react';
import { motion } from 'framer-motion';

export function MainLogo({ className = 'w-12 h-12' }) {
  const uid = useId();
  const gId = `mlg-${uid}`;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Together Forever logo"
    >
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="110%">
          <stop offset="0%"   stopColor="#ee2a7b" />
          <stop offset="45%"  stopColor="#f26e4e" />
          <stop offset="100%" stopColor="#f9a825" />
        </linearGradient>
      </defs>

      {/*
        Right lobe — curves from the knot at top-centre down the right
        side and converges to the bottom tip.
      */}
      <path
        d="M104,54 C110,28 134,10 160,14 C188,18 196,50 178,76
           C162,100 132,138 104,182"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/*
        Left lobe — mirror of the right, same gradient.
      */}
      <path
        d="M96,54 C90,28 66,10 40,14 C12,18 4,50 22,76
           C38,100 68,138 96,182"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/*
        Knot — small teardrop / overlap shape at the very top centre,
        exactly like the main logo reference image.
      */}
      <ellipse
        cx="100"
        cy="56"
        rx="11"
        ry="15"
        fill={`url(#${gId})`}
        opacity="0.9"
      />
    </svg>
  );
}

/* Draw-in animation variants for Framer Motion */
const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.0, delay: i * 0.22, ease: 'easeInOut' },
      opacity:    { duration: 0.3, delay: i * 0.22 },
    },
  }),
};

/**
 * AnimatedMainLogo — logo that draws itself in then does a heartbeat pulse.
 * Drop-in replacement for the old AnimatedLogo in Sidebar / Dashboard.
 */
export function AnimatedMainLogo({ className = 'w-16 h-16' }) {
  const uid = useId();
  const gId = `amlg-${uid}`;

  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Together Forever logo"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1, 1.09, 1, 1.05, 1] }}
      transition={{
        duration: 1.6,
        delay: 1.6,
        repeat: Infinity,
        repeatDelay: 2.0,
        ease: 'easeInOut',
      }}
    >
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="110%">
          <stop offset="0%"   stopColor="#ee2a7b" />
          <stop offset="45%"  stopColor="#f26e4e" />
          <stop offset="100%" stopColor="#f9a825" />
        </linearGradient>
      </defs>

      <motion.path
        d="M104,54 C110,28 134,10 160,14 C188,18 196,50 178,76
           C162,100 132,138 104,182"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={drawPath}
      />

      <motion.path
        d="M96,54 C90,28 66,10 40,14 C12,18 4,50 22,76
           C38,100 68,138 96,182"
        fill="none"
        stroke={`url(#${gId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={drawPath}
      />

      <motion.ellipse
        cx="100"
        cy="56"
        rx="11"
        ry="15"
        fill={`url(#${gId})`}
        opacity="0.9"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: 'backOut' }}
      />
    </motion.svg>
  );
}

export default MainLogo;

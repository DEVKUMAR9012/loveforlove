/**
 * MainLogo — single source of truth for the Together Forever woven-heart logo.
 *
 * Two thick rounded strokes cross at the top centre to form the iconic
 * "woven ribbon" heart silhouette with a pink→orange→yellow gradient.
 *
 * Usage:
 *   <MainLogo className="w-16 h-16" />
 *   <AnimatedMainLogo className="w-16 h-16" />   ← draws in + heartbeat pulse
 *                                                    + elastic hover + click twang
 */
import { useId, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/* ─── Shared, lazily-created AudioContext ─────────────────────────────── */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

/** Play a short synthesised "twang" — triangle wave with freq sweep + decay */
function playTwang() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    const t = ctx.currentTime;
    // Quick down→up→down frequency sweep over ~220ms
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);

    // Fast exponential decay — fades out naturally, no click at the end
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.start(t);
    osc.stop(t + 0.26);
  } catch (_) {
    // If browser blocked audio or Web Audio unavailable, silently skip
  }
}

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

/* ─── Elastic constants ───────────────────────────────────────────────── */
const MAX_STRETCH  = 0.10;  // max ±10% scale deviation
const MAX_SKEW_DEG = 4.5;   // max ±4.5° skew
const MAX_TRANS_PX = 5;     // max ±5px translate

const SPRING_OPTS = { stiffness: 300, damping: 15 };

/* ─── Animated version — draws in on mount, heartbeat pulse, elastic hover */
export function AnimatedMainLogo({ className = 'w-16 h-16' }) {
  const uid = useId();
  const gId  = `aml-g-${uid}`;
  const gId2 = `aml-g2-${uid}`;

  const prefersReduced = useReducedMotion();
  const containerRef   = useRef(null);

  /* Raw motion values — updated instantly on pointer move */
  const rawScaleX  = useMotionValue(1);
  const rawScaleY  = useMotionValue(1);
  const rawSkewX   = useMotionValue(0);
  const rawTransX  = useMotionValue(0);
  const rawTransY  = useMotionValue(0);

  /* Springified — gives the overshoot + bounce-back on pointer-leave */
  const scaleX = useSpring(rawScaleX, SPRING_OPTS);
  const scaleY = useSpring(rawScaleY, SPRING_OPTS);
  const skewX  = useSpring(rawSkewX,  SPRING_OPTS);
  const x      = useSpring(rawTransX, SPRING_OPTS);
  const y      = useSpring(rawTransY, SPRING_OPTS);

  const handlePointerMove = useCallback((e) => {
    if (prefersReduced || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    // Normalise offset to [-1, 1]
    const nx   = (e.clientX - cx) / (rect.width  / 2);
    const ny   = (e.clientY - cy) / (rect.height / 2);

    rawScaleX.set(1 + nx * MAX_STRETCH);
    rawScaleY.set(1 + ny * MAX_STRETCH);
    rawSkewX.set(nx * MAX_SKEW_DEG);
    rawTransX.set(nx * MAX_TRANS_PX);
    rawTransY.set(ny * MAX_TRANS_PX);
  }, [prefersReduced, rawScaleX, rawScaleY, rawSkewX, rawTransX, rawTransY]);

  const handlePointerLeave = useCallback(() => {
    // Set raws to resting — spring carries it through an overshoot
    rawScaleX.set(1);
    rawScaleY.set(1);
    rawSkewX.set(0);
    rawTransX.set(0);
    rawTransY.set(0);
  }, [rawScaleX, rawScaleY, rawSkewX, rawTransX, rawTransY]);

  const handleClick = useCallback(() => {
    // Sound always plays (not motion, so not gated by prefers-reduced-motion)
    playTwang();

    if (prefersReduced) return;

    // Squish: compress horizontally, stretch vertically, then spring back
    rawScaleX.set(0.85);
    rawScaleY.set(1.15);
    setTimeout(() => {
      rawScaleX.set(1);
      rawScaleY.set(1);
    }, 70);
  }, [prefersReduced, rawScaleX, rawScaleY]);

  return (
    <motion.div
      ref={containerRef}
      style={{
        scaleX,
        scaleY,
        skewX,
        x,
        y,
        display: 'inline-flex',
        transformOrigin: 'center center',
        cursor: 'pointer',
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <motion.svg
        viewBox="0 0 200 200"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Together Forever logo"
        /* Heartbeat pulse — completely unchanged from before */
        initial={{ scale: 1 }}
        animate={prefersReduced ? {} : { scale: [1, 1, 1.08, 1, 1.05, 1] }}
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
    </motion.div>
  );
}

export default MainLogo;

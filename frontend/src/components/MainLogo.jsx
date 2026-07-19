/**
 * MainLogo — single source of truth for the Together Forever woven-heart logo.
 *
 * AnimatedMainLogo has:
 *   - Draw-in stroke animation on mount
 *   - Heartbeat pulse (unchanged)
 *   - Rubber-band drag: grab and pull in any direction → rotate-scale-rotate
 *     stretch along the pull angle → spring bounce-back with twang on release
 */
import { useId, useRef, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ── Shared AudioContext (lazy, created once) ───────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

/**
 * Play a synthesised twang. `mag` is 0–1 and scales pitch + volume:
 * bigger stretch → punchier sound.
 */
function playTwang(mag) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t        = ctx.currentTime;
    const baseFreq = 340 + mag * 380;          // 340–720 Hz
    const peakGain = 0.12 + mag * 0.38;        // 0.12–0.50

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq,           t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.32, t + 0.27);

    gain.gain.setValueAtTime(peakGain,   t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);

    osc.start(t);
    osc.stop(t + 0.31);
  } catch (_) {
    // Browser blocked audio (no prior interaction) — silently skip
  }
}

// ── Drag / spring constants ────────────────────────────────────────────────
const MAX_DRAG_PX      = 85;   // drag is clamped to this many pixels
const TRANSLATE_FACTOR = 0.33; // how far logo drifts toward the cursor
const MAX_ELONGATE     = 0.44; // max stretch: scale = 1 + 0.44 = 1.44
const MIN_SQUEEZE      = 0.70; // never squeeze below 0.70 (rubber band width)
const DRAG_THRESHOLD   = 5;    // px of movement before counting as a drag
// Spring: underdamped so it oscillates past zero a few times ("boing")
const SPRING_STIFFNESS = 155;
const SPRING_DAMPING   = 7;

// ── Draw-in animation variants ─────────────────────────────────────────────
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

// ── Static version ─────────────────────────────────────────────────────────
export function MainLogo({ className = 'w-12 h-12' }) {
  const uid  = useId();
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
      <path d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
        fill="none" stroke={`url(#${gId2})`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
        fill="none" stroke={`url(#${gId})`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100,42 C108,26 126,18 148,20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
      <path d="M100,42 C92,26 74,18 52,20"   fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

// ── Animated + rubber-band draggable logo ──────────────────────────────────
export function AnimatedMainLogo({ className = 'w-16 h-16' }) {
  const uid  = useId();
  const gId  = `aml-g-${uid}`;
  const gId2 = `aml-g2-${uid}`;

  const prefersReduced = useReducedMotion();
  const wrapRef        = useRef(null);

  /**
   * All drag/spring state lives in a single ref so we never cause re-renders
   * on every pointermove or RAF frame, and closures always see current values.
   */
  const drag = useRef({
    active:       false,   // pointer is currently down
    isDragged:    false,   // movement has exceeded DRAG_THRESHOLD
    anchorX:      0,       // logo center X at pointerdown (viewport coords)
    anchorY:      0,       // logo center Y at pointerdown
    pointerId:    null,
    releaseMag:   0,       // 0-1 stretch magnitude at moment of release
    releaseAngle: 0,       // radians — fixed for the entire spring playback
    springMag:    0,       // current spring scalar (can go negative = overshoot)
    springVel:    0,       // current spring velocity
    rafId:        null,
    lastTime:     0,
  });

  // ── Helpers (only use refs — no stale closures) ──

  /** Apply rotate-scale-rotate transform for a given mag + angleDeg */
  function setSpringTransform(absMag, angleDeg) {
    if (!wrapRef.current) return;
    const sf = 1 + absMag * MAX_ELONGATE;
    const sq = Math.max(MIN_SQUEEZE, 1 - absMag * (1 - MIN_SQUEEZE));
    wrapRef.current.style.transform =
      `rotate(${angleDeg}deg) scale(${sf}, ${sq}) rotate(${-angleDeg}deg)`;
  }

  function clearTransform() {
    if (wrapRef.current) wrapRef.current.style.transform = '';
  }

  /** RAF spring loop — drives the bounce-back after release */
  function runSpring(releaseMag, releaseAngle) {
    const d        = drag.current;
    const angleDeg = releaseAngle * (180 / Math.PI);

    d.springMag  = releaseMag;
    d.springVel  = -releaseMag * 4.2; // initial inward fling
    d.lastTime   = performance.now();

    function tick(now) {
      const dt = Math.min((now - d.lastTime) / 1000, 0.05); // cap dt at 50ms
      d.lastTime = now;

      // Underdamped spring: force = -k*x - c*v
      const force = -SPRING_STIFFNESS * d.springMag - SPRING_DAMPING * d.springVel;
      d.springVel += force * dt;
      d.springMag += d.springVel * dt;

      // Settle check — both small enough to stop
      if (Math.abs(d.springMag) < 0.003 && Math.abs(d.springVel) < 0.003) {
        clearTransform();
        d.rafId = null;
        return;
      }

      setSpringTransform(Math.abs(d.springMag), angleDeg);
      d.rafId = requestAnimationFrame(tick);
    }

    if (d.rafId) cancelAnimationFrame(d.rafId);
    d.rafId = requestAnimationFrame(tick);
  }

  // ── Pointer handlers ──

  const onPointerDown = useCallback((e) => {
    const d = drag.current;

    // Cancel any running spring from a previous drag
    if (d.rafId) {
      cancelAnimationFrame(d.rafId);
      d.rafId = null;
    }

    // Reset transform first so getBoundingClientRect() returns the natural size/pos
    clearTransform();

    const rect   = wrapRef.current.getBoundingClientRect();
    d.anchorX    = rect.left + rect.width  / 2;
    d.anchorY    = rect.top  + rect.height / 2;
    d.active     = true;
    d.isDragged  = false;
    d.releaseMag = 0;
    d.pointerId  = e.pointerId;

    // Capture so drag continues even if pointer leaves the element
    wrapRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    const dx   = e.clientX - d.anchorX;
    const dy   = e.clientY - d.anchorY;
    const dist = Math.hypot(dx, dy);

    if (dist > DRAG_THRESHOLD) d.isDragged = true;
    if (!d.isDragged) return;

    // Record for release, even if prefers-reduced-motion suppresses the visual
    const clampedDist = Math.min(dist, MAX_DRAG_PX);
    const mag         = clampedDist / MAX_DRAG_PX;
    const angle       = Math.atan2(dy, dx);

    d.releaseMag   = mag;
    d.releaseAngle = angle;

    if (prefersReduced) return; // no visual distortion

    const angleDeg = angle * (180 / Math.PI);
    const ux       = dx / dist;           // unit vector
    const uy       = dy / dist;
    const tx       = ux * clampedDist * TRANSLATE_FACTOR;
    const ty       = uy * clampedDist * TRANSLATE_FACTOR;
    const sf       = 1 + mag * MAX_ELONGATE;
    const sq       = Math.max(MIN_SQUEEZE, 1 - mag * (1 - MIN_SQUEEZE));

    if (wrapRef.current) {
      wrapRef.current.style.transform =
        `translate(${tx}px, ${ty}px) rotate(${angleDeg}deg) scale(${sf}, ${sq}) rotate(${-angleDeg}deg)`;
    }
  }, [prefersReduced]);

  const onPointerUp = useCallback((e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    wrapRef.current?.releasePointerCapture(e.pointerId);
    d.active = false;

    // Quick tap (no real drag) — just clear and let existing click fire
    if (!d.isDragged) {
      clearTransform();
      return;
    }

    const releaseMag   = d.releaseMag;
    const releaseAngle = d.releaseAngle;
    d.isDragged = false;

    // Play twang — not gated by prefers-reduced-motion (sound ≠ motion)
    playTwang(releaseMag);

    if (prefersReduced || releaseMag < 0.01) {
      clearTransform();
      return;
    }

    // Run the spring bounce-back animation
    runSpring(releaseMag, releaseAngle);
  }, [prefersReduced]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (drag.current.rafId) cancelAnimationFrame(drag.current.rafId);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        display:         'inline-flex',
        transformOrigin: 'center center',
        cursor:          'grab',
        touchAction:     'none', // prevent browser scroll interfering with drag
        userSelect:      'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Heartbeat pulse — completely unchanged from original */}
      <motion.svg
        viewBox="0 0 200 200"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Together Forever logo"
        initial={{ scale: 1 }}
        animate={prefersReduced ? {} : { scale: [1, 1, 1.08, 1, 1.05, 1] }}
        transition={{
          duration:    1.6,
          delay:       1.4,
          repeat:      Infinity,
          repeatDelay: 1.8,
          ease:        'easeInOut',
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
          fill="none" stroke={`url(#${gId2})`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          initial="hidden" animate="visible" custom={0} variants={drawPath}
        />

        {/* Front strand — weaves over the back */}
        <motion.path
          d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
          fill="none" stroke={`url(#${gId})`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
          initial="hidden" animate="visible" custom={1} variants={drawPath}
        />

        {/* Gloss highlights */}
        <motion.path d="M100,42 C108,26 126,18 148,20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" initial="hidden" animate="visible" custom={0} variants={gloss} />
        <motion.path d="M100,42 C92,26 74,18 52,20"   fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" initial="hidden" animate="visible" custom={1} variants={gloss} />
      </motion.svg>
    </div>
  );
}

export default MainLogo;

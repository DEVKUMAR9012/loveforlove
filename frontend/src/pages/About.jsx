import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { MainLogo } from '../components/MainLogo';
import {
  FaCamera,
  FaCalendarAlt,
  FaMicrophone,
  FaHeartbeat,
  FaLock,
  FaBan,
  FaGlobeAmericas,
  FaUserFriends,
  FaQuoteLeft,
  FaHeart,
  FaExpand,
  FaTimes,
} from 'react-icons/fa';

/* ------------------------------------------------------------------ */
/* Brand tokens — mirrors the live loveforlove home screen:            */
/* white canvas, rose→coral→gold heart gradient, deep maroon wordmark  */
/* ------------------------------------------------------------------ */
const ROSE = '#ee2a7b';
const CORAL = '#f26e4e';
const GOLD = '#f9ce34';
const MAROON = '#8b1c31';
const BRAND_GRADIENT = `linear-gradient(90deg, ${ROSE}, ${CORAL}, ${GOLD})`;

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const screenshots = [
  {
    url: '/ss/Screenshot 2026-07-23 234455.png',
    title: 'Live Location & Dark Map',
    description: 'Sleek Snapchat-style dark mode map with real-time movement, battery status, and distance tracking.',
    tag: 'Live Map',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233209.png',
    title: 'Memories & Photo Gallery',
    description: 'Preserve photo memories and special moments in a beautiful, private digital gallery.',
    tag: 'Memories',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233230.png',
    title: 'Mood Tracker & Check-ins',
    description: 'Track how your partner is feeling each day and get gentle insights into their emotional world.',
    tag: 'Moods',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233241.png',
    title: 'Voice Notes & Audio Messages',
    description: 'Leave heartwarming voice notes for your partner to wake up to and replay anytime.',
    tag: 'Voice Notes',
  },
];

const features = [
  {
    icon: FaCamera,
    title: 'Private snaps & gallery',
    body: 'Share your moments instantly. Send disappearing snaps or build a beautiful, shared media gallery that only the two of you can access.',
  },
  {
    icon: FaCalendarAlt,
    title: 'Shared calendar',
    body: "Never miss an important date. Track anniversaries, plan upcoming dates, and count down to the moments you're looking forward to.",
  },
  {
    icon: FaMicrophone,
    title: 'Voice notes',
    body: "Sometimes text isn't enough. Leave voice notes for your person to wake up to, and build a collection of memories you can replay anytime.",
  },
  {
    icon: FaHeartbeat,
    title: 'Moods & connection',
    body: "Keep in touch with how your partner is feeling. Track daily moods and get gentle insight into each other's emotional world.",
  },
];

const audiences = [
  {
    icon: FaGlobeAmericas,
    title: 'Long-distance couples',
    body: 'Close the distance with daily check-ins, shared moods, and a calendar counting down to your next visit.',
  },
  {
    icon: FaUserFriends,
    title: 'Best friends',
    body: 'Not every close bond is romantic. Keep a private space with your ride-or-die, wherever life takes you both.',
  },
  {
    icon: FaHeart,
    title: 'Family across the miles',
    body: 'Parents, siblings, or a partner abroad — voice notes and shared galleries keep everyday moments from getting lost.',
  },
];

const trustPoints = [
  { icon: FaLock, label: 'Private by default' },
  { icon: FaBan, label: 'No ads, ever' },
  { icon: FaHeart, label: 'Built for real connection' },
  { icon: FaGlobeAmericas, label: 'Works wherever you are' },
];

const testimonials = [
  {
    quote: "We're eleven time zones apart. loveforlove is the one place that actually feels like being in the same room.",
    name: 'Priya & Dev',
  },
  {
    quote: 'I use it with my best friend, not a partner. Nobody else makes space for that, and honestly it works perfectly.',
    name: 'Ananya',
  },
  {
    quote: 'The voice notes feature alone changed how we say good morning to each other. Small thing, huge difference.',
    name: 'Rohit & Meera',
  },
];

/* ------------------------------------------------------------------ */
/* Ambient background: soft drifting brand-colour wash + tiny sparkles */
/* Kept deliberately quiet — the real site's canvas is clean white.    */
/* ------------------------------------------------------------------ */

const Sparkle = ({ delay, duration, left, size }) => (
  <motion.span
    aria-hidden="true"
    initial={{ y: '105vh', opacity: 0 }}
    animate={{ y: '-5vh', opacity: [0, 0.55, 0.55, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute',
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${GOLD}cc 0%, ${ROSE}88 55%, transparent 75%)`,
      pointerEvents: 'none',
    }}
  />
);

const AmbientField = () => {
  const shouldReduceMotion = useReducedMotion();

  const sparkles = React.useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${(i * 41) % 100}%`,
        size: 3 + ((i * 11) % 4),
        duration: 18 + ((i * 6) % 14),
        delay: (i % 8) * -2.1,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-white" />
      <motion.div
        animate={shouldReduceMotion ? {} : { x: [0, 30, 0], y: [0, 18, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full opacity-[0.14] blur-[110px]"
        style={{ background: `linear-gradient(135deg, ${ROSE}, ${GOLD})` }}
      />
      <motion.div
        animate={shouldReduceMotion ? {} : { x: [0, -22, 0], y: [0, -14, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[30%] -left-28 w-[26rem] h-[26rem] rounded-full opacity-[0.10] blur-[110px]"
        style={{ background: `linear-gradient(135deg, ${CORAL}, ${ROSE})` }}
      />
      <motion.div
        animate={shouldReduceMotion ? {} : { x: [0, 18, 0], y: [0, 22, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-[18%] w-[24rem] h-[24rem] rounded-full opacity-[0.10] blur-[100px]"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
      />
      {!shouldReduceMotion && sparkles.map((s) => <Sparkle key={s.id} {...s} />)}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Signature element: scroll-drawn ribbon thread (echoes the woven     */
/* heart-ribbon logo) — draws itself down the spine as you scroll.     */
/* ------------------------------------------------------------------ */

const NODE_COUNT = 6;

const ThreadLine = ({ containerRef, setActiveNode }) => {
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 });
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0.55, 1, 1, 0.55]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(NODE_COUNT - 1, Math.floor(v * NODE_COUNT));
    setActiveNode(idx);
  });

  const d =
    'M 50 0 C 20 80, 80 140, 50 220 S 20 380, 50 460 S 80 620, 50 700 S 20 860, 50 940 S 80 1100, 50 1180 S 20 1340, 50 1420 S 80 1560, 50 1650';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 hidden md:block"
      style={{ width: 100, height: '100%', zIndex: 1 }}
    >
      <svg
        viewBox="0 0 100 1650"
        preserveAspectRatio="none"
        width="100"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="threadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="45%" stopColor={ROSE} />
            <stop offset="100%" stopColor={CORAL} />
          </linearGradient>
          <filter id="threadShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor={ROSE} floodOpacity="0.3" />
          </filter>
        </defs>

        <path d={d} fill="none" stroke="rgba(139,28,49,0.10)" strokeWidth="1.5" />
        <motion.path
          d={d}
          fill="none"
          stroke="url(#threadGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#threadShadow)"
          style={{ pathLength, opacity: glowOpacity }}
        />
      </svg>
    </div>
  );
};

const ThreadNode = ({ index, activeNode, label }) => {
  const isActive = index <= activeNode;
  const isCurrent = index === activeNode;
  return (
    <div aria-hidden="true" className="relative mx-auto hidden md:flex flex-col items-center" style={{ width: 20, height: 20 }}>
      <motion.span
        animate={
          isCurrent
            ? { scale: [1, 1.6, 1], boxShadow: ['0 0 0px rgba(238,42,123,0)', '0 0 16px rgba(238,42,123,0.5)', '0 0 0px rgba(238,42,123,0)'] }
            : { scale: 1 }
        }
        transition={isCurrent ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isActive ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : '#ece4e6',
          display: 'block',
        }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 mt-4 whitespace-nowrap text-[9px] tracking-[0.25em] uppercase font-mono"
        style={{ color: isActive ? ROSE : '#cdc0c4', top: 10 }}
      >
        {label}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Reveal wrapper                                                      */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] },
  }),
};

const Reveal = ({ children, className = '', custom = 0, viewport = { once: true, amount: 0.25 } }) => (
  <motion.div initial="hidden" whileInView="show" viewport={viewport} custom={custom} variants={fadeUp} className={className}>
    {children}
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Moving photo wall — continuous marquee rows, opposite directions.   */
/* This is the "photos move" element from the reference clip.         */
/* ------------------------------------------------------------------ */

const clampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const MarqueeRow = ({ items, direction, duration, onSelect }) => {
  const track = [...items, ...items, ...items];
  return (
    <div className="lfl-marquee-row relative overflow-hidden">
      <div
        className="lfl-marquee-track flex gap-5 w-max"
        style={{ animationName: direction === 'left' ? 'lflMarqueeLeft' : 'lflMarqueeRight', animationDuration: `${duration}s` }}
      >
        {track.map((ss, i) => (
          <button
            type="button"
            key={`${ss.title}-${i}`}
            onClick={() => onSelect(ss)}
            className="lfl-marquee-card shrink-0 w-64 sm:w-72 md:w-80 text-left rounded-2xl overflow-hidden bg-white border transition-shadow duration-300"
            style={{
              borderColor: 'rgba(238,42,123,0.12)',
              boxShadow: '0 8px 26px rgba(139,28,49,0.08)',
              animationDelay: `${(i % 6) * 0.45}s`,
            }}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
              <img src={ss.url} alt={ss.title} className="w-full h-full object-cover object-top" draggable="false" />
              <span
                className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full font-mono tracking-wide border"
                style={{ color: ROSE, borderColor: 'rgba(238,42,123,0.25)' }}
              >
                {ss.tag}
              </span>
              <span
                className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
                style={{ color: ROSE }}
              >
                <FaExpand className="text-[10px]" />
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-sm mb-1" style={{ color: MAROON }}>
                {ss.title}
              </h4>
              <p className="text-xs text-gray-500" style={clampStyle}>
                {ss.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const About = () => {
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  const [activeNode, setActiveNode] = useState(0);
  const containerRef = useRef(null);

  const { scrollYProgress: heroProgress } = useScroll();
  const blobY = useTransform(heroProgress, [0, 0.2], [0, 100]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setActiveScreenshot(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen font-sans text-gray-800 overflow-hidden bg-white">
      <style>{`
        @keyframes lflMarqueeLeft { from { transform: translateX(0); } to { transform: translateX(-33.3333%); } }
        @keyframes lflMarqueeRight { from { transform: translateX(-33.3333%); } to { transform: translateX(0); } }
        @keyframes lflBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .lfl-marquee-track { animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform; }
        .lfl-marquee-row:hover .lfl-marquee-track { animation-play-state: paused; }
        .lfl-marquee-card { animation: lflBob 5s ease-in-out infinite; }
        .lfl-marquee-card:hover { box-shadow: 0 14px 40px rgba(238,42,123,0.22) !important; transform: translateY(-4px); }
        .lfl-marquee-row { -webkit-mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent); mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent); }
        @media (prefers-reduced-motion: reduce) {
          .lfl-marquee-track { animation: none !important; }
          .lfl-marquee-card { animation: none !important; }
        }
      `}</style>

      <AmbientField />
      <ThreadLine containerRef={containerRef} setActiveNode={setActiveNode} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto w-full">
        <Link to="/login" className="flex items-center gap-2">
          <MainLogo className="w-9 h-9 md:w-10 md:h-10" />
          <span className="font-bold text-xl md:text-2xl tracking-tight" style={{ color: MAROON }}>
            loveforlove
          </span>
        </Link>
        <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-[#ee2a7b] transition-colors">
          Back to home
        </Link>
      </nav>

      {/* ============================ HERO ============================ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 md:pt-20 pb-16 text-center">
        <motion.div
          style={{ y: blobY }}
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-16 w-[26rem] h-[26rem] rounded-full opacity-[0.16] blur-[100px]"
        >
          <div className="w-full h-full rounded-full" style={{ background: `linear-gradient(135deg, ${ROSE}, ${GOLD})` }} />
        </motion.div>
        <motion.div
          style={{ y: blobY }}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 w-[24rem] h-[24rem] rounded-full opacity-[0.12] blur-[100px]"
        >
          <div className="w-full h-full rounded-full" style={{ background: `linear-gradient(135deg, ${CORAL}, ${ROSE})` }} />
        </motion.div>

        <Reveal>
          <span className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold tracking-[0.3em] uppercase mb-6" style={{ color: ROSE }}>
            <span className="w-6 h-px" style={{ background: `${ROSE}80` }} /> our story
            <span className="w-6 h-px" style={{ background: `${ROSE}80` }} />
          </span>
        </Reveal>

        <Reveal custom={1}>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05]">
            <span style={{ color: MAROON }}>A private world,</span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: BRAND_GRADIENT }}>
              built for two.
            </span>
          </h1>
        </Reveal>

        <Reveal custom={2}>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            A secure, ad-free private space for two people to stay connected, share live locations, track moods, and
            save everlasting memories together.
          </p>
        </Reveal>

        <Reveal custom={3} className="mt-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex flex-col items-center gap-2 text-gray-400"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase">scroll</span>
            <span className="block w-px h-8" style={{ background: `linear-gradient(180deg, ${ROSE}, transparent)` }} />
          </motion.div>
        </Reveal>
      </section>

      <div className="relative z-10 -mt-2 mb-2">
        <ThreadNode index={0} activeNode={activeNode} label="story" />
      </div>

      {/* ===================== MOVING PHOTO WALL ======================= */}
      <section className="relative z-10 max-w-6xl mx-auto py-20 overflow-hidden">
        <Reveal className="text-center mb-12 px-6">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold tracking-[0.3em] uppercase mb-3" style={{ color: ROSE }}>
            <span className="w-6 h-px" style={{ background: `${ROSE}80` }} /> inside the app
            <span className="w-6 h-px" style={{ background: `${ROSE}80` }} />
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: MAROON }}>
            See loveforlove in action
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto mt-3 text-sm">
            A living wall of moments — tap any card to see it up close.
          </p>
        </Reveal>

        <div className="space-y-6">
          <MarqueeRow items={screenshots} direction="left" duration={36} onSelect={setActiveScreenshot} />
          <MarqueeRow items={[...screenshots].reverse()} direction="right" duration={42} onSelect={setActiveScreenshot} />
        </div>
      </section>

      {/* Lightbox — kept dark so the app's own dark-mode screens pop, like a gallery frame */}
      <AnimatePresence>
        {activeScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveScreenshot(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#160b1b', border: '1px solid rgba(238,42,123,0.25)' }}
            >
              <button
                type="button"
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                title="Close"
              >
                <FaTimes />
              </button>
              <div className="max-h-[75vh] overflow-y-auto bg-black flex items-center justify-center">
                <img src={activeScreenshot.url} alt={activeScreenshot.title} className="w-full h-auto object-contain max-h-[75vh]" />
              </div>
              <div className="p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider block mb-1" style={{ color: GOLD }}>
                    {activeScreenshot.tag}
                  </span>
                  <h3 className="text-2xl font-bold">{activeScreenshot.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{activeScreenshot.description}</p>
                </div>
                <Link to="/login" className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shrink-0" style={{ background: BRAND_GRADIENT }}>
                  Try it now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mb-2">
        <ThreadNode index={1} activeNode={activeNode} label="features" />
      </div>

      {/* ============================ FEATURES ========================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: MAROON }}>
            Everything that keeps you close
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} custom={i}>
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full p-6 rounded-2xl bg-white transition-shadow duration-300"
                style={{ border: '1px solid rgba(238,42,123,0.12)', boxShadow: '0 4px 20px rgba(139,28,49,0.06)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${ROSE}22, ${GOLD}2a)` }}
                >
                  <Icon className="text-lg" style={{ color: ROSE }} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: MAROON }}>
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="relative z-10 mb-2">
        <ThreadNode index={2} activeNode={activeNode} label="who it's for" />
      </div>

      {/* ============================ AUDIENCES ========================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight" style={{ color: MAROON }}>
            Not just for couples
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            loveforlove is really about the space between two people who matter to each other. That's a partner for
            most people, but it doesn't have to be.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} custom={i}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl text-left h-full bg-white"
                style={{ border: '1px solid rgba(238,42,123,0.12)', boxShadow: '0 4px 20px rgba(139,28,49,0.06)' }}
              >
                <Icon className="text-2xl mb-4" style={{ color: ROSE }} aria-hidden="true" />
                <h3 className="text-lg font-bold mb-2" style={{ color: MAROON }}>
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-10 py-10" style={{ background: '#FFF8F6', borderTop: '1px solid rgba(238,42,123,0.10)', borderBottom: '1px solid rgba(238,42,123,0.10)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustPoints.map(({ icon: Icon, label }, i) => (
            <Reveal key={label} custom={i} className="flex items-center gap-3 justify-center md:justify-start">
              <Icon className="text-lg shrink-0" style={{ color: ROSE }} aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="relative z-10 mt-2 mb-2">
        <ThreadNode index={3} activeNode={activeNode} label="voices" />
      </div>

      {/* ============================ TESTIMONIALS ====================== */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: MAROON }}>
            People who've found their space
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name }, i) => (
            <Reveal key={name} custom={i}>
              <motion.figure
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl h-full bg-white"
                style={{ border: '1px solid rgba(249,206,52,0.20)', boxShadow: '0 4px 20px rgba(139,28,49,0.06)' }}
              >
                <FaQuoteLeft className="text-xl mb-4" style={{ color: GOLD }} aria-hidden="true" />
                <blockquote className="text-gray-700 leading-relaxed mb-4 text-sm">{quote}</blockquote>
                <figcaption className="text-sm font-bold" style={{ color: ROSE }}>
                  {name}
                </figcaption>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="relative z-10 mt-2 mb-2">
        <ThreadNode index={4} activeNode={activeNode} label="begin" />
      </div>

      {/* ============================ FINAL CTA ========================= */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-28 text-center overflow-hidden">
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.3, 0.18] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full blur-[110px]"
          style={{ background: `radial-gradient(circle, ${ROSE}55, ${GOLD}30, transparent 70%)` }}
        />
        <Reveal>
          <p className="text-gray-500 font-medium mb-6 font-mono text-sm tracking-wide">Ready to start your journey?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="px-10 py-4 rounded-full text-white font-bold text-xl shadow-xl inline-block"
                style={{ background: BRAND_GRADIENT, boxShadow: '0 12px 34px rgba(238,42,123,0.35)' }}
              >
                Sign up now
              </Link>
            </motion.div>
            <Link to="/login" className="text-gray-500 hover:text-[#ee2a7b] font-semibold underline underline-offset-4 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8" style={{ borderTop: '1px solid rgba(238,42,123,0.10)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MainLogo className="w-6 h-6" />
            <span className="font-bold tracking-tight" style={{ color: MAROON }}>
              loveforlove
            </span>
          </div>
          <p className="text-sm text-gray-400 font-mono">Your connection, everlasting.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
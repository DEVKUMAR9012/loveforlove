import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
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
/* Ambient background: drifting embers + nebula wash                   */
/* ------------------------------------------------------------------ */

const Ember = ({ delay, duration, left, size }) => (
  <motion.span
    aria-hidden="true"
    initial={{ y: '110vh', opacity: 0 }}
    animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute',
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(249,206,52,0.9) 0%, rgba(238,42,123,0.5) 55%, transparent 75%)',
      filter: 'blur(0.5px)',
      pointerEvents: 'none',
    }}
  />
);

const AmbientField = () => {
  const embers = React.useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        size: 2 + ((i * 13) % 5),
        duration: 14 + ((i * 7) % 16),
        delay: (i % 10) * -1.6,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 15% 0%, rgba(238,42,123,0.16), transparent 60%), radial-gradient(ellipse 70% 55% at 90% 30%, rgba(249,206,52,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 30% 90%, rgba(242,110,78,0.12), transparent 60%), #0a0510',
        }}
      />
      {embers.map((e) => (
        <Ember key={e.id} delay={e.delay} duration={e.duration} left={e.left} size={e.size} />
      ))}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Signature element: scroll-drawn heartbeat / orbit thread            */
/* ------------------------------------------------------------------ */

const NODE_COUNT = 6; // hero, screenshots, features, audiences, testimonials, cta

const ThreadLine = ({ containerRef, activeNode, setActiveNode }) => {
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const pathLength = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 });
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0.35, 1, 1, 0.35]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(NODE_COUNT - 1, Math.floor(v * NODE_COUNT));
    setActiveNode(idx);
  });

  // A gentle sine wave path down the spine, taller viewBox scales with content via preserveAspectRatio="none"
  const d =
    'M 50 0 C 20 80, 80 140, 50 220 S 20 380, 50 460 S 80 620, 50 700 S 20 860, 50 940 S 80 1100, 50 1180 S 20 1340, 50 1420 S 80 1560, 50 1650';

  const nodeYs = [10, 235, 470, 705, 940, 1175, 1420, 1640];

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
            <stop offset="0%" stopColor="#f9ce34" />
            <stop offset="45%" stopColor="#ee2a7b" />
            <stop offset="100%" stopColor="#f26e4e" />
          </linearGradient>
          <filter id="threadBlur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* faint static track */}
        <path d={d} fill="none" stroke="rgba(238,42,123,0.12)" strokeWidth="1.5" />

        {/* animated drawn thread */}
        <motion.path
          d={d}
          fill="none"
          stroke="url(#threadGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#threadBlur)"
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
    <div
      aria-hidden="true"
      className="relative mx-auto hidden md:flex flex-col items-center"
      style={{ width: 20, height: 20 }}
    >
      <motion.span
        animate={
          isCurrent
            ? { scale: [1, 1.6, 1], boxShadow: ['0 0 0px rgba(238,42,123,0)', '0 0 22px rgba(238,42,123,0.9)', '0 0 0px rgba(238,42,123,0)'] }
            : { scale: 1 }
        }
        transition={isCurrent ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isActive ? 'linear-gradient(135deg,#f9ce34,#ee2a7b)' : 'rgba(255,255,255,0.15)',
          display: 'block',
        }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 mt-4 whitespace-nowrap text-[9px] tracking-[0.25em] uppercase font-mono"
        style={{ color: isActive ? '#f9ce34' : 'rgba(255,255,255,0.25)', top: 10 }}
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
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const About = () => {
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  const [activeNode, setActiveNode] = useState(0);
  const containerRef = useRef(null);

  // subtle parallax for hero glow blobs
  const { scrollYProgress: heroProgress } = useScroll();
  const blobY = useTransform(heroProgress, [0, 0.2], [0, 120]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setActiveScreenshot(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen font-sans text-[#f3e9f5] overflow-hidden"
      style={{ background: '#0a0510' }}
    >
      <AmbientField />
      <ThreadLine containerRef={containerRef} activeNode={activeNode} setActiveNode={setActiveNode} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto w-full">
        <Link to="/login" className="flex items-center gap-2 group">
          <MainLogo className="w-9 h-9 md:w-10 md:h-10" />
          <span
            className="font-bold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg,#f9ce34,#ee2a7b)' }}
          >
            loveforlove
          </span>
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-[#c9a6d4] hover:text-[#f9ce34] transition-colors tracking-wide"
        >
          Back to home
        </Link>
      </nav>

      {/* ============================ HERO ============================ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 md:pt-20 pb-20 text-center">
        <motion.div style={{ y: blobY }} aria-hidden="true" className="pointer-events-none absolute -top-32 -right-20 w-[28rem] h-[28rem] rounded-full opacity-30 blur-[100px]" >
          <div className="w-full h-full rounded-full" style={{ background: 'linear-gradient(135deg,#ee2a7b,#f9ce34)' }} />
        </motion.div>
        <motion.div style={{ y: blobY }} aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 w-[26rem] h-[26rem] rounded-full opacity-20 blur-[100px]">
          <div className="w-full h-full rounded-full" style={{ background: 'linear-gradient(135deg,#f26e4e,#ee2a7b)' }} />
        </motion.div>

        <Reveal>
          <span className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold tracking-[0.3em] uppercase text-[#f9ce34]/90 mb-6">
            <span className="w-6 h-px bg-[#f9ce34]/60" /> our story <span className="w-6 h-px bg-[#f9ce34]/60" />
          </span>
        </Reveal>

        <Reveal custom={1}>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05]">
            <span className="text-[#f3e9f5]">A private world,</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg,#f9ce34,#ee2a7b,#f26e4e)' }}
            >
              built for two.
            </span>
          </h1>
        </Reveal>

        <Reveal custom={2}>
          <p className="text-lg md:text-xl text-[#c9a6d4] leading-relaxed max-w-2xl mx-auto">
            A secure, ad-free private space for two people to stay connected, share live locations, track moods, and
            save everlasting memories together.
          </p>
        </Reveal>

        <Reveal custom={3} className="mt-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex flex-col items-center gap-2 text-[#c9a6d4]/60"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase">scroll</span>
            <span className="block w-px h-8 bg-gradient-to-b from-[#ee2a7b] to-transparent" />
          </motion.div>
        </Reveal>
      </section>

      {/* thread node marker */}
      <div className="relative z-10 -mt-2 mb-2">
        <ThreadNode index={0} activeNode={activeNode} label="story" />
      </div>

      {/* ===================== SCREENSHOTS SHOWCASE ==================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <Reveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold tracking-[0.3em] uppercase text-[#f9ce34]/90 mb-3">
            <span className="w-6 h-px bg-[#f9ce34]/60" /> inside the app <span className="w-6 h-px bg-[#f9ce34]/60" />
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f3e9f5]">
            See loveforlove in action
          </h2>
          <p className="text-[#c9a6d4] max-w-lg mx-auto mt-3 text-sm">
            A sneak peek of the interface, live location map, and memory vault crafted for you.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8">
          {screenshots.map((ss, i) => (
            <Reveal key={ss.title} custom={i} className={i % 2 === 1 ? 'md:mt-10' : ''}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                onClick={() => setActiveScreenshot(ss)}
                className="group cursor-pointer rounded-3xl p-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(238,42,123,0.06), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(238,42,123,0.18)',
                }}
              >
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(238,42,123,0.25), inset 0 0 0 1px rgba(249,206,52,0.25)' }} />
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black/40 shadow-inner">
                  <img
                    src={ss.url}
                    alt={ss.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6 gap-2 text-white font-medium text-sm">
                    <FaExpand className="text-base" />
                    <span>Click to expand</span>
                  </div>
                  <span
                    className="absolute top-3 left-3 backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full border font-mono tracking-wide"
                    style={{ background: 'rgba(10,5,16,0.7)', borderColor: 'rgba(249,206,52,0.4)', color: '#f9ce34' }}
                  >
                    {ss.tag}
                  </span>
                </div>
                <div className="pt-4 px-2 pb-2">
                  <h3 className="text-xl font-bold mb-1 text-[#f3e9f5] group-hover:text-[#f9ce34] transition-colors">
                    {ss.title}
                  </h3>
                  <p className="text-sm text-[#c9a6d4] leading-relaxed">{ss.description}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {activeScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveScreenshot(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#120a18', border: '1px solid rgba(238,42,123,0.25)' }}
            >
              <button
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                title="Close"
              >
                <FaTimes />
              </button>
              <div className="max-h-[75vh] overflow-y-auto bg-black flex items-center justify-center">
                <img
                  src={activeScreenshot.url}
                  alt={activeScreenshot.title}
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              </div>
              <div className="p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#f9ce34] block mb-1">
                    {activeScreenshot.tag}
                  </span>
                  <h3 className="text-2xl font-bold">{activeScreenshot.title}</h3>
                  <p className="text-sm text-[#c9a6d4] mt-1">{activeScreenshot.description}</p>
                </div>
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shrink-0"
                  style={{ background: 'linear-gradient(90deg,#ee2a7b,#f9ce34)' }}
                >
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
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f3e9f5]">
            Everything that keeps you close
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} custom={i}>
              <motion.div
                whileHover={{ y: -4, borderColor: 'rgba(249,206,52,0.5)' }}
                className="h-full p-6 rounded-2xl relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,42,123,0.15)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(238,42,123,0.25), rgba(249,206,52,0.2))' }}
                >
                  <Icon className="text-lg text-[#f9ce34]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[#f3e9f5]">{title}</h3>
                <p className="text-sm text-[#c9a6d4] leading-relaxed">{body}</p>
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
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-[#f3e9f5]">
            Not just for couples
          </h2>
          <p className="text-[#c9a6d4] max-w-xl mx-auto">
            loveforlove is really about the space between two people who matter to each other. That's a partner for
            most people, but it doesn't have to be.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} custom={i}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl text-left h-full"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,42,123,0.15)' }}
              >
                <Icon className="text-2xl text-[#ee2a7b] mb-4" aria-hidden="true" />
                <h3 className="text-lg font-bold mb-2 text-[#f3e9f5]">{title}</h3>
                <p className="text-sm text-[#c9a6d4] leading-relaxed">{body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-10 py-10" style={{ borderTop: '1px solid rgba(238,42,123,0.12)', borderBottom: '1px solid rgba(238,42,123,0.12)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustPoints.map(({ icon: Icon, label }, i) => (
            <Reveal key={label} custom={i} className="flex items-center gap-3 justify-center md:justify-start">
              <Icon className="text-[#f9ce34] text-lg shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#f3e9f5]/90">{label}</span>
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
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f3e9f5]">
            People who've found their space
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name }, i) => (
            <Reveal key={name} custom={i}>
              <motion.figure
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl h-full"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,206,52,0.15)' }}
              >
                <FaQuoteLeft className="text-[#f9ce34] text-xl mb-4" aria-hidden="true" />
                <blockquote className="text-[#e4d3e8] leading-relaxed mb-4 text-sm">{quote}</blockquote>
                <figcaption className="text-sm font-bold text-[#f9ce34]">{name}</figcaption>
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
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(238,42,123,0.4), rgba(249,206,52,0.15), transparent 70%)' }}
        />
        <Reveal>
          <p className="text-[#c9a6d4] font-medium mb-6 font-mono text-sm tracking-wide">Ready to start your journey?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="px-10 py-4 rounded-full text-white font-bold text-xl shadow-2xl inline-block"
                style={{ background: 'linear-gradient(90deg,#ee2a7b,#f26e4e,#f9ce34)', boxShadow: '0 0 40px rgba(238,42,123,0.4)' }}
              >
                Sign up now
              </Link>
            </motion.div>
            <Link to="/login" className="text-[#c9a6d4] hover:text-[#f9ce34] font-semibold underline underline-offset-4 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8" style={{ borderTop: '1px solid rgba(238,42,123,0.12)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MainLogo className="w-6 h-6" />
            <span className="font-bold tracking-tight text-[#f3e9f5]">loveforlove</span>
          </div>
          <p className="text-sm text-[#c9a6d4]/60 font-mono">Your connection, everlasting.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
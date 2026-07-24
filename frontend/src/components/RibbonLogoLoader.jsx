// vibecheck-disable SECAI006
import { useId } from 'react';
import { motion } from 'framer-motion';

export function RibbonLogo({ className = 'w-32 h-32', showText = true, textSub = "A Private World, Built for Two" }) {
  const uid = useId();
  const gId1 = `ribbon-g1-${uid}`;
  const gId2 = `ribbon-g2-${uid}`;
  const glowId = `ribbon-glow-${uid}`;

  // Smooth ribbon path variants
  const ribbonDraw1 = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: [0.65, 0, 0.35, 1] },
        opacity: { duration: 0.4 },
      },
    },
  };

  const ribbonDraw2 = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, delay: 0.3, ease: [0.65, 0, 0.35, 1] },
        opacity: { duration: 0.4, delay: 0.3 },
      },
    },
  };

  const ribbonGloss = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.6,
      transition: { duration: 1.1, delay: 0.8, ease: 'easeOut' },
    },
  };

  const particleVariants = {
    animate: (i) => ({
      y: [-5, -25, -5],
      x: [0, (i % 2 === 0 ? 15 : -15), 0],
      opacity: [0, 0.8, 0],
      scale: [0.5, 1.2, 0.3],
      transition: {
        duration: 2.2 + (i * 0.4),
        repeat: Infinity,
        delay: i * 0.3,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Glow background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/30 via-rose-400/20 to-amber-300/30 blur-2xl"
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating Sparkle Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={particleVariants}
            animate="animate"
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-pink-300 to-amber-200 blur-[0.5px]"
            style={{
              top: `${20 + (i * 12)}%`,
              left: `${15 + (i * 14)}%`,
            }}
          />
        ))}

        {/* SVG Ribbon Woven Heart Logo */}
        <motion.svg
          viewBox="0 0 200 200"
          className={`${className} drop-shadow-xl relative z-10`}
          xmlns="http://www.w3.org/2000/svg"
          initial={{ scale: 0.85, rotate: -6, opacity: 0 }}
          animate={{ scale: [0.85, 1.04, 1], rotate: [-6, 2, 0], opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <defs>
            {/* Satin Silk Ribbon Gradient 1 */}
            <linearGradient id={gId1} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2a70" />
              <stop offset="45%" stopColor="#ff5e62" />
              <stop offset="80%" stopColor="#ff9966" />
              <stop offset="100%" stopColor="#ffc371" />
            </linearGradient>

            {/* Satin Silk Ribbon Gradient 2 (Reverse weave) */}
            <linearGradient id={gId2} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e91e63" />
              <stop offset="50%" stopColor="#f44336" />
              <stop offset="100%" stopColor="#ff9800" />
            </linearGradient>

            {/* Ribbon Soft Shadow Filter */}
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#ee2a7b" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Ribbon Outer Wave Glow Trail */}
          <motion.path
            d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
            fill="none"
            stroke={`url(#${gId2})`}
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
            filter={`url(#${glowId})`}
            initial="hidden"
            animate="visible"
            variants={ribbonDraw1}
          />
          <motion.path
            d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
            fill="none"
            stroke={`url(#${gId1})`}
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
            filter={`url(#${glowId})`}
            initial="hidden"
            animate="visible"
            variants={ribbonDraw2}
          />

          {/* Back Ribbon Strand (Unrolling Silk Weave) */}
          <motion.path
            d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
            fill="none"
            stroke={`url(#${gId2})`}
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="hidden"
            animate="visible"
            variants={ribbonDraw1}
          />

          {/* Front Ribbon Strand (Weaves over back ribbon) */}
          <motion.path
            d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
            fill="none"
            stroke={`url(#${gId1})`}
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="hidden"
            animate="visible"
            variants={ribbonDraw2}
          />

          {/* Silky Gloss Shimmer Highlights along the ribbon fold */}
          <motion.path
            d="M100,42 C108,26 126,18 148,20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            initial="hidden"
            animate="visible"
            variants={ribbonGloss}
          />
          <motion.path
            d="M100,42 C92,26 74,18 52,20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            initial="hidden"
            animate="visible"
            variants={ribbonGloss}
          />
        </motion.svg>
      </div>

      {/* Brand Title & Subtitle Fade-in */}
      {showText && (
        <motion.div
          className="text-center mt-5 z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 font-sans">
            loveforlove
          </h1>

          {/* Animated Ribbon Flow Underline */}
          <div className="w-24 h-1 mx-auto my-2 rounded-full overflow-hidden bg-pink-100/60 relative">
            <motion.div
              className="absolute inset-y-0 w-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: ['-100%', '0%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {textSub && (
            <p className="text-xs font-medium text-rose-400/90 tracking-wider uppercase mt-1">
              {textSub}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function RibbonLogoLoader({ fullScreen = true, subText = "Unrolling your private space..." }) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50/95 via-white/95 to-amber-50/95 backdrop-blur-md"
    : "py-12 flex flex-col items-center justify-center";

  return (
    <div className={containerClasses}>
      <RibbonLogo className="w-28 h-28 md:w-36 md:h-36" textSub={subText} />
    </div>
  );
}

export default RibbonLogoLoader;

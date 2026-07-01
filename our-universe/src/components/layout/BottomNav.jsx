import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

// ─── Icons (Inline SVGs for pixel-perfect control) ───────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Timeline: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Gallery: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Letters: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4h16v3M4 7l8 5 8-5M4 7v13h16V7" />
    </svg>
  ),
  Goals: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

const navItems = [
  { path: '/dashboard', icon: 'Dashboard', label: 'Home' },
  { path: '/timeline', icon: 'Timeline', label: 'Timeline' },
  { path: '/gallery', icon: 'Gallery', label: 'Gallery' },
  { path: '/letters', icon: 'Letters', label: 'Letters' },
  { path: '/goals', icon: 'Goals', label: 'Goals' },
  { path: '/settings', icon: 'Settings', label: 'Settings' },
]

const BottomNav = () => {
  const location = useLocation()

  // Hide bottom nav on certain pages (like login, onboarding, or desktop view)
  // Actually, we'll control visibility with CSS: hidden on md+ screens.
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 md:hidden pointer-events-none">
      {/* The floating glass container */}
      <nav className="glass-strong mx-auto flex items-center justify-between px-2 py-3 rounded-full pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl max-w-sm">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = Icons[item.icon]

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-12 h-12"
              aria-label={item.label}
            >
              <div
                className={`relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-pink-400' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon />
              </div>

              {/* Active Indicator Glow/Dot */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-pink-500/20 rounded-full"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                </motion.div>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default BottomNav

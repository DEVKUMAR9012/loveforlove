// ─── Navbar ──────────────────────────────────────────────────────────────────
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { path: '/dashboard', label: 'Home',    icon: '🏠', activeIcon: '🌌' },
  { path: '/timeline',  label: 'Timeline', icon: '📅', activeIcon: '✨' },
  { path: '/gallery',   label: 'Gallery',  icon: '🖼️', activeIcon: '💫' },
  { path: '/letters',   label: 'Letters',  icon: '💌', activeIcon: '💌' },
  { path: '/voice',     label: 'Voice',    icon: '🎙️', activeIcon: '🎵' },
  { path: '/goals',     label: 'Goals',    icon: '🌠', activeIcon: '⭐' },
]

// ─── Bottom Mobile Nav ───────────────────────────────────────────────────────
const BottomNav = () => {
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
      aria-label="Main navigation"
    >
      <div className="mx-3 mb-3 glass-strong rounded-3xl px-2 py-2">
        <ul className="flex items-center justify-around" role="list">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl relative"
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-bubble"
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(79,172,254,0.2))' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <motion.span
                    className="relative text-xl"
                    animate={{ scale: isActive ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {isActive ? item.activeIcon : item.icon}
                  </motion.span>
                  <span className={`relative text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-pink-400' : 'text-white/40'
                  }`}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

// ─── Desktop Sidebar ─────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation()

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-50 p-4 gap-2"
      aria-label="Sidebar navigation"
    >
      <div className="glass-strong rounded-3xl p-4 flex flex-col gap-6 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
               style={{ background: 'linear-gradient(135deg, #FF6B9D, #4FACFE)' }}>
            🌌
          </div>
          <span className="font-bold text-lg gradient-text">Our Universe</span>
        </div>

        <div className="divider-gradient" />

        {/* Nav Items */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all relative overflow-hidden
                      ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-bubble"
                        className="absolute inset-0 rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.25), rgba(79,172,254,0.25))' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative text-xl">{isActive ? item.activeIcon : item.icon}</span>
                    <span className="relative">{item.label}</span>
                    {isActive && (
                      <span className="relative ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-glow-pink" />
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/20 text-xs">Made with 💖</p>
        </div>
      </div>
    </aside>
  )
}

const Navbar = () => (
  <>
    <BottomNav />
    <Sidebar />
  </>
)

export default Navbar

// ─── App Shell ───────────────────────────────────────────────────────────────
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import FloatingOrbs from './FloatingOrbs'

const AppShell = () => {
  const location = useLocation()

  return (
    <div className="page-container">
      <FloatingOrbs />
      <Navbar />

      <main className="content-with-nav relative z-10 min-h-dvh">
        <AnimatePresence mode="wait" initial={false}>
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default AppShell

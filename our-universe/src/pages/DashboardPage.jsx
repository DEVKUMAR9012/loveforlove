import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import useAuthStore from '../store/authStore'
import MemoryModal from '../components/features/MemoryModal'

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const DashboardPage = () => {
  const profile = useAuthStore(s => s.profile)
  const navigate = useNavigate()
  const [greeting, setGreeting] = useState('Welcome back')
  const [daysTogether, setDaysTogether] = useState(0)
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false)

  // Calculate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Mock anniversary date calculation (Assuming they met on Jan 1, 2024 for demo)
    const startDate = new Date('2024-01-01').getTime()
    const now = new Date().getTime()
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
    setDaysTogether(diffDays)
  }, [])

  return (
    <PageTransition>
      <div className="content-with-nav px-4 pt-10 md:pt-12 max-w-5xl mx-auto space-y-8">
        
        {/* ─── Header: Greeting ────────────────────────────────────────────── */}
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl font-bold gradient-text">
              {profile?.displayName || 'Stargazer'} ✨
            </h1>
          </div>
          <div className="avatar avatar-md avatar-ring bg-glass">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">💖</span>
            )}
          </div>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* ─── Anniversary Counter Hero ──────────────────────────────────── */}
          <motion.div variants={itemVariants} className="relative">
            <div className="glass-pink p-8 rounded-[2rem] overflow-hidden text-center hover-lift">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-primary opacity-10 pointer-events-none" />
              <div className="orb orb-pink -top-10 -left-10 w-40 h-40" />
              <div className="orb orb-blue -bottom-10 -right-10 w-40 h-40" />
              
              <div className="relative z-10">
                <p className="overline text-pink-300 mb-2">Our Journey</p>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="display-1 gradient-text">{daysTogether}</span>
                  <span className="text-xl font-medium text-white/60">days</span>
                </div>
                <p className="body-sm">Since our universes collided 🌌</p>
              </div>
            </div>
          </motion.div>

          {/* ─── Quick Navigation Cards ────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="heading-4">Create Magic</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <button 
                onClick={() => setIsMemoryModalOpen(true)}
                className="glass p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover-lift text-center w-full"
              >
                <span className="text-3xl mb-1 animate-bounce-soft">📸</span>
                <span className="text-xs font-semibold text-white/80">Memory</span>
              </button>
              <Link to="/letters" className="glass p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover-lift text-center">
                <span className="text-3xl mb-1 hover:animate-heart-beat">💌</span>
                <span className="text-xs font-semibold text-white/80">Letter</span>
              </Link>
              <Link to="/voice" className="glass p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover-lift text-center">
                <span className="text-3xl mb-1">🎤</span>
                <span className="text-xs font-semibold text-white/80">Voice</span>
              </Link>
            </div>
          </motion.div>

          {/* ─── Latest Memories (Horizontal Scroll) ───────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="heading-4">Latest Memories</h2>
              <Link to="/timeline" className="text-xs font-medium text-pink-400 hover:text-pink-300">View All</Link>
            </div>
            
            {/* Mocked scroll container */}
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 snap-x">
              {[1, 2, 3].map((item) => (
                <div key={item} className="snap-center shrink-0 w-64 h-80 glass p-3 rounded-3xl flex flex-col relative group overflow-hidden hover-lift">
                  <div className="w-full h-48 rounded-2xl bg-white/5 mb-3 overflow-hidden relative">
                    {/* Placeholder image gradient */}
                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${item === 1 ? 'from-pink-500 to-purple-600' : item === 2 ? 'from-blue-400 to-cyan-500' : 'from-indigo-500 to-pink-500'}`} />
                    <span className="absolute top-2 right-2 badge-glass text-[10px] px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
                      {item === 1 ? 'Today' : item === 2 ? '2 days ago' : 'Last week'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 px-1">Memory Title {item}</h3>
                  <p className="text-xs text-white/50 line-clamp-2 px-1">This is a beautiful moment we shared together under the stars.</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Relationship Statistics ───────────────────────────────────── */}
          <motion.div variants={itemVariants} className="pb-10">
            <h2 className="heading-4 mb-4 px-2">Our Universe Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-pink-500/20" />
                <p className="text-2xl font-bold gradient-text mb-1">42</p>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Memories</p>
              </div>
              <div className="card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
                <p className="text-2xl font-bold text-sky-400 mb-1">12</p>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Letters Sent</p>
              </div>
              <div className="card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/20" />
                <p className="text-2xl font-bold text-purple-400 mb-1">5</p>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Voice Notes</p>
              </div>
              <div className="card p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
                <p className="text-2xl font-bold text-emerald-400 mb-1">8</p>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Goals Reached</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
      
      <MemoryModal 
        isOpen={isMemoryModalOpen} 
        onClose={() => setIsMemoryModalOpen(false)}
        onCreated={(id) => navigate('/timeline')}
      />
    </PageTransition>
  )
}

export default DashboardPage

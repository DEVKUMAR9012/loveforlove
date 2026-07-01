// ─── Join Universe Page (Stub) ───────────────────────────────────────────────
import { Link } from 'react-router-dom'
import FloatingOrbs from '../components/layout/FloatingOrbs'
import GlassCard from '../components/ui/GlassCard'
import GradientButton from '../components/ui/GradientButton'
import GradientText from '../components/ui/GradientText'
import { motion } from 'framer-motion'

const JoinUniversePage = () => (
  <div className="page-container min-h-dvh flex items-center justify-center p-4">
    <FloatingOrbs />
    <motion.div className="w-full max-w-sm relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GradientText as="h1" className="text-3xl font-bold text-center mb-6">💫 Join Your Partner</GradientText>
      <GlassCard strong className="p-7 text-center space-y-4" hover={false}>
        <p className="text-white/50">Invite-code joining coming in Phase 2.</p>
        <Link to="/login">
          <GradientButton variant="glass" fullWidth>← Back to Login</GradientButton>
        </Link>
      </GlassCard>
    </motion.div>
  </div>
)

export default JoinUniversePage

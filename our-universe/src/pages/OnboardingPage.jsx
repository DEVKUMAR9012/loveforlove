// ─── Onboarding Page (Stub) ──────────────────────────────────────────────────
import FloatingOrbs from '../components/layout/FloatingOrbs'
import GlassCard from '../components/ui/GlassCard'
import GradientText from '../components/ui/GradientText'
import { motion } from 'framer-motion'

const OnboardingPage = () => (
  <div className="page-container min-h-dvh flex items-center justify-center p-4">
    <FloatingOrbs />
    <motion.div className="w-full max-w-sm relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GradientText as="h1" className="text-3xl font-bold text-center mb-6">🌠 Set Up Your Universe</GradientText>
      <GlassCard strong className="p-7 text-center" hover={false}>
        <p className="text-white/50">Onboarding wizard coming in Phase 2.</p>
      </GlassCard>
    </motion.div>
  </div>
)

export default OnboardingPage

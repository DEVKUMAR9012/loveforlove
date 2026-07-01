// ─── 404 Not Found ────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingOrbs from '../components/layout/FloatingOrbs'
import GradientButton from '../components/ui/GradientButton'
import GradientText from '../components/ui/GradientText'

const NotFoundPage = () => (
  <div className="page-container min-h-dvh flex flex-col items-center justify-center p-8 text-center gap-6">
    <FloatingOrbs />
    <motion.div
      className="relative z-10 space-y-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-8xl"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🌌
      </motion.div>
      <GradientText as="h1" className="text-5xl font-bold">Lost in Space</GradientText>
      <p className="text-white/40 text-lg">This page drifted into another galaxy.</p>
      <Link to="/dashboard">
        <GradientButton size="lg">Take Me Home 🚀</GradientButton>
      </Link>
    </motion.div>
  </div>
)

export default NotFoundPage

// ─── Page Transition ─────────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)' },
}

const pageTransition = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1],
}

const PageTransition = ({ children, className = '' }) => (
  <motion.div
    className={`w-full ${className}`}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    {children}
  </motion.div>
)

export default PageTransition

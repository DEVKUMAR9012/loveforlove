// ─── Glass Card ──────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { forwardRef } from 'react'

/**
 * @param {object} props
 * @param {string}  [props.className]
 * @param {boolean} [props.hover=true]   - Enable hover lift effect
 * @param {boolean} [props.strong=false] - Use stronger glass variant
 * @param {boolean} [props.gradient]     - Wrap with gradient border
 * @param {object}  [props.animate]      - Framer motion animate props
 * @param {number}  [props.delay=0]      - Stagger delay
 */
const GlassCard = forwardRef(({
  children,
  className = '',
  hover = true,
  strong = false,
  gradient = false,
  delay = 0,
  animate,
  ...props
}, ref) => {
  const baseClass = strong ? 'glass-strong' : 'glass'

  return (
    <motion.div
      ref={ref}
      className={`${baseClass} ${gradient ? 'gradient-border' : ''} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, ...animate }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
})

GlassCard.displayName = 'GlassCard'

export default GlassCard

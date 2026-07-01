// ─── Gradient Text ───────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

/**
 * @param {object}  props
 * @param {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'p'|'span'} [props.as='h2']
 * @param {'pink-blue'|'pink-purple'|'blue-purple'} [props.gradient='pink-blue']
 * @param {boolean} [props.animate=false] - Animate gradient shift
 * @param {string}  [props.className]
 */
const GradientText = ({
  children,
  as: Tag = 'h2',
  gradient = 'pink-blue',
  animate = false,
  className = '',
  ...props
}) => {
  const gradients = {
    'pink-blue':   'from-pink-400 via-pink-300 to-sky-400',
    'pink-purple': 'from-pink-400 via-pink-500 to-purple-400',
    'blue-purple': 'from-sky-400 via-sky-300 to-purple-400',
    'white-pink':  'from-white via-pink-100 to-pink-300',
  }

  const MotionTag = motion[Tag] ?? motion.h2

  return (
    <MotionTag
      className={`
        bg-gradient-to-r ${gradients[gradient]}
        bg-clip-text text-transparent
        ${animate ? 'bg-[length:200%_auto] animate-gradient-shift' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {children}
    </MotionTag>
  )
}

export default GradientText

// ─── Floating Background Orbs ────────────────────────────────────────────────
import { motion } from 'framer-motion'

const orbs = [
  { size: 400, x: '-10%', y: '-10%', color: 'rgba(255,107,157,0.15)', delay: 0,   duration: 18 },
  { size: 350, x:  '70%', y:  '60%', color: 'rgba(79,172,254,0.12)',  delay: 3,   duration: 22 },
  { size: 250, x:  '40%', y:  '10%', color: 'rgba(200,80,192,0.10)',  delay: 6,   duration: 16 },
  { size: 200, x:  '-5%', y:  '70%', color: 'rgba(79,172,254,0.08)',  delay: 1.5, duration: 20 },
]

const FloatingOrbs = ({ className = '' }) => (
  <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
    {orbs.map((orb, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width:  orb.size,
          height: orb.size,
          left:   orb.x,
          top:    orb.y,
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.08, 0.94, 1],
        }}
        transition={{
          duration:  orb.duration,
          delay:     orb.delay,
          repeat:    Infinity,
          ease:      'easeInOut',
        }}
      />
    ))}
  </div>
)

export default FloatingOrbs

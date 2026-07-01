// ─── Loading Spinner ─────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 48, fullScreen = false, message = '' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#FF6B9D',
            borderRightColor: '#4FACFE',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner pulsing heart */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            💖
          </motion.span>
        </div>
      </div>
      {message && (
        <p className="text-white/50 text-sm font-medium animate-pulse">{message}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-base z-50">
        <div className="absolute inset-0">
          {/* Subtle orb behind spinner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.08), transparent 70%)', filter: 'blur(30px)' }} />
        </div>
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner

import React from 'react'
import { motion } from 'framer-motion'

const envelopeVariants = {
  closed: { rotateX: 0 },
  open:   { rotateX: -180 },
}

export default function Envelope({ isOpen = false, className = '', children }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={envelopeVariants}
        transition={{ duration: 0.6 }}
        className="origin-top bg-white/5 border border-white/10 rounded-lg overflow-hidden"
        style={{ perspective: 800 }}
      >
        <div className="p-4">
          {children}
        </div>
      </motion.div>
      {/* subtle shadow */}
      <div className="absolute inset-x-2 -bottom-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 opacity-10 rounded" />
    </div>
  )
}

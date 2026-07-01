import React from 'react'
import { motion } from 'framer-motion'

export default function LetterModal({ open, onClose, letter, isLocked }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-2xl w-full bg-white/5 rounded-lg p-6">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-white">{letter?.title}</h2>
          <button onClick={onClose} className="text-white/60">Close</button>
        </div>

        {isLocked ? (
          <div className="mt-6 p-6 bg-red-900/20 rounded">This letter is locked until its unlock date.</div>
        ) : (
          <div className="mt-4 whitespace-pre-wrap text-white/90">{letter?.body}</div>
        )}
      </motion.div>
    </div>
  )
}

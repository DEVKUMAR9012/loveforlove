import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Lightbox = ({ images = [], startIndex = 0, onClose }) => {
  const [index, setIndex] = useState(startIndex)
  const [scale, setScale] = useState(1)

  useEffect(() => setIndex(startIndex), [startIndex])
  useEffect(() => setScale(1), [index])

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i-1))
    if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length-1, i+1))
  }, [images.length, onClose])

  useEffect(() => { document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey) }, [handleKey])

  if (!images || images.length === 0) return null

  const cur = images[index]

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="relative max-w-full max-h-full" onClick={(e)=>e.stopPropagation()}>
          <motion.img
            key={cur.url}
            src={cur.url}
            alt={cur.filename}
            className="max-w-[95vw] max-h-[85vh] rounded-lg shadow-2xl"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              const v = info.velocity.x
              const offset = info.offset.x
              if (offset < -100 || v < -500) setIndex(i => Math.min(images.length-1, i+1))
              if (offset > 100 || v > 500) setIndex(i => Math.max(0, i-1))
            }}
            style={{ touchAction: 'pan-y' , scale: scale }}
            whileTap={{ cursor: 'grabbing' }}
          />

          {/* Controls */}
          <button onClick={() => setIndex(i => Math.max(0, i-1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full">◀</button>
          <button onClick={() => setIndex(i => Math.min(images.length-1, i+1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full">▶</button>
          <button onClick={onClose} className="absolute right-3 top-3 bg-black/40 text-white p-2 rounded">✕</button>

          <div className="mt-2 text-center text-white/80 text-sm">{cur.title}</div>

          {/* Zoom controls */}
          <div className="absolute left-3 bottom-3 flex gap-2">
            <button onClick={() => setScale(s => Math.max(1, s-0.25))} className="bg-black/40 text-white px-3 py-1 rounded">-</button>
            <button onClick={() => setScale(1)} className="bg-black/40 text-white px-3 py-1 rounded">Reset</button>
            <button onClick={() => setScale(s => Math.min(3, s+0.25))} className="bg-black/40 text-white px-3 py-1 rounded">+</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Lightbox

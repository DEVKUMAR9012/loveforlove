import { motion, AnimatePresence } from 'framer-motion'
import MemoryForm from './MemoryForm'

const MemoryModal = ({ isOpen, onClose, onCreated }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold gradient-text">Create Memory</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <MemoryForm onCreated={(id) => {
                onCreated?.(id)
                onClose()
              }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MemoryModal

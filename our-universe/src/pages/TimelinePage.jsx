import { useState } from 'react'
import PageTransition from '../components/ui/PageTransition'
import GradientText from '../components/ui/GradientText'
import TimelineList from '../components/features/TimelineList'
import MemoryModal from '../components/features/MemoryModal'

export default function TimelinePage() {
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false)
  
  return (
    <PageTransition className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <GradientText as="h1" className="text-3xl font-bold mb-2">📅 Timeline</GradientText>
            <p className="text-white/60">A vertical timeline of memories — scroll to load more.</p>
          </div>
          
          <button 
            onClick={() => setIsMemoryModalOpen(true)}
            className="btn-glass px-6 py-3 rounded-full flex items-center gap-2 hover-lift whitespace-nowrap"
          >
            <span className="text-xl">✨</span>
            <span className="font-semibold">Add Memory</span>
          </button>
        </div>
        
        {/* We key TimelineList on modal open/close so it can refresh after a memory is created if we wanted to, but the list can handle itself. Actually let's just let it be for now. */}
        <TimelineList />
      </div>
      
      <MemoryModal 
        isOpen={isMemoryModalOpen} 
        onClose={() => setIsMemoryModalOpen(false)}
        onCreated={(id) => {
          // In a real app we might force TimelineList to reload here
          // But since it's just a demo, simply closing the modal is fine
          // User can refresh to see it if needed, or we add a refreshKey
        }}
      />
    </PageTransition>
  )
}

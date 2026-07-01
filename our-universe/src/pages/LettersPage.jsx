import React, { useState } from 'react'
import PageTransition from '../components/ui/PageTransition'
import GradientText from '../components/ui/GradientText'
import LettersList from '../components/features/LettersList'
import LetterEditor from '../components/features/LetterEditor'
import LetterModal from '../components/features/LetterModal'
import useAuthStore from '../store/authStore'

export default function LettersPage() {
  const profile = useAuthStore(s => s.profile)
  const [editing, setEditing] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpen = (letter) => {
    // determine lock state
    const unlockAt = letter?.unlockAt ? (letter.unlockAt.seconds ? new Date(letter.unlockAt.seconds * 1000) : new Date(letter.unlockAt)) : null
    const isLocked = unlockAt ? unlockAt.getTime() > Date.now() : false
    setViewing({ letter, isLocked })
    setModalOpen(true)
  }

  return (
    <PageTransition className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <GradientText as="h1" className="text-3xl font-bold">💌 Love Letters</GradientText>
        <div className="flex items-center gap-3">
          <button className="btn" onClick={() => setEditing(e => !e)}>{editing ? 'Close' : 'New Letter'}</button>
        </div>
      </div>

      {editing && (
        <div className="mb-6">
          <LetterEditor onClose={() => setEditing(false)} onSaved={() => {}} />
        </div>
      )}

      <LettersList onOpen={handleOpen} />

      <LetterModal open={modalOpen} onClose={() => setModalOpen(false)} letter={viewing?.letter} isLocked={viewing?.isLocked} />
    </PageTransition>
  )
}

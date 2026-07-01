import { useEffect, useState } from 'react'
import { subscribeVoiceNotes } from '../../features/voice/voiceService'
import { where } from '../../lib/firestore'
import VoiceNoteCard from './VoiceNoteCard'

export default function VoiceNotesList({ ownerId }) {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (!ownerId) return
    const unsub = subscribeVoiceNotes([where('ownerId', '==', ownerId)], (items) => setNotes(items))
    return () => unsub()
  }, [ownerId])

  if (!notes.length) {
    return <p className="text-white/60">No voice notes yet — record one to keep your memories alive.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {notes.map((note) => (
        <VoiceNoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}

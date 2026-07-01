import { useState } from 'react'
import PageTransition from '../components/ui/PageTransition'
import GradientText from '../components/ui/GradientText'
import useAuthStore from '../store/authStore'
import VoiceRecorder from '../components/features/VoiceRecorder'
import VoiceNotesList from '../components/features/VoiceNotesList'

export default function VoiceNotesPage() {
  const profile = useAuthStore((s) => s.profile)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <PageTransition className="p-4 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <GradientText as="h1" className="text-3xl font-bold">🎙️ Voice Notes</GradientText>
          <p className="max-w-2xl text-white/70">Record heart-to-heart audio memories, upload existing voice notes, and replay them with an animated waveform experience.</p>
        </div>

        <VoiceRecorder onSaved={() => setRefreshKey((prev) => prev + 1)} />

        <div className="space-y-4">
          <h2 className="heading-4">Your Recordings</h2>
          {profile ? <VoiceNotesList key={refreshKey} ownerId={profile.uid} /> : <p className="text-white/60">Sign in to view your saved voice notes.</p>}
        </div>
      </div>
    </PageTransition>
  )
}

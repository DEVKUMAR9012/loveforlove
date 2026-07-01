// ─── Stub Page Template ──────────────────────────────────────────────────────
import PageTransition from '../components/ui/PageTransition'
import GlassCard from '../components/ui/GlassCard'
import GradientText from '../components/ui/GradientText'

const makeStubPage = (emoji, title, phase) => () => (
  <PageTransition className="p-4 md:p-8">
    <GradientText as="h1" className="text-3xl font-bold mb-6">{emoji} {title}</GradientText>
    <GlassCard className="p-6">
      <p className="text-white/60">{title} coming in {phase} ✨</p>
    </GlassCard>
  </PageTransition>
)

export const TimelinePage    = makeStubPage('📅', 'Timeline',    'Phase 4')
export const GalleryPage     = makeStubPage('🖼️', 'Gallery',     'Phase 5')
export const LettersPage     = makeStubPage('💌', 'Love Letters','Phase 6')
export const VoiceNotesPage  = makeStubPage('🎙️', 'Voice Notes', 'Phase 6')
export const GoalsPage       = makeStubPage('🌠', 'Future Goals','Phase 7')

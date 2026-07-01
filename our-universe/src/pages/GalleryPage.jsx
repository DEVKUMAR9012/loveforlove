import PageTransition from '../components/ui/PageTransition'
import GradientText from '../components/ui/GradientText'
import GalleryMasonry from '../components/features/GalleryMasonry'

export default function GalleryPage() {
  return (
    <PageTransition className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <GradientText as="h1" className="text-3xl font-bold mb-4">🖼️ Gallery</GradientText>
        <p className="text-white/60 mb-6">Premium masonry gallery — tap any image to open the lightbox. Mobile-first and swipe-enabled.</p>
        <GalleryMasonry />
      </div>
    </PageTransition>
  )
}

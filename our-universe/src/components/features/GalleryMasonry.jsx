import React, { useEffect, useState } from 'react'
import ImageTile from './ImageTile'
import Lightbox from './Lightbox'
import { listAllPhotos } from '../../features/gallery/galleryService'

const GalleryMasonry = () => {
  const [images, setImages] = useState([])
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await listAllPhotos()
        if (mounted) setImages(data)
      } catch (e) { console.error('gallery load', e) }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {images.map((it, i) => (
          <ImageTile key={`${it.storagePath}_${i}`} item={it} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox images={images} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  )
}

export default GalleryMasonry

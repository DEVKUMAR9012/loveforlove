import { listMemories } from '../memories/memoryService'

/**
 * Aggregate all photos from memories into a flat list for the gallery
 * Each item: { url, storagePath, filename, createdAt, memoryId, title, date }
 */
export const listAllPhotos = async () => {
  const memories = await listMemories()
  const photos = []
  for (const m of memories) {
    const meta = { memoryId: m.id, title: m.title, date: m.date }
    ;(m.photos || []).forEach(p => photos.push({ ...p, ...meta }))
    ;(m.screenshots || []).forEach(p => photos.push({ ...p, ...meta }))
  }
  // sort newest first
  photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return photos
}

export default { listAllPhotos }

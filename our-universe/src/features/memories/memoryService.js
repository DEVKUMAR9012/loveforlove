import { addDocument, getCollection, getDocument, updateDocument, deleteDocument, where, orderBy, limit as fbLimit, Timestamp } from '../../lib/firestore'
import { uploadFile, deleteFile } from '../../lib/storage'

const COLLECTION = 'memories'

export const createMemory = async ({ title, description, date, createdBy, tags = [], files = {} }) => {
  // files: { photos: [File], videos: [File], screenshots: [File], voiceNotes: [File] }
  const docRef = await addDocument(COLLECTION, {
    title,
    description: description || '',
    date: date ? new Date(date) : new Date(),
    photos: [],
    videos: [],
    screenshots: [],
    voiceNotes: [],
    chatRefs: [],
    createdBy,
    tags,
  })

  const memoryId = docRef.id

  // upload files if present
  const uploaded = { photos: [], videos: [], screenshots: [], voiceNotes: [] }

  for (const type of ['photos', 'videos', 'screenshots', 'voiceNotes']) {
    const list = files[type] || []
    for (const file of list) {
      const storagePath = `memories/${memoryId}/${type}/${Date.now()}_${file.name}`
      const url = await uploadFile(storagePath, file)
      const item = { url, storagePath, filename: file.name, createdAt: new Date() }
      uploaded[type].push(item)
    }
  }

  // update doc with uploaded file metadata
  await updateDocument(`${COLLECTION}/${memoryId}`, uploaded)

  return memoryId
}

export const listMemories = async (constraints = []) =>
  getCollection(COLLECTION, constraints)

/**
 * Paginated list: fetch a page of memories ordered by date desc.
 * @param {number} pageSize
 * @param {string|Date|null} beforeDate - if provided, fetch memories with date < beforeDate
 */
export const listMemoriesPage = async (pageSize = 10, beforeDate = null) => {
  const constraints = [ orderBy('date', 'desc'), fbLimit(pageSize) ]
  if (beforeDate) {
    // Firestore expects a Timestamp for comparison
    const ts = beforeDate instanceof Date ? Timestamp.fromDate(beforeDate) : Timestamp.fromDate(new Date(beforeDate))
    // To page older results, add a where clause date < beforeDate
    constraints.unshift(where('date', '<', ts))
  }
  return getCollection(COLLECTION, constraints)
}

export const getMemory = async (id) =>
  getDocument(`${COLLECTION}/${id}`)

export const updateMemory = async (id, data = {}, files = {}) => {
  // data: new fields
  await updateDocument(`${COLLECTION}/${id}`, data)

  // upload additional files, append arrays
  const uploaded = {}
  for (const type of ['photos', 'videos', 'screenshots', 'voiceNotes']) {
    const list = files[type] || []
    uploaded[type] = []
    for (const file of list) {
      const storagePath = `memories/${id}/${type}/${Date.now()}_${file.name}`
      const url = await uploadFile(storagePath, file)
      uploaded[type].push({ url, storagePath, filename: file.name, createdAt: new Date() })
    }
  }

  // merge uploaded arrays into doc
  await updateDocument(`${COLLECTION}/${id}`, uploaded)

  return await getMemory(id)
}

export const deleteMemoryById = async (id) => {
  const memory = await getMemory(id)
  if (!memory) return
  // delete storage files (best effort)
  // Voice notes are permanently stored and cannot be deleted, so we exclude them from deletion
  const allFiles = [...(memory.photos||[]), ...(memory.videos||[]), ...(memory.screenshots||[])]
  for (const f of allFiles) {
    try { await deleteFile(f.storagePath) } catch (e) { console.warn('deleteFile error', e.message) }
  }
  await deleteDocument(`${COLLECTION}/${id}`)
}

export default { createMemory, listMemories, getMemory, updateMemory, deleteMemoryById }

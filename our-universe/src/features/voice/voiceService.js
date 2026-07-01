import { getCollection, addDocument, deleteDocument, subscribeToCollection, orderBy, Timestamp } from '../../lib/firestore'
import { uploadFile, deleteFile } from '../../lib/storage'

const COLLECTION = 'voiceNotes'

export const listVoiceNotes = (constraints = []) =>
  getCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints])

export const subscribeVoiceNotes = (constraints = [], cb) =>
  subscribeToCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints], cb)

export const createVoiceNote = async ({ title, description, ownerId, file, fileName, onProgress }) => {
  const timestamp = Date.now()
  const filename = fileName || `voice-${timestamp}.webm`
  const storagePath = `voice-notes/${ownerId}/${timestamp}_${filename}`
  const url = await uploadFile(storagePath, file, onProgress)

  return addDocument(COLLECTION, {
    title,
    description,
    ownerId,
    url,
    storagePath,
    filename,
    duration: 0,
    createdAt: Timestamp.fromDate(new Date()),
  })
}

export default {
  listVoiceNotes,
  subscribeVoiceNotes,
  createVoiceNote,
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file with progress callback
 * @param {string} path - Storage path (e.g. 'gallery/coupleId/photoId/original.jpg')
 * @param {File} file - File object
 * @param {Function} onProgress - (percent: number) => void
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = (path, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/**
 * Get download URL for existing file
 */
export const getFileURL = (path) => getDownloadURL(ref(storage, path))

/**
 * Delete a file from Storage
 */
export const deleteFile = (path) => deleteObject(ref(storage, path))

/**
 * List all files in a folder
 */
export const listFiles = async (path) => {
  const result = await listAll(ref(storage, path))
  return result.items.map(item => item.fullPath)
}

export { storage }

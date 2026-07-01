// Firestore-backed service for Love Letters
import { getCollection, addDocument, getDocument, updateDocument, deleteDocument, subscribeToCollection, orderBy } from '../../lib/firestore'

const COLLECTION = 'letters'

export const listLetters = async (constraints = []) =>
  getCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints])

export const getLetter = async (id) =>
  getDocument(`${COLLECTION}/${id}`)

export const createLetter = async (data) =>
  addDocument(COLLECTION, data)

export const updateLetter = async (id, data) =>
  updateDocument(`${COLLECTION}/${id}`, data)

export const deleteLetter = async (id) =>
  deleteDocument(`${COLLECTION}/${id}`)

export const subscribeLetters = (constraints, cb) =>
  subscribeToCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints], cb)

export default {
  listLetters, getLetter, createLetter, updateLetter, deleteLetter, subscribeLetters
}

// ─── Firestore Helpers ───────────────────────────────────────────────────────
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Generic Helpers ─────────────────────────────────────────────────────────

/** Fetch a single document by path */
export const getDocument = async (path) => {
  const snap = await getDoc(doc(db, path))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Get all documents from a collection */
export const getCollection = async (path, constraints = []) => {
  const q = query(collection(db, path), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Set a document (with merge by default) */
export const setDocument = (path, data, merge = true) =>
  setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() }, { merge })

/** Add a document to collection */
export const addDocument = (path, data) =>
  addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() })

/** Update specific fields */
export const updateDocument = (path, data) =>
  updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() })

/** Delete a document */
export const deleteDocument = (path) => deleteDoc(doc(db, path))

/** Subscribe to a document (real-time) */
export const subscribeToDocument = (path, callback) =>
  onSnapshot(doc(db, path), snap =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  )

/** Subscribe to a collection query (real-time) */
export const subscribeToCollection = (path, constraints, callback) => {
  const q = query(collection(db, path), ...constraints)
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ─── Re-exports for convenience ──────────────────────────────────────────────
export { collection, doc, db, query, where, orderBy, limit, serverTimestamp, Timestamp, onSnapshot }

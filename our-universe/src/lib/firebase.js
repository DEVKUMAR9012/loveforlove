// ─── Firebase Configuration ─────────────────────────────────────────────────
// Populate your .env file with actual values from your Firebase Console
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ─── Validation ──────────────────────────────────────────────────────────────
const isMissingConfig = !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'your_api_key_here' ||
  firebaseConfig.apiKey.startsWith('placeholder')

if (isMissingConfig) {
  console.warn(
    '⚠️  Firebase not configured.\n' +
    'Copy .env.example → .env and fill in your Firebase project values.\n' +
    'The UI will render but auth/database features will be disabled.'
  )
}

// ─── Initialize ──────────────────────────────────────────────────────────────
// Prevent re-initialization in HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// ─── Lazy service getters ────────────────────────────────────────────────────
// Services are created lazily to avoid crashing when config is missing.
// Use these getters instead of calling getAuth(app) directly.

let _auth, _db, _storage, _rtdb

export const getFirebaseAuth = () => {
  if (_auth) return _auth
  _auth = getAuth(app)
  return _auth
}

export const getFirebaseDB = () => {
  if (_db) return _db
  _db = getFirestore(app)
  return _db
}

export const getFirebaseStorage = () => {
  if (_storage) return _storage
  _storage = getStorage(app)
  return _storage
}

export const getFirebaseRTDB = () => {
  if (_rtdb) return _rtdb
  _rtdb = getDatabase(app)
  return _rtdb
}

// ─── Convenience exports (initialized eagerly — safe with valid config) ───────
// These are used by the UI. If config is missing they'll produce console warnings,
// but won't crash the module.
export let auth           = null
export let db             = null
export let storage        = null
export let rtdb           = null
export const googleProvider = new GoogleAuthProvider()

if (!isMissingConfig) {
  try { auth    = getAuth(app)        } catch (e) { console.warn('Auth init:', e.message) }
  try { db      = getFirestore(app)   } catch (e) { console.warn('Firestore init:', e.message) }
  try { storage = getStorage(app)     } catch (e) { console.warn('Storage init:', e.message) }
  try { rtdb    = getDatabase(app)    } catch (e) { console.warn('RTDB init:', e.message) }
}

googleProvider.setCustomParameters({ prompt: 'select_account' })

export { isMissingConfig }
export default app

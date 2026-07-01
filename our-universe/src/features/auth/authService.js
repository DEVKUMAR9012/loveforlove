import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../../lib/firebase'

// ─── Login with Google ───────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  if (!auth) throw new Error('Firebase Auth not initialized')
  
  // 1. Sign in with Google Popup
  const userCredential = await signInWithPopup(auth, googleProvider)
  const user = userCredential.user

  // Ensure ONLY dk25042008@gmail.com can log in via Google
  if (user.email !== 'dk25042008@gmail.com') {
    await signOut(auth)
    throw { code: 'auth/unauthorized', message: 'Unauthorized: Only the true stargazer can enter.' }
  }

  // 2. Check if user profile already exists in Firestore
  const userRef = doc(db, 'users', user.uid)
  let userSnap
  try {
    userSnap = await getDoc(userRef)
  } catch (err) {
    if (err.message.includes('offline')) {
      throw { code: 'firestore/not-created', message: 'Database not found. Please create the Firestore Database in your Firebase Console.' }
    }
    throw err
  }

  let profile = null
  let isNewUser = false

  if (!userSnap.exists()) {
    // 3. First time login — create profile
    isNewUser = true
    profile = {
      uid: user.uid,
      displayName: user.displayName || 'Stargazer',
      email: user.email,
      photoURL: user.photoURL || null,
      coupleId: null, // Not paired yet
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }
    await setDoc(userRef, profile)
  } else {
    // 4. Returning user — get profile
    profile = userSnap.data()
    // Update last seen
    await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true })
  }

  return { user, profile, isNewUser }
}

// ─── Login with Email/Password ───────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  if (!auth) throw new Error('Firebase Auth not initialized')

  // Ensure ONLY dk25042008@gmail.com can log in
  if (email !== 'dk25042008@gmail.com') {
    throw { code: 'auth/unauthorized', message: 'Unauthorized: Only the true stargazer can enter.' }
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  const userRef = doc(db, 'users', user.uid)
  let userSnap
  try {
    userSnap = await getDoc(userRef)
  } catch (err) {
    if (err.message.includes('offline')) {
      throw { code: 'firestore/not-created', message: 'Database not found. Please create the Firestore Database in your Firebase Console.' }
    }
    throw err
  }
  
  let profile = null
  if (userSnap.exists()) {
    profile = userSnap.data()
    await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true })
  }

  return { user, profile, isNewUser: false }
}

// ─── Sign Up with Email/Password ─────────────────────────────────────────────
export const signupWithEmail = async (email, password, displayName) => {
  if (!auth) throw new Error('Firebase Auth not initialized')

  if (email !== 'dk25042008@gmail.com') {
    throw { code: 'auth/unauthorized', message: 'Unauthorized: Only the true stargazer can enter.' }
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  const profile = {
    uid: user.uid,
    displayName: displayName || 'Stargazer',
    email: user.email,
    photoURL: null,
    coupleId: null,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  }

  await setDoc(doc(db, 'users', user.uid), profile)

  return { user, profile, isNewUser: true }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  if (!auth) return
  await signOut(auth)
}

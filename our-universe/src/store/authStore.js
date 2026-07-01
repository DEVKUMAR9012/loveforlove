// ─── Auth Store ──────────────────────────────────────────────────────────────
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isMissingConfig } from '../lib/firebase'
import { getDocument } from '../lib/firestore'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─── State ───────────────────────────────────────────────────────────
      user:         null,    // Firebase user object
      profile:      null,    // Firestore user doc
      initialized:  false,   // Auth listener ready?
      loading:      false,

      // ─── Actions ─────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setInitialized: (initialized) => set({ initialized }),
      setLoading: (loading) => set({ loading }),

      /** Fetch and cache the Firestore user profile */
      fetchProfile: async (uid) => {
        try {
          const profile = await getDocument(`users/${uid}`)
          set({ profile })
        } catch (err) {
          console.error('fetchProfile error:', err)
        }
      },

      /** Start Firebase Auth listener */
      initAuthListener: () => {
        // Skip if Firebase isn't configured (placeholder .env)
        if (isMissingConfig || !auth) {
          console.warn('Firebase not configured — skipping auth listener.')
          set({ initialized: true })
          return () => {}
        }

        try {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              set({ user: firebaseUser })
              await get().fetchProfile(firebaseUser.uid)
            } else {
              set({ user: null, profile: null })
            }
            set({ initialized: true })
          }, (error) => {
            // Auth error (e.g. invalid Firebase config) — still mark initialized
            console.warn('Firebase Auth error:', error.message)
            set({ initialized: true })
          })
          return unsubscribe
        } catch (error) {
          console.warn('Firebase init error:', error.message)
          set({ initialized: true })
          return () => {}
        }
      },

      /** Clear all auth state */
      clear: () => set({ user: null, profile: null }),
    }),
    {
      name: 'our-universe-auth',
      // Only persist minimal data — Firebase handles the real session
      partialize: (state) => ({
        profile: state.profile
      }),
    }
  )
)

export default useAuthStore

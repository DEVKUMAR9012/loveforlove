// ─── App Root ────────────────────────────────────────────────────────────────
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import router from './router'
import useAuthStore from './store/authStore'

const App = () => {
  const initAuthListener = useAuthStore(s => s.initAuthListener)

  useEffect(() => {
    // Start Firebase auth listener once on app mount
    const unsubscribe = initAuthListener()
    return unsubscribe
  }, [initAuthListener])

  return (
    <>
      <RouterProvider router={router} />

      {/* Global Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 500,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          },
          success: {
            iconTheme: { primary: '#FF6B9D', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ff4444', secondary: '#fff' },
          },
          duration: 4000,
        }}
      />
    </>
  )
}

export default App

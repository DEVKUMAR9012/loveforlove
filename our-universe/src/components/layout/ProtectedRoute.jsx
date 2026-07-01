// ─── Protected Route ─────────────────────────────────────────────────────────
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useAuthStore()
  const location = useLocation()

  // --- TEMPORARY BYPASS ---
  // The user just wants to see the UI without dealing with Firebase right now.
  // We're skipping the auth checks entirely.
  return children

  return children
}

export default ProtectedRoute

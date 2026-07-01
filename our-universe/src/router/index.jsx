// ─── App Router ──────────────────────────────────────────────────────────────
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import LoadingSpinner from '../components/ui/LoadingSpinner'


// Lazy-load pages
const LoginPage        = lazy(() => import('../pages/LoginPage'))
const SignupPage       = lazy(() => import('../pages/SignupPage'))
const OnboardingPage   = lazy(() => import('../pages/OnboardingPage'))
const JoinUniversePage = lazy(() => import('../pages/JoinUniversePage'))
const DashboardPage    = lazy(() => import('../pages/DashboardPage'))
const NotFoundPage     = lazy(() => import('../pages/NotFoundPage'))
const DesignPage       = lazy(() => import('../pages/DesignPage'))
const VoiceNotesPage   = lazy(() => import('../pages/VoiceNotesPage'))
const GoalsPage       = lazy(() => import('../pages/GoalsPage'))

const Loader = () => <LoadingSpinner fullScreen message="Loading…" />

const TimelinePage    = lazy(() => import('../pages/TimelinePage'))
const GalleryPage     = lazy(() => import('../pages/GalleryPage'))
const LettersPage     = lazy(() => import('../pages/LettersPage'))

const router = createBrowserRouter([
  // ─── Public ──────────────────────────────────────────────────────────────
  { path: '/login',      element: <Suspense fallback={<Loader />}><LoginPage /></Suspense> },
  { path: '/signup',     element: <Suspense fallback={<Loader />}><SignupPage /></Suspense> },
  { path: '/onboarding', element: <Suspense fallback={<Loader />}><OnboardingPage /></Suspense> },
  { path: '/join',       element: <Suspense fallback={<Loader />}><JoinUniversePage /></Suspense> },
  { path: '/design',     element: <Suspense fallback={<Loader />}><DesignPage /></Suspense> },

  // ─── Protected ───────────────────────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true,          element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard',   element: <Suspense fallback={<Loader />}><DashboardPage /></Suspense> },
      { path: '/timeline',    element: <Suspense fallback={<Loader />}><TimelinePage /></Suspense> },
      { path: '/gallery',     element: <Suspense fallback={<Loader />}><GalleryPage /></Suspense> },
      { path: '/letters',     element: <Suspense fallback={<Loader />}><LettersPage /></Suspense> },
      { path: '/voice',       element: <Suspense fallback={<Loader />}><VoiceNotesPage /></Suspense> },
      { path: '/goals',       element: <Suspense fallback={<Loader />}><GoalsPage /></Suspense> },
    ],
  },

  // ─── 404 ─────────────────────────────────────────────────────────────────
  { path: '*', element: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense> },
])

export default router

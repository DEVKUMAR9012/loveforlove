// vibecheck-disable SECAI006
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import About from './pages/About';
import Invite from './pages/Invite';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import MediaGallery from './pages/MediaGallery';
import SharedCalendar from './pages/SharedCalendar';
import MoodTracker from './pages/MoodTracker';
import Snap from './pages/Snap';
import VoiceNotes from './pages/VoiceNotes';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import ReportPage from './pages/ReportPage';
import LiveLocation from './pages/LiveLocation';
import LettersPage from './pages/LettersPage';

// ── Admin Guard ───────────────────────────────────────────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
// Each route gets its own ErrorBoundary so one broken page never
// white-screens the whole app. The boundary resets on navigation because
// each route mounts a fresh instance.
const Guarded = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

function App() {
  return (
    // Top-level boundary catches AuthProvider / Router crashes
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={<Guarded><Login /></Guarded>}
            />
            <Route
              path="/about"
              element={<Guarded><About /></Guarded>}
            />
            <Route
              path="/invite"
              element={<Guarded><Invite /></Guarded>}
            />
            <Route
              path="/join"
              element={<Guarded><Invite /></Guarded>}
            />

            {/* Protected Routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/"         element={<Guarded><Dashboard /></Guarded>} />
              <Route path="/gallery"  element={<Guarded><MediaGallery /></Guarded>} />
              <Route path="/calendar" element={<Guarded><SharedCalendar /></Guarded>} />
              <Route path="/mood"     element={<Guarded><MoodTracker /></Guarded>} />
              <Route path="/snap"     element={<Guarded><Snap /></Guarded>} />
              <Route path="/prompts"  element={<Navigate to="/snap" replace />} />
              <Route path="/voice"    element={<Guarded><VoiceNotes /></Guarded>} />
              <Route path="/location" element={<Guarded><LiveLocation /></Guarded>} />
              <Route path="/letters"  element={<Guarded><LettersPage /></Guarded>} />
              <Route path="/settings" element={<Guarded><Settings /></Guarded>} />
              <Route path="/admin"    element={<Guarded><AdminRoute><AdminDashboard /></AdminRoute></Guarded>} />
              <Route path="/report"   element={<Guarded><ReportPage /></Guarded>} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

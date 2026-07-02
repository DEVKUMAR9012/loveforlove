// vibecheck-disable SECAI006
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import MediaGallery from './pages/MediaGallery';
import SharedCalendar from './pages/SharedCalendar';
import MoodTracker from './pages/MoodTracker';
import DailyPrompts from './pages/DailyPrompts';
import VoiceNotes from './pages/VoiceNotes';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

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

            {/* Protected Routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/"         element={<Guarded><Dashboard /></Guarded>} />
              <Route path="/gallery"  element={<Guarded><MediaGallery /></Guarded>} />
              <Route path="/calendar" element={<Guarded><SharedCalendar /></Guarded>} />
              <Route path="/mood"     element={<Guarded><MoodTracker /></Guarded>} />
              <Route path="/prompts"  element={<Guarded><DailyPrompts /></Guarded>} />
              <Route path="/voice"    element={<Guarded><VoiceNotes /></Guarded>} />
              <Route path="/messages" element={<Guarded><Messages /></Guarded>} />
              <Route path="/settings" element={<Guarded><Settings /></Guarded>} />
              <Route path="/admin"    element={<Guarded><AdminRoute><AdminDashboard /></AdminRoute></Guarded>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

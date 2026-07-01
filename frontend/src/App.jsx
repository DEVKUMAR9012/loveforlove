import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import MediaGallery from './pages/MediaGallery';
import SharedCalendar from './pages/SharedCalendar';
import MoodTracker from './pages/MoodTracker';
import DailyPrompts from './pages/DailyPrompts';
import VoiceNotes from './pages/VoiceNotes';
import Messages from './pages/Messages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gallery" element={<MediaGallery />} />
            <Route path="/calendar" element={<SharedCalendar />} />
            <Route path="/mood" element={<MoodTracker />} />
            <Route path="/prompts" element={<DailyPrompts />} />
            <Route path="/voice" element={<VoiceNotes />} />
            <Route path="/messages" element={<Messages />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

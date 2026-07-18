import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineExclamationCircle,
  HiOutlineFire,
} from 'react-icons/hi';
import { InLoveFace, HappyFace, CalmFace, MissYouFace, StressedFace } from '../components/MoodFaces';
import { getApiBaseUrl } from '../utils/api';

// ---------------------------------------------------------------------------
// Personal mood journal — every user has their own isolated mood history.
// ---------------------------------------------------------------------------

const MOODS = [
  { id: 'in_love',  Face: InLoveFace,   emoji: '🥰', label: 'In Love',  color: '#D4537E', soft: '#FBEAF0' },
  { id: 'happy',    Face: HappyFace,    emoji: '😊', label: 'Happy',    color: '#BA7517', soft: '#FAEEDA' },
  { id: 'calm',     Face: CalmFace,     emoji: '😌', label: 'Calm',     color: '#0F6E56', soft: '#E1F5EE' },
  { id: 'miss_you', Face: MissYouFace,  emoji: '🥺', label: 'Miss You', color: '#534AB7', soft: '#EEEDFE' },
  { id: 'stressed', Face: StressedFace, emoji: '😫', label: 'Stressed', color: '#993C1D', soft: '#FAECE7' },
];

const HEATMAP_DAYS = 35;

function getMood(id) {
  return MOODS.find((m) => m.id === id) || null;
}

function timeAgo(date) {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function MoodTracker() {
  const API_BASE = getApiBaseUrl();

  const [myMood, setMyMood]         = useState(null);
  const [myMoodAt, setMyMoodAt]     = useState(null);
  const [partnerMood, setPartnerMood]   = useState(null);
  const [partnerMoodAt, setPartnerMoodAt] = useState(null);
  const [history, setHistory]       = useState([]);
  const [timeline, setTimeline]     = useState([]);
  const [streak, setStreak]         = useState(0);
  const [isSaving, setIsSaving]     = useState(false);
  const [error, setError]           = useState(null);

  const token = () => localStorage.getItem('token');

  // ── Fetch ──────────────────────────────────────────────────────────────

  // signal is passed in so AbortController can cancel in-flight fetches on unmount
  const fetchStatus = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_BASE}/api/mood/status`, {
        headers: { Authorization: `Bearer ${token()}` },
        signal,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setMyMood(data.mine?.mood || null);
      setMyMoodAt(data.mine?.updatedAt || null);
      setPartnerMood(data.partner?.mood || null);
      setPartnerMoodAt(data.partner?.updatedAt || null);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return; // unmounted — silently ignore
      console.error('Failed to fetch mood status', err);
      setError("Couldn't reach the server. Your last mood is still shown below.");
    }
  }, [API_BASE]);

  const fetchHistory = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_BASE}/api/mood/history?days=${HEATMAP_DAYS}`, {
        headers: { Authorization: `Bearer ${token()}` },
        signal,
      });
      if (!res.ok) throw new Error(`History ${res.status}`);
      const data = await res.json();
      setHistory(data.days || []);
      setTimeline(data.timeline || []);
      setStreak(data.streak ?? 0);
    } catch (err) {
      if (err.name === 'AbortError') return; // unmounted — silently ignore
      console.error('Failed to fetch mood history', err);
    }
  }, [API_BASE]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStatus(controller.signal);
    fetchHistory(controller.signal);
    // Cleanup: abort both fetches if user navigates away before they finish
    return () => controller.abort();
  }, [fetchStatus, fetchHistory]);

  // ── Actions ────────────────────────────────────────────────────────────

  const selectMood = async (mood) => {
    if (isSaving) return;
    setIsSaving(true);
    const previous = { myMood, myMoodAt };
    setMyMood(mood.id);
    setMyMoodAt(new Date().toISOString());

    try {
      const res = await fetch(`${API_BASE}/api/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ mood: mood.id }),
      });
      if (!res.ok) throw new Error(`Save ${res.status}`);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save mood', err);
      setMyMood(previous.myMood);
      setMyMoodAt(previous.myMoodAt);
      setError("Couldn't save your mood. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────────

  const myMoodObj      = getMood(myMood);
  const partnerMoodObj = getMood(partnerMood);
  const ambientSoft    = myMoodObj?.soft || 'transparent';
  const ambientColor   = myMoodObj?.color || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative max-w-4xl mx-auto min-h-full"
    >
      {/* Ambient mood wash */}
      <motion.div
        className="fixed inset-0 pointer-events-none -z-10"
        animate={{
          background: ambientColor
            ? `radial-gradient(ellipse 70% 50% at 50% 0%, ${ambientSoft}66 0%, transparent 70%)`
            : 'transparent',
        }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      <div className="text-center mb-10 mt-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">How are you feeling today? 💖</h1>
        <p className="text-gray-500 text-lg">Track your mood and look back on your journey.</p>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 text-sm"
          >
            <HiOutlineExclamationCircle className="text-lg shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 border border-orange-200 shadow-sm">
            <HiOutlineFire className="text-orange-500 text-lg" />
            <span className="text-sm font-medium text-gray-700">
              {streak} day streak 🔥
            </span>
          </div>
        </div>
      )}

      {/* Current mood cards — mine + partner side by side */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        {myMoodObj && (
          <motion.div
            key={myMood}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              className="flex items-center gap-4 px-6 py-4 rounded-3xl shadow-sm border border-white/80"
              style={{ background: myMoodObj.soft }}
            >
              <myMoodObj.Face size={52} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">You</p>
                <p className="font-bold text-gray-800">Feeling {myMoodObj.label.toLowerCase()}</p>
                {myMoodAt && <p className="text-sm text-gray-400">{timeAgo(myMoodAt)}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {partnerMoodObj && (
          <motion.div
            key={`partner-${partnerMood}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              className="flex items-center gap-4 px-6 py-4 rounded-3xl shadow-sm border border-white/80"
              style={{ background: partnerMoodObj.soft }}
            >
              <partnerMoodObj.Face size={52} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Partner 💕</p>
                <p className="font-bold text-gray-800">Feeling {partnerMoodObj.label.toLowerCase()}</p>
                {partnerMoodAt && <p className="text-sm text-gray-400">{timeAgo(partnerMoodAt)}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mood picker */}
      <div className="flex flex-wrap justify-center gap-5 mb-12">
        {MOODS.map((mood) => {
          const isSelected = myMood === mood.id;
          return (
            <motion.button
              key={mood.id}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectMood(mood)}
              disabled={isSaving}
              aria-label={mood.label}
              className="flex flex-col items-center justify-center w-28 h-28 rounded-[2rem] glass shadow-sm transition-all"
              style={{
                border: `2px solid ${isSelected ? mood.color : 'transparent'}`,
                background: isSelected ? mood.soft : 'rgba(255,255,255,0.5)',
              }}
            >
              <mood.Face size={52} />
              <span className="text-sm font-medium mt-1" style={{ color: isSelected ? mood.color : '#4B5563' }}>
                {mood.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Mood history heatmap */}
      <div className="glass p-8 rounded-[2rem] shadow-sm mb-10">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Mood history</h2>
          <span className="text-sm text-gray-400">{history.length} days logged</span>
        </div>
        <p className="text-gray-500 mb-6 text-sm">Last {HEATMAP_DAYS} days — each square is one day.</p>

        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No history yet — log a mood for a few days to see it here.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* 7-column grid = one column per day of week, GitHub-style.
                Squares never randomly wrap — they align left-to-right in
                consistent week rows regardless of screen width. */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1.25rem)',
                gap: '0.375rem',
                minWidth: 'max-content',
              }}
            >
              {history.map((day) => {
                const moodObj = getMood(day.mood);
                return (
                  <div
                    key={day.date}
                    title={`${day.date}${moodObj ? ' — ' + moodObj.label : ''}`}
                    className="w-5 h-5 rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ background: moodObj ? moodObj.color : '#E5E7EB' }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-6 flex-wrap">
          {MOODS.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm" style={{ background: m.color }} />
              {m.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-sm bg-gray-200" />
            No entry
          </div>
        </div>
      </div>

      {/* Mood detailed timeline */}
      {timeline.length > 0 && (
        <div className="glass p-8 rounded-[2rem] shadow-sm mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Timeline</h2>
          <div className="flex flex-col gap-4">
            {timeline.map((entry) => {
              const m = getMood(entry.mood);
              if (!m) return null;
              return (
                <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 shadow-sm border border-white/60">
                  <m.Face size={48} />
                  <div>
                    <p className="font-semibold text-gray-800" style={{ color: m.color }}>{m.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.time).toLocaleString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default MoodTracker;

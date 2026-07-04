import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUDIO_FORMATS = [
  { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
  { mimeType: 'audio/webm', extension: 'webm' },
  { mimeType: 'audio/mp4', extension: 'm4a' },
  { mimeType: 'audio/aac', extension: 'aac' },
  { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
];

function getSupportedAudioFormat() {
  if (!window.MediaRecorder) return null;
  return AUDIO_FORMATS.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) || {
    mimeType: '',
    extension: 'webm',
  };
}

function formatDuration(secs) {
  const s = Math.floor(secs);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getId(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
}

export default function VoiceNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const [error, setError] = useState('');
  const [audioFormat, setAudioFormat] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRefs = useRef({});
  const token = localStorage.getItem('token');

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/voice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error('Fetch voice notes error:', e);
    }
  };

  useEffect(() => {
    setAudioFormat(getSupportedAudioFormat());
    fetchNotes();
  }, []);

  const startRecording = async () => {
    if (recording || uploading) return;
    setError('');
    const supportedFormat = getSupportedAudioFormat();
    if (!navigator.mediaDevices?.getUserMedia || !supportedFormat) {
      setError('Voice recording is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = supportedFormat.mimeType
        ? new MediaRecorder(stream, { mimeType: supportedFormat.mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioFormat(supportedFormat);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (e) {
      setError('Microphone permission is needed. Allow mic access in your browser and try again.');
    }
  };

  const stopAndUpload = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    clearInterval(timerRef.current);
    const duration = recordingTime;
    setRecording(false);
    setUploading(true);

    mediaRecorder.onstop = async () => {
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());

      if (duration < 1 || chunksRef.current.length === 0) {
        setUploading(false);
        setError('Hold a little longer to record a voice note.');
        return;
      }

      const format = audioFormat || getSupportedAudioFormat() || { mimeType: 'audio/webm', extension: 'webm' };
      const blob = new Blob(chunksRef.current, { type: format.mimeType || 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, `voice-note.${format.extension}`);
      formData.append('duration', duration);
      formData.append('mimeType', blob.type);

      try {
        const res = await fetch(`${API_BASE}/api/voice/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          await fetchNotes();
        } else {
          const d = await res.json();
          setError(d.error || 'Upload failed');
        }
      } catch (e) {
        setError('Upload failed. Make sure backend is running.');
      } finally {
        setUploading(false);
      }
    };

    mediaRecorder.stop();
  };

  const deleteNote = async (id) => {
    try {
      await fetch(`${API_BASE}/api/voice/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      setError('Delete failed');
    }
  };

  const handleAudioPlay = (id) => {
    // Pause all others
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (key !== id && audio) audio.pause();
    });
    setPlayingId(id);
  };

  const handleAudioPause = () => setPlayingId(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto pb-24 md:pb-0"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-1">Voice Notes 🎙️</h1>
        <p className="text-gray-500">Send each other little voice messages ♡</p>
      </div>

      {/* Recorder Card */}
      <motion.div
        className="glass rounded-3xl p-8 mb-8 text-center shadow-lg"
        animate={recording ? { boxShadow: '0 0 0 4px rgba(251, 113, 133, 0.4)' } : {}}
        transition={{ repeat: recording ? Infinity : 0, repeatType: 'reverse', duration: 0.8 }}
      >
        {/* Waveform animation while recording */}
        {recording && (
          <div className="flex items-center justify-center gap-1 mb-4 h-10">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-blush-400"
                animate={{ height: ['8px', `${20 + Math.random() * 24}px`, '8px'] }}
                transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}

        {!recording && !uploading && (
          <div className="text-5xl mb-3">🎤</div>
        )}

        {uploading && (
          <div className="text-5xl mb-3 animate-bounce">☁️</div>
        )}

        <p className="text-gray-500 mb-6 text-sm">
          {recording
            ? `Recording... ${formatDuration(recordingTime)}`
            : uploading
            ? 'Sending voice note...'
            : 'Hold to record a voice message'}
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {!uploading && (
          <button
            onPointerDown={(event) => {
              event.preventDefault();
              startRecording();
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              stopAndUpload();
            }}
            onPointerCancel={stopAndUpload}
            onPointerLeave={() => {
              if (recording) stopAndUpload();
            }}
            onContextMenu={(e) => {
              e.preventDefault(); // Prevent long-press context menu on mobile
            }}
            disabled={uploading}
            style={{ touchAction: 'none' }} // Prevent scrolling when pressing on mobile
            className={`w-20 h-20 rounded-full text-white text-3xl font-bold shadow-xl mx-auto flex items-center justify-center transition-all duration-200 select-none ${
              recording
                ? 'bg-red-500 scale-110 shadow-red-200'
                : 'bg-gradient-to-br from-blush-400 to-blush-500 hover:scale-105'
            }`}
          >
            {recording ? '⏹' : '🎙️'}
          </button>
        )}

        <p className="text-xs text-gray-400 mt-4">
          {recording ? 'Release to send' : 'Press & hold the button to record'}
        </p>
      </motion.div>

      {/* Voice Notes List */}
      <div className="space-y-4">
        <AnimatePresence>
          {notes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 py-12"
            >
              <p className="text-5xl mb-3">🎧</p>
              <p>No voice notes yet. Record the first one!</p>
            </motion.div>
          )}

          {notes.map((note) => {
            const isMe = getId(note.userId) === getId(user?._id);
            const creatorName = isMe ? 'You' : note.createdBy?.name || 'Partner';
            return (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                  isMe ? 'bg-blush-100' : 'bg-sky-100'
                }`}>
                  {isMe ? '🧑' : '💑'}
                </div>

                {/* Bubble */}
                <div className={`flex-1 rounded-3xl p-4 shadow-sm glass ${
                  isMe
                    ? 'bg-blush-50/80 rounded-tr-sm'
                    : 'bg-sky-50/80 rounded-tl-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blush-500">
                      {creatorName}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(note.createdAt)}</span>
                    {note.duration > 0 && (
                      <span className="text-xs text-gray-400">· {formatDuration(note.duration)}</span>
                    )}
                  </div>

                  <audio
                    ref={(el) => (audioRefs.current[note._id] = el)}
                    src={note.audioUrl}
                    preload="metadata"
                    controls
                    onPlay={() => handleAudioPlay(note._id)}
                    onPause={handleAudioPause}
                    className="w-full h-10 rounded-xl"
                    style={{ accentColor: isMe ? '#f472b6' : '#38bdf8' }}
                  />

                  {isMe && (
                    <button
                      onClick={() => deleteNote(note._id)}
                      className="mt-2 text-xs text-gray-300 hover:text-red-400 transition float-right"
                    >
                      delete
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

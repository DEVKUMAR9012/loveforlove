import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlinePaperAirplane,
  HiOutlinePhotograph,
  HiOutlineTrash,
  HiOutlineEmojiHappy,
} from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const QUICK_LINES = [
  "i love you more than words can say 💕",
  "thinking of you right now 🌸",
  "you make every day better ✨",
  "i miss you so much 🥺",
  "you're my favourite person 💖",
  "good morning my love ☀️",
  "sweet dreams baby 🌙",
  "i'm so lucky to have you 🍀",
  "can't stop smiling because of you 😊",
  "you are my home 🏡",
];

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getId(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuickLines, setShowQuickLines] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);   // array of {file, preview}
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imgUploadProgress, setImgUploadProgress] = useState({ done: 0, total: 0 });

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const pendingFilesRef = useRef([]);
  const token = localStorage.getItem('token');

  const clearPendingFiles = useCallback(() => {
    setPendingFiles((files) => {
      files.forEach(({ preview }) => URL.revokeObjectURL(preview));
      return [];
    });
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollingRef.current);
  }, []);

  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);

  useEffect(() => () => {
    pendingFilesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendText = async (msgText) => {
    const content = (msgText || text).trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: content }),
      });
      if (res.ok) {
        const m = await res.json();
        setMessages((prev) => [...prev, m]);
        setText('');
        setShowQuickLines(false);
      }
    } catch (e) {}
    setSending(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    clearPendingFiles();
    const withPreviews = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPendingFiles(withPreviews);
    setShowCaption(true);
    e.target.value = '';
  };

  const sendImages = async () => {
    if (!pendingFiles.length) return;
    setShowCaption(false);
    setUploadingImages(true);
    setImgUploadProgress({ done: 0, total: pendingFiles.length });

    for (let i = 0; i < pendingFiles.length; i++) {
      const formData = new FormData();
      formData.append('image', pendingFiles[i].file);
      if (caption.trim()) formData.append('caption', caption.trim());
      try {
        const res = await fetch(`${API_BASE}/api/messages/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const m = await res.json();
          setMessages((prev) => [...prev, m]);
        }
      } catch (e) {}
      setImgUploadProgress({ done: i + 1, total: pendingFiles.length });
    }

    clearPendingFiles();
    setCaption('');
    setUploadingImages(false);
    setImgUploadProgress({ done: 0, total: 0 });
  };

  const deleteMsg = async (id) => {
    await fetch(`${API_BASE}/api/messages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  const isMe = (msg) => getId(msg.userId) === getId(user?._id);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">Messages 💌</h1>
        <p className="text-gray-400 text-sm">Your love letters & sweet words</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 py-16"
            >
              <p className="text-5xl mb-3">💌</p>
              <p>No messages yet. Say something sweet!</p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 group ${isMe(msg) ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1 ${
                isMe(msg) ? 'bg-blush-100 text-blush-500' : 'bg-sky-100 text-sky-500'
              }`}>
                {isMe(msg) ? '🧑' : '💑'}
              </div>

              {/* Bubble */}
              <div className={`max-w-xs lg:max-w-sm relative ${isMe(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                {msg.type === 'image' ? (
                  <div className={`rounded-3xl overflow-hidden shadow-md ${isMe(msg) ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    <img
                      src={msg.imageUrl}
                      alt="letter"
                      className="w-64 object-cover cursor-pointer"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                    {msg.text && (
                      <div className={`px-4 py-2 text-sm ${isMe(msg) ? 'bg-blush-100 text-blush-700' : 'bg-sky-50 text-sky-700'}`}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`px-4 py-3 rounded-3xl shadow-sm text-sm leading-relaxed ${
                    isMe(msg)
                      ? 'bg-gradient-to-br from-blush-400 to-blush-500 text-white rounded-br-sm'
                      : 'bg-white/80 text-gray-700 rounded-bl-sm glass'
                  }`}>
                    {msg.text}
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-1 ${isMe(msg) ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-gray-400">{timeLabel(msg.createdAt)}</span>
                  {isMe(msg) && (
                    <button
                      onClick={() => deleteMsg(msg._id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-xs"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Multi-image preview modal */}
      <AnimatePresence>
        {showCaption && pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <div className="glass rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="font-semibold text-gray-700 mb-3 text-center">
                Send {pendingFiles.length} letter{pendingFiles.length > 1 ? 's' : ''} 💌
              </h3>

              {/* Preview grid */}
              <div className={`grid gap-2 mb-4 ${
                pendingFiles.length === 1 ? 'grid-cols-1' :
                pendingFiles.length === 2 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {pendingFiles.map(({ preview }, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={preview}
                      alt={`preview-${idx}`}
                      className="w-full h-28 object-cover rounded-2xl"
                    />
                    <button
                      onClick={() => setPendingFiles((prev) => {
                        const removed = prev[idx];
                        if (removed) URL.revokeObjectURL(removed.preview);
                        return prev.filter((_, i) => i !== idx);
                      })}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="text"
                placeholder="Add a caption to these images... (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl border border-blush-200 focus:outline-none focus:ring-2 focus:ring-blush-300 mb-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCaption(false); clearPendingFiles(); setCaption(''); }}
                  className="flex-1 py-2 rounded-2xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendImages}
                  className="flex-1 py-2 rounded-2xl bg-gradient-to-r from-blush-400 to-blush-500 text-white text-sm font-medium hover:from-blush-500 hover:to-blush-600 transition"
                >
                  Send {pendingFiles.length > 1 ? `${pendingFiles.length} 📸` : '💌'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Lines Panel */}
      <AnimatePresence>
        {showQuickLines && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass rounded-2xl p-3 mb-3 flex-shrink-0"
          >
            <p className="text-xs text-gray-400 mb-2 font-medium px-1">✨ Quick sweet lines</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LINES.map((line) => (
                <button
                  key={line}
                  onClick={() => sendText(line)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white/60 hover:bg-blush-100 text-gray-600 hover:text-blush-600 transition border border-white/80"
                >
                  {line}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="flex-shrink-0 pt-2">
      {uploading || uploadingImages ? (
          <p className="text-center text-xs text-blush-400 mb-2 animate-pulse">
            {uploadingImages
              ? `Uploading ${imgUploadProgress.done}/${imgUploadProgress.total} letters... ☁️`
              : 'Uploading to cloud... ☁️'}
          </p>
        ) : null}
        <div className="flex items-center gap-2 glass rounded-3xl px-3 py-2 shadow-sm">
          {/* Emoji / Quick Lines */}
          <button
            onClick={() => setShowQuickLines((v) => !v)}
            title="Sweet quick lines"
            className={`p-2 rounded-xl transition text-xl ${showQuickLines ? 'text-blush-500 bg-blush-50' : 'text-gray-400 hover:text-blush-400'}`}
          >
            <HiOutlineEmojiHappy />
          </button>

          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current.click()}
            title="Send a letter/photo"
            className="p-2 rounded-xl text-gray-400 hover:text-sky-500 transition text-xl"
          >
            <HiOutlinePhotograph />
          </button>
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
            placeholder="Write something sweet... 💕"
            className="flex-1 bg-transparent focus:outline-none text-gray-700 text-sm placeholder-gray-300"
          />

          {/* Send button */}
          <button
            onClick={() => sendText()}
            disabled={sending || !text.trim()}
            className={`p-2 rounded-xl transition text-xl ${
              text.trim() ? 'text-blush-500 hover:text-blush-600' : 'text-gray-200'
            }`}
          >
            <HiOutlinePaperAirplane className="rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

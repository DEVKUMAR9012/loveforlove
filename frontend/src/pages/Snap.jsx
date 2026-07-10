import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCamera,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineArrowLeft,
  HiOutlineUpload,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DB_NAME = 'loveforlove-local-snaps';
const STORE_NAME = 'snaps';
const DB_VERSION = 1;
const PARTNER_EMAIL_KEY = 'loveforlove-partner-email';

function openSnapDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readLocalSnaps() {
  const db = await openSnapDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

async function saveLocalSnap(snap) {
  const db = await openSnapDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(snap);
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

async function deleteLocalSnap(id) {
  const db = await openSnapDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i);
  return new File([buffer], filename, { type: mime });
}

function Snap() {
  const { backendUrl } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const [permissionState, setPermissionState] = useState('idle');
  const [facingMode, setFacingMode] = useState('user');
  const [snaps, setSnaps] = useState([]);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [partnerEmail, setPartnerEmail] = useState(() => localStorage.getItem(PARTNER_EMAIL_KEY) || '');
  const [inboxSnaps, setInboxSnaps] = useState([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('Ready');
  const [error, setError] = useState('');
  
  // UI states for modals
  const [showMemories, setShowMemories] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const canUseCamera = useMemo(
    () => Boolean(navigator.mediaDevices?.getUserMedia && window.indexedDB),
    []
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const loadSnaps = useCallback(async () => {
    try {
      setSnaps(await readLocalSnaps());
    } catch (err) {
      console.error('Failed to load local snaps:', err);
      setError('Local snap storage is unavailable in this browser.');
    }
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/snaps/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      setInboxSnaps(data);
      const unread = data.filter((snap) => !snap.openedAt).length;
      if (unread > 0) setNotice(`${unread} new snap${unread === 1 ? '' : 's'}`);
    } catch {
      // Inbox polling should never break the camera.
    }
  }, [backendUrl]);

  useEffect(() => {
    loadSnaps();
    loadInbox();
    const timer = setInterval(loadInbox, 30000);
    return () => {
      clearInterval(timer);
      clearTimeout(toastTimerRef.current);
      stopCamera();
    };
  }, [loadInbox, loadSnaps, stopCamera]);

  // Global Notification Bar Effect
  const [showToast, setShowToast] = useState(false);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    try {
      await Notification.requestPermission();
    } catch {
      // Some browsers reject notification prompts outside trusted user gestures.
    }
  }, []);
  
  const pushNotice = useCallback((message) => {
    setNotice(message);
    setShowToast(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('loveforlove', { body: message });
      } catch {
        // The in-app toast has already shown the message.
      }
    }
  }, []);

  const startCamera = async (mode = facingMode) => {
    setError('');
    if (!canUseCamera) {
      setError('Camera or local storage is not available in this browser.');
      return;
    }

    try {
      setPermissionState('requesting');
      await requestNotificationPermission();
      pushNotice('Opening camera');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: mode,
          width: { ideal: 1440 },
          height: { ideal: 1440 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFacingMode(mode);
      setPermissionState('granted');
      pushNotice('Camera live');
    } catch (err) {
      setPermissionState('denied');
      setError('Allow camera access from the browser prompt, then tap the camera button again.');
      pushNotice('Camera blocked');
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      pushNotice('Photo uploaded from gallery');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const captureSnap = () => {
    if (permissionState !== 'granted') {
      startCamera();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      pushNotice('Camera warming up');
      return;
    }

    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/jpeg', 0.88));
    pushNotice('Snap captured');
  };

  const createSnap = async () => {
    if (!preview) return null;

    const snap = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      image: preview,
      caption: caption.trim(),
      createdAt: Date.now(),
    };

    await saveLocalSnap(snap);
    setSnaps((prev) => [snap, ...prev]);
    setPreview(null);
    setCaption('');
    return snap;
  };

  const saveSnap = async () => {
    try {
      await createSnap();
      pushNotice('Saved on this device');
    } catch (err) {
      setError('Could not save this snap locally. Your browser storage may be full.');
    }
  };

  const deleteSnap = async (id) => {
    try {
      await deleteLocalSnap(id);
      setSnaps((prev) => prev.filter((snap) => snap.id !== id));
      pushNotice('Snap deleted');
    } catch {
      setError('Could not delete this snap from local storage.');
    }
  };

  const shareSnap = async (snap) => {
    try {
      const file = dataUrlToFile(snap.image, `snap-${snap.id}.jpg`);
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: 'loveforlove snap',
          text: snap.caption || 'A snap for you',
          files: [file],
        });
        pushNotice('Choose Mail or chat to send');
        return;
      }

      const link = document.createElement('a');
      link.href = snap.image;
      link.download = `snap-${snap.id}.jpg`;
      link.click();
      pushNotice('Snap downloaded');
    } catch (err) {
      pushNotice('Share cancelled');
    }
  };

  const mailSnap = async (snap) => {
    localStorage.setItem(PARTNER_EMAIL_KEY, partnerEmail.trim());
    const file = dataUrlToFile(snap.image, `snap-${snap.id}.jpg`);

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await shareSnap(snap);
      return;
    }

    const to = encodeURIComponent(partnerEmail.trim());
    const subject = encodeURIComponent('A snap for you');
    const body = encodeURIComponent('I made a snap for you. The photo was saved/downloaded from this device.');
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    pushNotice('Mail opened');
  };

  const sendSnapToPartner = async (snap) => {
    const file = dataUrlToFile(snap.image, `snap-${snap.id}.jpg`);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('snap', file);
    formData.append('caption', snap.caption || '');

    const res = await fetch(`${backendUrl}/api/snaps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not send snap');
    return data;
  };

  const sendPreviewSnap = async () => {
    if (sending) return;
    setSending(true);
    setError('');

    try {
      const snap = await createSnap();
      if (!snap) return;

      const result = await sendSnapToPartner(snap);
      await loadInbox();

      if (result.email?.sent) {
        pushNotice('Snap sent + email delivered');
      } else {
        pushNotice('Snap sent in app');
      }
    } catch (err) {
      setError(err.message || 'Could not send snap.');
    } finally {
      setSending(false);
    }
  };

  const openInboxSnap = async (snap) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${backendUrl}/api/snaps/${snap._id}/open`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setInboxSnaps((prev) =>
        prev.map((item) => (item._id === snap._id ? { ...item, openedAt: new Date().toISOString() } : item))
      );
      window.open(snap.imageUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(snap.imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden flex flex-col">
      {/* Global Notification Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-4 right-4 z-[60] flex justify-center pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-md text-black px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-3 pointer-events-auto">
              <span className="text-xl">✨</span>
              {notice}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Top Controls Overlay */}
        <div className="absolute top-6 left-4 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white shadow-xl backdrop-blur-md hover:bg-black/60"
          >
            <HiOutlineArrowLeft className="text-2xl" />
          </button>
        </div>

        <div className="absolute top-6 right-4 z-10 flex flex-col gap-4">
          <button
            onClick={switchCamera}
            disabled={permissionState !== 'granted'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white shadow-xl backdrop-blur-md hover:bg-black/60 disabled:opacity-40"
          >
            <HiOutlineRefresh className="text-2xl" />
          </button>
        </div>

        {error && (
          <div className="absolute left-4 right-4 top-24 z-10 rounded-2xl bg-rose-500/90 px-4 py-3 text-sm font-semibold shadow-lg text-white">
            {error}
          </div>
        )}

        {/* Bottom Capture Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-10 flex items-center justify-center gap-6 px-4">
          <button
            onClick={() => setShowMemories(true)}
            title="Memories"
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/40 text-white shadow-xl backdrop-blur-md hover:bg-black/60"
          >
            <HiOutlinePhotograph className="text-2xl" />
            {snaps.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-black border-2 border-black">
                {snaps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Gallery"
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/40 text-white shadow-xl backdrop-blur-md hover:bg-black/60"
          >
            <HiOutlineUpload className="text-2xl" />
          </button>

          {/* Large Capture Button */}
          <button
            onClick={captureSnap}
            className="h-[5rem] w-[5rem] shrink-0 rounded-full border-[5px] border-white bg-transparent shadow-[0_0_15px_rgba(0,0,0,0.5)] transition hover:scale-105 active:scale-95"
          />

          <button
            onClick={() => setShowInbox(true)}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/40 text-white shadow-xl backdrop-blur-md hover:bg-black/60"
          >
            <HiOutlineMail className="text-2xl" />
            {inboxSnaps.filter(s => !s.openedAt).length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white border-2 border-black">
                {inboxSnaps.filter(s => !s.openedAt).length}
              </span>
            )}
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Cute Permission Modal */}
        <AnimatePresence>
          {permissionState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            >
              <div className="bg-[#1a1a24] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-2xl font-bold text-white mb-3">Snap Access</h3>
                <p className="text-white/70 mb-8">
                  Can we use your camera to take cute snaps? You can also upload photos from your gallery! 🥺
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => startCamera()}
                    className="w-full bg-yellow-300 text-black font-bold py-4 rounded-2xl text-lg hover:bg-yellow-400 transition active:scale-95"
                  >
                    Yes, allow! 💛
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl text-lg hover:bg-white/20 transition active:scale-95"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Snap Preview Overlay */}
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <img src={preview} alt="Snap preview" className="h-full w-full object-contain" />

            <button
              onClick={() => setPreview(null)}
              title="Close"
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-black/50 p-3 text-white backdrop-blur hover:bg-black/70"
            >
              <HiOutlineX className="text-2xl" />
            </button>

            <div className="absolute left-4 right-4 top-5 mx-auto max-w-md">
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={80}
                className="w-full rounded-full border border-white/20 bg-black/40 px-5 py-3 text-center text-white outline-none backdrop-blur placeholder:text-white/60 focus:border-yellow-300"
                placeholder="Add caption"
              />
            </div>

            <div className="absolute bottom-6 left-4 right-4 mx-auto grid max-w-md grid-cols-3 gap-3">
              <button
                onClick={() => setPreview(null)}
                className="rounded-full bg-white/15 px-4 py-3 font-bold text-white backdrop-blur hover:bg-white/25"
              >
                Retake
              </button>
              <button
                onClick={saveSnap}
                className="rounded-full bg-white px-4 py-3 font-bold text-black hover:bg-yellow-100"
              >
                Save
              </button>
              <button
                onClick={sendPreviewSnap}
                disabled={sending}
                className="rounded-full bg-yellow-300 px-4 py-3 font-bold text-black hover:bg-yellow-200 disabled:opacity-60"
              >
                {sending ? 'Sending' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}

      {/* Memories Modal */}
      <AnimatePresence>
        {showMemories && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#101014] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#101014]/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/10 z-10">
              <h2 className="text-xl font-bold text-white">Saved Memories</h2>
              <button onClick={() => setShowMemories(false)} className="p-2 bg-white/10 rounded-full text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="p-4">
              {snaps.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center text-white/45 mt-10">
                  <HiOutlineCamera className="mx-auto mb-3 text-5xl" />
                  <p className="text-lg font-semibold">No snaps saved yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {snaps.map((snap) => (
                    <div key={snap.id} className="group relative overflow-hidden rounded-3xl bg-white/10 shadow-lg">
                      <img src={snap.image} alt={snap.caption || 'Saved snap'} className="aspect-[9/16] w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                        <p className="truncate text-sm font-bold text-white">{snap.caption || 'Snap'}</p>
                        <div className="mt-3 flex gap-2 justify-between">
                          <button onClick={() => mailSnap(snap)} className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-yellow-300 hover:text-black flex-1 flex justify-center"><HiOutlineMail /></button>
                          <button onClick={() => shareSnap(snap)} className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30 flex-1 flex justify-center">{navigator.share ? <HiOutlineShare /> : <HiOutlineDownload />}</button>
                          <button onClick={() => deleteSnap(snap.id)} className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-rose-500 flex-1 flex justify-center"><HiOutlineTrash /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inbox Modal */}
      <AnimatePresence>
        {showInbox && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#101014] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#101014]/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/10 z-10">
              <h2 className="text-xl font-bold text-white">Inbox</h2>
              <button onClick={() => setShowInbox(false)} className="p-2 bg-white/10 rounded-full text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-6 rounded-3xl bg-white/5 p-5 border border-white/10">
                <p className="text-sm text-white/60 mb-2">Partner's Email (for manual sending)</p>
                <input
                  value={partnerEmail}
                  onChange={(event) => {
                    setPartnerEmail(event.target.value);
                    localStorage.setItem(PARTNER_EMAIL_KEY, event.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-300 transition"
                  placeholder="partner@email.com"
                  type="email"
                />
              </div>

              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/40 mb-4">Received Snaps</h3>
              
              {inboxSnaps.length === 0 ? (
                <div className="text-center text-white/30 py-10">
                  <p>Inbox is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inboxSnaps.map((snap) => (
                    <button
                      key={snap._id}
                      onClick={() => openInboxSnap(snap)}
                      className={`flex w-full items-center gap-4 rounded-3xl border p-3 text-left transition ${
                        snap.openedAt
                          ? 'border-white/5 bg-white/5 text-white/50'
                          : 'border-yellow-300/40 bg-yellow-300/10 text-white hover:bg-yellow-300/20'
                      }`}
                    >
                      <div className="relative">
                        <img src={snap.imageUrl} alt="Incoming snap" className="h-16 w-16 rounded-2xl object-cover" />
                        {!snap.openedAt && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-rose-500 border-2 border-[#101014]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold">{snap.sender?.name || 'Partner'}</p>
                        <p className="truncate text-sm text-white/60 mt-1">{snap.caption || 'Tap to view snap'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Snap;

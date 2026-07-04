import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineCamera,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
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

  const canUseCamera = useMemo(
    () => Boolean(navigator.mediaDevices?.getUserMedia && window.indexedDB),
    []
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const pushNotice = useCallback((message) => {
    setNotice(message);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('loveforlove', { body: message });
    }
  }, []);

  const loadSnaps = useCallback(async () => {
    try {
      setSnaps(await readLocalSnaps());
    } catch (err) {
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
      stopCamera();
    };
  }, [loadInbox, loadSnaps, stopCamera]);

  useEffect(() => {
    return stopCamera;
  }, [stopCamera]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      pushNotice('Notifications are not available here');
      return;
    }

    const result = await Notification.requestPermission();
    pushNotice(result === 'granted' ? 'Notifications on' : 'Notifications off');
  };

  const startCamera = async (mode = facingMode) => {
    setError('');
    if (!canUseCamera) {
      setError('Camera or local storage is not available in this browser.');
      return;
    }

    try {
      setPermissionState('requesting');
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
    await deleteLocalSnap(id);
    setSnaps((prev) => prev.filter((snap) => snap.id !== id));
    pushNotice('Snap deleted');
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto -m-4 md:-m-8 min-h-[calc(100vh-5rem)] overflow-hidden bg-[#050507] pb-24 text-white md:pb-0"
    >
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {permissionState !== 'granted' && (
            <button
              onClick={() => startCamera()}
              aria-label="Open camera"
              className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#232334_0%,#060607_70%)]"
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-white/10 text-white shadow-2xl backdrop-blur">
                <HiOutlineCamera className="text-5xl" />
              </span>
            </button>
          )}

          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3">
            <button
              onClick={requestNotifications}
              className="flex max-w-[72%] items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur"
            >
              <HiOutlineBell className="text-lg text-yellow-300" />
              <span className="truncate">{notice}</span>
            </button>

            <button
              onClick={() => startCamera()}
              aria-label="Open camera"
              title="Open camera"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur hover:bg-black/60"
            >
              <HiOutlineCamera className="text-2xl" />
            </button>
          </div>

          {error && (
            <div className="absolute left-4 right-4 top-20 z-10 rounded-2xl bg-rose-500/90 px-4 py-3 text-sm font-semibold shadow-lg">
              {error}
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-6 px-5">
            <button
              onClick={switchCamera}
              disabled={permissionState !== 'granted'}
              title="Switch camera"
              aria-label="Switch camera"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white shadow-xl backdrop-blur hover:bg-black/60 disabled:opacity-40"
            >
              <HiOutlineRefresh className="text-2xl" />
            </button>

            <button
              onClick={captureSnap}
              title="Take snap"
              aria-label="Take snap"
              className="h-24 w-24 rounded-full border-[6px] border-white bg-white/25 shadow-2xl backdrop-blur transition hover:scale-105 active:scale-95"
            />

            <button
              onClick={() => pushNotice(`${snaps.length} saved`)}
              title="Saved snaps"
              aria-label="Saved snaps"
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white shadow-xl backdrop-blur hover:bg-black/60"
            >
              <HiOutlinePhotograph className="text-2xl" />
              {snaps.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-300 px-1 text-xs font-bold text-black">
                  {snaps.length}
                </span>
              )}
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </section>

        <aside className="border-l border-white/10 bg-[#101014] p-4 shadow-2xl">
          <div className="mb-4 rounded-3xl bg-white/8 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Notifications</p>
                <h2 className="text-xl font-bold">Inbox</h2>
              </div>
              <span className="rounded-full bg-yellow-300 px-2 py-1 text-xs font-bold text-black">
                {inboxSnaps.filter((snap) => !snap.openedAt).length}
              </span>
            </div>
            <input
              value={partnerEmail}
              onChange={(event) => {
                setPartnerEmail(event.target.value);
                localStorage.setItem(PARTNER_EMAIL_KEY, event.target.value);
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-300"
              placeholder="partner@email.com"
              type="email"
            />
          </div>

          {inboxSnaps.length > 0 && (
            <div className="mb-4 space-y-2">
              {inboxSnaps.slice(0, 3).map((snap) => (
                <button
                  key={snap._id}
                  onClick={() => openInboxSnap(snap)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left ${
                    snap.openedAt
                      ? 'border-white/10 bg-white/5 text-white/55'
                      : 'border-yellow-300/40 bg-yellow-300/15 text-white'
                  }`}
                >
                  <img src={snap.imageUrl} alt="Incoming snap" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{snap.sender?.name || 'Partner'}</p>
                    <p className="truncate text-xs text-white/45">{snap.caption || 'Sent a snap'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {snaps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-white/45">
              <HiOutlineCamera className="mx-auto mb-3 text-4xl" />
              <p className="text-sm font-semibold">No snaps yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {snaps.map((snap) => (
                <div key={snap.id} className="group relative overflow-hidden rounded-3xl bg-white/10 shadow-lg">
                  <img src={snap.image} alt={snap.caption || 'Saved snap'} className="aspect-[9/12] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                    <p className="truncate text-xs font-bold text-white">{snap.caption || 'Snap'}</p>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => mailSnap(snap)}
                        title="Send"
                        aria-label="Send"
                        className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-yellow-300 hover:text-black"
                      >
                        <HiOutlineMail />
                      </button>
                      <button
                        onClick={() => shareSnap(snap)}
                        title="Share"
                        aria-label="Share"
                        className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
                      >
                        {navigator.share ? <HiOutlineShare /> : <HiOutlineDownload />}
                      </button>
                      <button
                        onClick={() => deleteSnap(snap.id)}
                        title="Delete"
                        aria-label="Delete"
                        className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-rose-500"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <AnimatePresence>
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
      </AnimatePresence>
    </motion.div>
  );
}

export default Snap;

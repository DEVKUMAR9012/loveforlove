import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCamera,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineShare,
  HiOutlineSparkles,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';

const DB_NAME = 'loveforlove-local-snaps';
const STORE_NAME = 'snaps';
const DB_VERSION = 1;

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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [permissionState, setPermissionState] = useState('idle');
  const [facingMode, setFacingMode] = useState('user');
  const [snaps, setSnaps] = useState([]);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
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

  const loadSnaps = useCallback(async () => {
    try {
      setSnaps(await readLocalSnaps());
    } catch (err) {
      setError('Local snap storage is unavailable in this browser.');
    }
  }, []);

  useEffect(() => {
    loadSnaps();
    return stopCamera;
  }, [loadSnaps, stopCamera]);

  const startCamera = async (mode = facingMode) => {
    setError('');
    if (!canUseCamera) {
      setError('This browser cannot open the camera or local storage.');
      return;
    }

    try {
      setPermissionState('requesting');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFacingMode(mode);
      setPermissionState('granted');
    } catch (err) {
      setPermissionState('denied');
      setError('Camera permission is needed to take a snap. Allow camera access and try again.');
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const captureSnap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      setError('Camera is still warming up. Try again in a second.');
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
    setPreview(canvas.toDataURL('image/jpeg', 0.86));
  };

  const saveSnap = async () => {
    if (!preview) return;

    const snap = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      image: preview,
      caption: caption.trim(),
      createdAt: Date.now(),
    };

    try {
      await saveLocalSnap(snap);
      setSnaps((prev) => [snap, ...prev]);
      setPreview(null);
      setCaption('');
    } catch (err) {
      setError('Could not save this snap locally. Your browser storage may be full.');
    }
  };

  const deleteSnap = async (id) => {
    await deleteLocalSnap(id);
    setSnaps((prev) => prev.filter((snap) => snap.id !== id));
  };

  const shareSnap = async (snap) => {
    try {
      const file = dataUrlToFile(snap.image, `snap-${snap.id}.jpg`);
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: 'Our snap',
          text: snap.caption || 'A local snap from us',
          files: [file],
        });
        return;
      }

      const link = document.createElement('a');
      link.href = snap.image;
      link.download = `snap-${snap.id}.jpg`;
      link.click();
    } catch (err) {
      setError('Sharing was cancelled or is not supported on this device.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pb-24 md:pb-0 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
              <HiOutlineCamera className="text-2xl" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Local snaps</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Snap together</h1>
            </div>
          </div>
          <p className="text-gray-500">Real camera selfies saved only on this device. Nothing uploads to our cloud.</p>
        </div>

        <button
          onClick={() => startCamera()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-500 text-white font-semibold hover:bg-violet-600 shadow-sm"
        >
          <HiOutlineCamera className="text-xl" />
          {permissionState === 'granted' ? 'Restart camera' : 'Allow camera'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="glass p-4 md:p-6 shadow-sm">
          <div className="relative mx-auto aspect-square max-w-xl overflow-hidden rounded-[2rem] bg-gray-900 shadow-xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {permissionState !== 'granted' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-950 to-gray-950 p-8 text-center text-white">
                <HiOutlineSparkles className="mb-4 text-5xl text-violet-200" />
                <h2 className="text-2xl font-bold">Camera permission first</h2>
                <p className="mt-2 text-sm text-white/70">
                  Your browser will ask before the camera turns on. Snaps stay local on this device.
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent p-5">
              <button
                onClick={switchCamera}
                disabled={permissionState !== 'granted'}
                title="Switch camera"
                aria-label="Switch camera"
                className="h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 disabled:opacity-40 flex items-center justify-center"
              >
                <HiOutlineRefresh className="text-2xl" />
              </button>
              <button
                onClick={captureSnap}
                disabled={permissionState !== 'granted'}
                title="Take snap"
                aria-label="Take snap"
                className="h-20 w-20 rounded-full border-4 border-white bg-white/30 shadow-2xl backdrop-blur hover:scale-105 disabled:opacity-40"
              />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </section>

        <aside className="glass p-5 shadow-sm h-fit">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Device album</p>
            <h2 className="text-2xl font-bold text-gray-800">Saved snaps</h2>
          </div>

          {snaps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center">
              <HiOutlineCamera className="mx-auto mb-3 text-4xl text-gray-300" />
              <p className="font-bold text-gray-700">No local snaps yet</p>
              <p className="text-sm text-gray-400 mt-1">Take a selfie and save it on this phone or laptop.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {snaps.map((snap) => (
                <div key={snap.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm">
                  <img src={snap.image} alt={snap.caption || 'Saved snap'} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="truncate text-xs font-semibold text-white">{snap.caption || 'Local snap'}</p>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => shareSnap(snap)}
                        title="Share or download"
                        aria-label="Share or download"
                        className="rounded-lg bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
                      >
                        {navigator.share ? <HiOutlineShare /> : <HiOutlineDownload />}
                      </button>
                      <button
                        onClick={() => deleteSnap(snap.id)}
                        title="Delete local snap"
                        aria-label="Delete local snap"
                        className="rounded-lg bg-white/20 p-2 text-white backdrop-blur hover:bg-rose-500"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 18 }}
              className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="relative">
                <img src={preview} alt="Snap preview" className="aspect-square w-full object-cover" />
                <button
                  onClick={() => setPreview(null)}
                  title="Close preview"
                  aria-label="Close preview"
                  className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
                >
                  <HiOutlineX className="text-xl" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <input
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={80}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="Add a caption..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPreview(null)}
                    className="rounded-2xl bg-gray-100 px-4 py-3 font-semibold text-gray-600 hover:bg-gray-200"
                  >
                    Retake
                  </button>
                  <button
                    onClick={saveSnap}
                    className="rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white hover:bg-violet-600"
                  >
                    Save locally
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Snap;

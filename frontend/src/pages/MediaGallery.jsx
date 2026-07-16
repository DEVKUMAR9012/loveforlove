import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineCloudUpload, HiOutlineX, HiOutlinePhotograph, HiOutlineExclamationCircle } from 'react-icons/hi';

// ---------------------------------------------------------------------------
// Design notes (so future-you remembers the intent):
// This isn't a generic masonry grid. Every photo behaves like it's tucked
// into a physical album page — a slight resting rotation, torn-edge corner
// tape on hover, and a lightbox caption panel that feels like a note on
// the back of a printed photo.
// Palette: near-black aubergine bg, warm sand/gold accents (old photo paper),
// muted mauve for secondary text. Serif display for anything that reads like
// a handwritten caption; sans for UI chrome.
//
// PERF NOTE: the background used to be a full animated nebula (multiple
// blurred layers + rotating spiral + shooting stars) which was expensive to
// paint on low-end/mobile devices and delayed first render. Replaced with a
// single static gradient + a lightweight twinkling star layer (no blur
// filters, no continuous transform animation) so it's cheap on any device
// and paints instantly.
// ---------------------------------------------------------------------------

const ROTATIONS = [-2.5, 1.5, -1, 2, -1.5, 1, -2, 0.5];

function MediaGallery() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [editingCaption, setEditingCaption] = useState('');
  const [captionSaving, setCaptionSaving] = useState(false);
  const [captionSaved, setCaptionSaved] = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/memories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      const formatted = data
        .filter((m) => m.imageUrl)
        .map((m, i) => ({
          id: m._id,
          src: m.imageUrl,
          caption: m.caption || '',
          date: m.createdAt ? new Date(m.createdAt) : null,
          rotation: ROTATIONS[i % ROTATIONS.length],
        }))
        .reverse();
      setImages(formatted);
    } catch (err) {
      console.error('Failed to fetch memories. Is backend running?', err);
      setLoadError("Couldn't load your memories. Check that the server is running and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    const token = localStorage.getItem('token');
    const newImages = [];
    let failures = 0;

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        const res = await fetch(`${API_BASE}/api/memories/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload responded ${res.status}`);
        const saved = await res.json();
        newImages.push({
          id: saved._id,
          src: saved.imageUrl,
          caption: saved.caption || '',
          date: saved.createdAt ? new Date(saved.createdAt) : new Date(),
          rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
        });
      } catch (err) {
        failures += 1;
        console.error('Upload failed for file:', files[i].name, err);
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    setImages((prev) => [...newImages.reverse(), ...prev]);
    setIsUploading(false);
    setUploadProgress({ done: 0, total: 0 });
    if (failures > 0) {
      setLoadError(`${failures} of ${files.length} photo${files.length > 1 ? 's' : ''} didn't upload. Try those again.`);
    }
  };

  const handleImageUpload = (event) => {
    uploadFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    if (event.dataTransfer.files?.length) uploadFiles(event.dataTransfer.files);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    dragCounter.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDraggingOver(false);
  };

  const openLightbox = (img) => {
    setActiveImage(img);
    setEditingCaption(img.caption || '');
    setCaptionSaved(false);
  };

  const closeLightbox = () => setActiveImage(null);

  const saveCaption = async () => {
    if (!activeImage || activeImage.caption === editingCaption) return;

    const targetId = activeImage.id;       // snapshot — never use activeImage.id after await
    const previousCaption = activeImage.caption;
    const optimisticCaption = editingCaption;

    // Optimistic: update UI instantly before server responds
    setCaptionSaving(true);
    setImages((prev) =>
      prev.map((img) => (img.id === targetId ? { ...img, caption: optimisticCaption } : img))
    );
    setActiveImage((prev) =>
      prev && prev.id === targetId ? { ...prev, caption: optimisticCaption } : prev
    );

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/memories/${targetId}/caption`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: optimisticCaption }),
      });
      if (!res.ok) throw new Error('Server failed');
      setCaptionSaved(true);
      setTimeout(() => setCaptionSaved(false), 2000);
    } catch (e) {
      // Rollback if server failed
      setImages((prev) =>
        prev.map((img) => (img.id === targetId ? { ...img, caption: previousCaption } : img))
      );
      setActiveImage((prev) =>
        prev && prev.id === targetId ? { ...prev, caption: previousCaption } : prev
      );
      setEditingCaption(previousCaption);
      setLoadError("Couldn't save caption. Reverted.");
      setTimeout(() => setLoadError(null), 4000);
    } finally {
      setCaptionSaving(false);
    }
  };

  const formatDate = (date) =>
    date
      ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Undated';

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 90% 70% at 50% 0%, #241A2E 0%, #170F22 45%, #0A0710 100%)',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Lightweight starfield — a single flat layer of tiny dots with one
          cheap opacity-only twinkle animation (no blur, no transform, no
          continuous rotation). This paints instantly on any device and
          costs almost nothing on the main thread, unlike the old
          multi-layer blurred nebula + spinning spiral + shooting stars. */}
      <div className="mg-sky" aria-hidden="true" />
      <span className="mg-vignette" aria-hidden="true" />

      <style>{`
        .mg-sky {
          position: absolute;
          inset: -10%;
          z-index: 0;
          pointer-events: none;
          background-repeat: repeat;
          background-image:
            radial-gradient(1.5px 1.5px at 8% 15%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 23% 42%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 39% 9%, #E8B7CC 100%, transparent),
            radial-gradient(1.5px 1.5px at 55% 33%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 71% 58%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 88% 18%, #E8B7CC 100%, transparent),
            radial-gradient(1.5px 1.5px at 16% 70%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 34% 85%, #C9A876 100%, transparent),
            radial-gradient(1.5px 1.5px at 60% 92%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 82% 80%, #F4ECE3 100%, transparent);
          background-size: 320px 320px;
          opacity: 0.5;
          /* Single, cheap opacity-only animation. No blur/transform means
             the browser never has to repaint layout — just a compositor
             opacity fade, which is essentially free even on old phones. */
          animation: mgTwinkle 6s ease-in-out infinite;
        }
        @keyframes mgTwinkle {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.65; }
        }

        /* ── Vignette — kept because it's a single static gradient (no
             animation, no blur layer of its own) and still gives the page
             depth so content stays the focal point. ── */
        .mg-vignette {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 90% 80% at 50% 30%, transparent 40%, rgba(5, 4, 9, 0.55) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .mg-sky {
            animation: none !important;
            opacity: 0.45;
          }
        }
      `}</style>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-6 mb-12">
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] mb-2"
              style={{ color: '#6B5B73', fontFamily: 'Inter, sans-serif' }}
            >
              Our keepsake
            </p>
            <h1
              className="text-5xl mb-2"
              style={{ color: '#F4ECE3', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Our gallery
            </h1>
            <p style={{ color: '#9C8C9E', fontFamily: 'Inter, sans-serif' }}>
              {images.length > 0
                ? `${images.length} memor${images.length === 1 ? 'y' : 'ies'} kept safe, in order.`
                : 'Every picture tells a story of us.'}
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 font-medium rounded-xl"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: isUploading ? '#3A3340' : '#C9A876',
              color: isUploading ? '#9C8C9E' : '#1A1622',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            <HiOutlineCloudUpload className="text-xl" />
            {isUploading ? `Uploading ${uploadProgress.done}/${uploadProgress.total}` : 'Add memories'}
          </button>
        </div>

        {/* Error banner */}
        {loadError && (
          <div
            className="flex items-center justify-between gap-4 mb-8 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(214, 92, 92, 0.1)', border: '1px solid rgba(214, 92, 92, 0.3)' }}
          >
            <div className="flex items-center gap-2">
              <HiOutlineExclamationCircle style={{ color: '#E08A8A' }} className="text-lg shrink-0" />
              <span style={{ color: '#E0B8B8', fontFamily: 'Inter, sans-serif' }} className="text-sm">
                {loadError}
              </span>
            </div>
            <button
              onClick={() => {
                setLoadError(null);
                fetchMemories();
              }}
              className="text-sm shrink-0 underline"
              style={{ color: '#E0B8B8', fontFamily: 'Inter, sans-serif' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full mb-6 rounded-sm break-inside-avoid animate-pulse"
                style={{ height: 220 + (i % 3) * 60, background: '#1A1622' }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && images.length === 0 && !loadError && (
          <div
            className="flex flex-col items-center justify-center text-center py-24 rounded-2xl border-2 border-dashed"
            style={{ borderColor: '#3A3340' }}
          >
            <HiOutlinePhotograph style={{ color: '#6B5B73' }} className="text-5xl mb-4" />
            <p
              className="text-xl mb-2"
              style={{ color: '#F4ECE3', fontFamily: "'Fraunces', serif" }}
            >
              The album is empty, for now
            </p>
            <p style={{ color: '#9C8C9E', fontFamily: 'Inter, sans-serif' }} className="mb-6 max-w-sm">
              Drag photos in, or use the button above to add your first memory together.
            </p>
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#C9A876', color: '#1A1622', fontFamily: 'Inter, sans-serif' }}
            >
              Add your first photo
            </button>
          </div>
        )}

        {/* Gallery grid */}
        {!isLoading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => openLightbox(img)}
                className="block w-full text-left group relative"
              >
                <div
                  className="p-3 pb-10 rounded-sm relative"
                  style={{ background: '#F4ECE3', boxShadow: '0 8px 20px rgba(0,0,0,0.35)' }}
                >
                  <div className="overflow-hidden rounded-[2px]" style={{ background: '#1A1622' }}>
                    <img
                      src={img.src}
                      alt={img.caption || 'A keepsake memory'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Tape corners, appear on hover */}

                  {/* Caption strip, like a handwritten note under a polaroid */}
                  <p
                    className="absolute bottom-2.5 left-3 right-3 truncate text-sm"
                    style={{ color: '#3A332E', fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                  >
                    {formatDate(img.date)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Drag-over overlay */}
        {isDraggingOver && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(13, 11, 20, 0.85)' }}
          >
            <div
              className="px-10 py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3"
              style={{ borderColor: '#C9A876' }}
            >
              <HiOutlineCloudUpload style={{ color: '#C9A876' }} className="text-4xl" />
              <p style={{ color: '#F4ECE3', fontFamily: "'Fraunces', serif" }} className="text-lg">
                Drop to keep these memories
              </p>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {activeImage && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: 'rgba(7, 6, 11, 0.92)' }}
            onClick={closeLightbox}
          >
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">

              <button
                onClick={closeLightbox}
                aria-label="Close"
                className="fixed top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full z-50 transition-colors hover:bg-white/20"
                style={{ color: '#F4ECE3', background: 'rgba(255,255,255,0.08)' }}
              >
                <HiOutlineX className="text-2xl" />
              </button>

              <div className="relative w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
                <div
                  className="p-3 sm:p-4 rounded-sm"
                  style={{
                    background: '#F4ECE3',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  }}
                >
                  <img
                    src={activeImage.srcFull || activeImage.src}
                    alt={activeImage.caption || 'A keepsake memory'}
                    className="w-full object-contain rounded-[2px]"
                    style={{ maxHeight: 'calc(100vh - 12rem)' }}
                  />
                </div>

                <div
                  className="mt-4 p-4 rounded-sm"
                  style={{ background: '#EDE3D3', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)' }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.2em] mb-4"
                    style={{ color: '#A89678', fontFamily: 'Inter, sans-serif' }}
                  >
                    {formatDate(activeImage.date)}
                  </p>

                  <textarea
                    value={editingCaption}
                    onChange={(e) => { setEditingCaption(e.target.value); setCaptionSaved(false); }}
                    placeholder="Write something about this memory..."
                    rows={4}
                    className="w-full resize-none bg-transparent focus:outline-none"
                    style={{
                      color: '#3A332E',
                      fontFamily: "'Fraunces', serif",
                      fontStyle: 'italic',
                      fontSize: '1.1rem',
                      lineHeight: '1.7',
                      borderBottom: '1px dashed #C9A876',
                      paddingBottom: '8px',
                    }}
                  />

                  <button
                    onClick={saveCaption}
                    disabled={captionSaving}
                    className="mt-4 w-full px-5 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: captionSaved ? '#7DAF82' : '#C9A876',
                      color: '#1A1622',
                      fontFamily: 'Inter, sans-serif',
                      opacity: captionSaving ? 0.6 : 1,
                      cursor: captionSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {captionSaving ? 'Saving...' : captionSaved ? '✓ Saved!' : 'Save caption'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaGallery;
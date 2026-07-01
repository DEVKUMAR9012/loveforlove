import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineCloudUpload, HiOutlineX, HiOutlinePhotograph, HiOutlineExclamationCircle } from 'react-icons/hi';

// ---------------------------------------------------------------------------
// Design notes (so future-you remembers the intent):
// This isn't a generic masonry grid. Every photo behaves like it's tucked
// into a physical album page — a slight resting rotation, torn-edge corner
// tape on hover, and a flip-to-the-back lightbox that mimics turning a
// printed photo over to read what's written on the back.
// Palette: near-black aubergine bg, warm sand/gold accents (old photo paper),
// muted mauve for secondary text. Serif display for anything that reads like
// a handwritten caption; sans for UI chrome.
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
  const [isFlipped, setIsFlipped] = useState(false);
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
    setIsFlipped(false);
    setActiveImage(img);
    setEditingCaption(img.caption || '');
    setCaptionSaved(false);
  };

  const closeLightbox = () => setActiveImage(null);

  const saveCaption = async () => {
    if (!activeImage) return;
    setCaptionSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/memories/${activeImage.id}/caption`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption: editingCaption }),
      });
      if (res.ok) {
        // Update caption in the images list so it shows immediately in gallery
        setImages((prev) =>
          prev.map((img) =>
            img.id === activeImage.id ? { ...img, caption: editingCaption } : img
          )
        );
        setActiveImage((prev) => ({ ...prev, caption: editingCaption }));
        setCaptionSaved(true);
        setTimeout(() => setCaptionSaved(false), 2000);
      }
    } catch (e) {
      console.error('Caption save failed', e);
    }
    setCaptionSaving(false);
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
      {/* Galaxy layer, built like an actual nebula photo has depth:
          a bright core bloom, layered multi-stop color clouds (not flat
          single-color blobs), dark dust lanes for contrast, three depths
          of twinkling stars, a few "hero" stars with real glow + sparkle
          cross, an edge vignette to keep focus centered, and the
          occasional shooting star. Sits on the base gradient, below the
          film grain and all real content. */}
      <div className="mg-galaxy" aria-hidden="true">
        <span className="mg-core" />
        <span className="mg-nebula mg-nebula--a" />
        <span className="mg-nebula mg-nebula--b" />
        <span className="mg-nebula mg-nebula--c" />
        <span className="mg-nebula mg-nebula--teal" />
        <span className="mg-dust mg-dust--1" />
        <span className="mg-dust mg-dust--2" />
        <div className="mg-stars mg-stars--sm" />
        <div className="mg-stars mg-stars--md" />
        <div className="mg-stars mg-stars--lg" />
        <span className="mg-hero mg-hero--1" />
        <span className="mg-hero mg-hero--2" />
        <span className="mg-hero mg-hero--3" />
        <span className="mg-hero mg-hero--4" />

        {/* A real spiral galaxy sitting in the distance — the one shape
            that says "galaxy" rather than just "starry sky". Rotates once
            every few minutes, slow enough to only notice if you look. */}
        <svg className="mg-spiral" viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <radialGradient id="mgSpiralCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFEAF2" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#FF9FC4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF9FC4" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mgSpiralArm1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB3D1" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8C6FB0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mgSpiralArm2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C98FD0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6E8FC9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="mg-spiral-rotate">
            <path
              d="M200,200 C255,185 300,150 295,105 C292,75 265,55 235,62 C210,68 198,92 205,112"
              stroke="url(#mgSpiralArm1)" strokeWidth="26" fill="none" strokeLinecap="round"
            />
            <path
              d="M200,200 C145,215 100,250 105,295 C108,325 135,345 165,338 C190,332 202,308 195,288"
              stroke="url(#mgSpiralArm2)" strokeWidth="24" fill="none" strokeLinecap="round"
            />
            <path
              d="M200,200 C230,225 250,260 230,295 C218,317 190,322 172,308"
              stroke="url(#mgSpiralArm1)" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.55"
            />
            <circle cx="200" cy="200" r="46" fill="url(#mgSpiralCore)" />
          </g>
        </svg>

        {/* A small distant ringed planet, drifting slowly — a quiet detail
            for anyone who looks close rather than a loud centerpiece. */}
        <span className="mg-planet">
          <span className="mg-planet-ring" />
        </span>

        <span className="mg-shoot mg-shoot--1" />
        <span className="mg-shoot mg-shoot--2" />
        <span className="mg-shoot mg-shoot--3" />
        <span className="mg-shoot mg-shoot--4" />
        <span className="mg-vignette" />
      </div>

      <style>{`
        .mg-galaxy {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        /* ── Core bloom — a bright wash near the top, like the brightest
             part of a nebula the rest of the cloud radiates from ── */
        .mg-core {
          position: absolute;
          top: -12%;
          left: 50%;
          width: 1000px;
          height: 1000px;
          transform: translateX(-50%);
          background: radial-gradient(circle,
            rgba(255, 210, 230, 0.4) 0%,
            rgba(255, 150, 195, 0.22) 30%,
            rgba(180, 100, 170, 0.12) 50%,
            rgba(120, 90, 160, 0) 72%);
          filter: blur(40px);
          mix-blend-mode: screen;
          animation: mgPulseCore 9s ease-in-out infinite;
        }
        @keyframes mgPulseCore {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }

        /* ── Nebula clouds — each is its own multi-stop color gradient
             (not one flat tint) so overlaps read as painterly gas rather
             than solid blobs. Screen blend lets colors mix like light. ── */
        .mg-nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(65px);
          mix-blend-mode: screen;
          will-change: transform;
        }
        .mg-nebula--a {
          width: 600px; height: 600px;
          top: -160px; left: -120px;
          background: radial-gradient(circle,
            rgba(255, 178, 210, 0.65) 0%,
            rgba(255, 110, 170, 0.35) 38%,
            rgba(255, 110, 170, 0) 72%);
          animation: mgDriftA 26s ease-in-out infinite alternate;
        }
        .mg-nebula--b {
          width: 680px; height: 680px;
          top: 16%; right: -200px;
          background: radial-gradient(circle,
            rgba(235, 130, 175, 0.6) 0%,
            rgba(190, 75, 145, 0.32) 42%,
            rgba(190, 75, 145, 0) 72%);
          animation: mgDriftB 32s ease-in-out infinite alternate;
        }
        .mg-nebula--c {
          width: 500px; height: 500px;
          bottom: -180px; left: 24%;
          background: radial-gradient(circle,
            rgba(160, 120, 200, 0.55) 0%,
            rgba(105, 85, 165, 0.28) 45%,
            rgba(105, 85, 165, 0) 72%);
          animation: mgDriftC 38s ease-in-out infinite alternate;
        }
        .mg-nebula--teal {
          width: 420px; height: 420px;
          top: 58%; right: 6%;
          background: radial-gradient(circle,
            rgba(120, 210, 215, 0.22) 0%,
            rgba(120, 210, 215, 0) 70%);
          filter: blur(85px);
          animation: mgDriftTeal 34s ease-in-out infinite alternate;
        }
        @keyframes mgDriftA {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(70px, 50px) scale(1.15); }
        }
        @keyframes mgDriftB {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-60px, 70px) scale(0.9); }
        }
        @keyframes mgDriftC {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(50px, -60px) scale(1.1); }
        }
        @keyframes mgDriftTeal {
          from { transform: translate(0, 0); }
          to   { transform: translate(-40px, 30px); }
        }

        /* ── Dust lanes — soft dark streaks laid over the color with a
             multiply blend. Real nebula photos get their depth from dark
             gas breaking up the bright areas, not just glow on black. ── */
        .mg-dust {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          mix-blend-mode: multiply;
          opacity: 0.55;
          will-change: transform;
        }
        .mg-dust--1 {
          width: 520px; height: 260px;
          top: 32%; left: 8%;
          background: radial-gradient(ellipse, rgba(8, 6, 14, 0.75) 0%, transparent 72%);
          transform: rotate(-15deg);
          animation: mgDust1 42s ease-in-out infinite alternate;
        }
        .mg-dust--2 {
          width: 620px; height: 220px;
          top: 62%; right: 2%;
          background: radial-gradient(ellipse, rgba(8, 6, 14, 0.65) 0%, transparent 72%);
          transform: rotate(12deg);
          animation: mgDust2 48s ease-in-out infinite alternate;
        }
        @keyframes mgDust1 {
          from { transform: rotate(-15deg) translate(0, 0); }
          to   { transform: rotate(-15deg) translate(35px, -22px); }
        }
        @keyframes mgDust2 {
          from { transform: rotate(12deg) translate(0, 0); }
          to   { transform: rotate(12deg) translate(-32px, 20px); }
        }

        /* ── Spiral galaxy — sits low-opacity in a corner, rotating slowly
             (one full turn takes minutes) so it reads as a distant object
             rather than a spinning logo. Blurred slightly so the arms feel
             like gas, not vector lines. ── */
        .mg-spiral {
          position: absolute;
          width: 480px;
          height: 480px;
          top: -60px;
          right: -80px;
          opacity: 0.4;
          filter: blur(2px);
          mix-blend-mode: screen;
        }
        .mg-spiral-rotate {
          transform-origin: 200px 200px;
          animation: mgSpiralSpin 240s linear infinite;
        }
        @keyframes mgSpiralSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Distant planet — small ringed sphere, gentle bob + tilt ── */
        .mg-planet {
          position: absolute;
          top: 70%;
          left: 82%;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 32%,
            #FFE3D6 0%, #E8A9C0 35%, #8C5D8F 70%, #4A3560 100%);
          box-shadow: 0 0 18px 4px rgba(232, 169, 192, 0.35);
          animation: mgPlanetDrift 22s ease-in-out infinite alternate;
        }
        .mg-planet-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 62px;
          height: 16px;
          border: 2px solid rgba(244, 228, 220, 0.55);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(-18deg);
        }
        @keyframes mgPlanetDrift {
          from { transform: translate(0, 0); }
          to   { transform: translate(-14px, 16px); }
        }

        /* ── Stars — three depths, each with its own scatter, size and
             twinkle rhythm so it reads as parallax rather than one blinking
             sheet ── */
        .mg-stars {
          position: absolute;
          inset: -10%;
          background-repeat: repeat;
        }
        .mg-stars--sm {
          background-image:
            radial-gradient(1px 1px at 6% 12%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 22% 38%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 41% 8%, #FFD9E8 100%, transparent),
            radial-gradient(1px 1px at 63% 27%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 78% 55%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 91% 15%, #FFD9E8 100%, transparent),
            radial-gradient(1px 1px at 15% 68%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 34% 82%, #F4ECE3 100%, transparent),
            radial-gradient(1px 1px at 57% 91%, #FFD9E8 100%, transparent),
            radial-gradient(1px 1px at 86% 78%, #F4ECE3 100%, transparent);
          background-size: 260px 260px;
          opacity: 0.6;
          animation: mgTwinkle 4s ease-in-out infinite;
        }
        .mg-stars--md {
          background-image:
            radial-gradient(1.5px 1.5px at 12% 24%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 48% 12%, #C9A876 100%, transparent),
            radial-gradient(1.5px 1.5px at 70% 44%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 88% 20%, #F4ECE3 100%, transparent),
            radial-gradient(1.5px 1.5px at 30% 65%, #FFD9E8 100%, transparent),
            radial-gradient(1.5px 1.5px at 60% 80%, #F4ECE3 100%, transparent);
          background-size: 340px 340px;
          opacity: 0.45;
          animation: mgTwinkle 6s ease-in-out infinite;
          animation-delay: 1.2s;
        }
        .mg-stars--lg {
          background-image:
            radial-gradient(2px 2px at 20% 30%, #F4ECE3 100%, transparent),
            radial-gradient(2px 2px at 55% 55%, #FFD9E8 100%, transparent),
            radial-gradient(2px 2px at 82% 35%, #F4ECE3 100%, transparent),
            radial-gradient(2px 2px at 40% 85%, #C9A876 100%, transparent);
          background-size: 460px 460px;
          opacity: 0.35;
          animation: mgTwinkle 8s ease-in-out infinite;
          animation-delay: 2.4s;
        }
        @keyframes mgTwinkle {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 0.9; }
        }

        /* ── Hero stars — a handful of bigger, brighter stars with a real
             glow (box-shadow bloom) and a thin 4-point sparkle cross, like
             what a camera lens does to a bright point of light. These are
             the detail that sells "photographed sky" over "css dots". ── */
        .mg-hero {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFF8F3;
          box-shadow:
            0 0 6px 2px rgba(255, 248, 243, 0.95),
            0 0 18px 6px rgba(255, 180, 210, 0.55),
            0 0 34px 12px rgba(255, 150, 195, 0.25);
          animation: mgHeroPulse 5.5s ease-in-out infinite;
        }
        .mg-hero::before,
        .mg-hero::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          background: linear-gradient(90deg, transparent, rgba(255, 248, 243, 0.85), transparent);
          transform: translate(-50%, -50%);
        }
        .mg-hero::before { width: 26px; height: 1px; }
        .mg-hero::after   { width: 1px; height: 26px; }
        .mg-hero--1 { top: 11%; left: 78%; animation-delay: 0s; }
        .mg-hero--2 { top: 63%; left: 13%; animation-delay: 1.6s; }
        .mg-hero--3 { top: 37%; left: 91%; animation-delay: 3.1s; }
        .mg-hero--4 { top: 80%; left: 55%; animation-delay: 4.4s; }
        @keyframes mgHeroPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.2); }
        }

        /* ── Shooting stars — real comets: a bright glowing head leading a
             tapered fading tail, angled consistently like they're falling
             from the same general direction. Four of them, short travel
             time, staggered close together so one crosses the sky every
             few seconds instead of once in a blue moon. ── */
        .mg-shoot {
          position: absolute;
          width: 120px;
          height: 3px;
          transform: rotate(-24deg);
          opacity: 0;
        }
        .mg-shoot::before {
          /* the tail */
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 3px;
          background: linear-gradient(90deg, rgba(255,217,232,0) 0%, rgba(255,217,232,0.8) 70%, #FFF8F3 100%);
        }
        .mg-shoot::after {
          /* the bright head, glowing */
          content: '';
          position: absolute;
          right: -2px;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFF8F3;
          transform: translateY(-50%);
          box-shadow: 0 0 10px 3px rgba(255, 217, 232, 0.9), 0 0 18px 6px rgba(255, 150, 195, 0.5);
        }
        .mg-shoot--1 { top: 8%;  left: -12%; width: 130px; animation: mgShoot 12s ease-in infinite; animation-delay: 0.2s; }
        .mg-shoot--2 { top: 24%; left: -12%; width: 100px; animation: mgShoot 12s ease-in infinite; animation-delay: 3.6s; }
        .mg-shoot--3 { top: 46%; left: -12%; width: 150px; animation: mgShoot 12s ease-in infinite; animation-delay: 6.8s; }
        .mg-shoot--4 { top: 66%; left: -12%; width: 110px; animation: mgShoot 12s ease-in infinite; animation-delay: 10.4s; }
        @keyframes mgShoot {
          0%   { transform: translate(0, 0) rotate(-24deg); opacity: 0; }
          3%   { opacity: 1; }
          14%  { transform: translate(58vw, 26vh) rotate(-24deg); opacity: 0.9; }
          17%  { transform: translate(58vw, 26vh) rotate(-24deg); opacity: 0; }
          100% { transform: translate(58vw, 26vh) rotate(-24deg); opacity: 0; }
        }

        /* ── Vignette — pulls a little darkness into the corners so the
             content and the sky's bright core stay the focal point ── */
        .mg-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 90% 80% at 50% 30%, transparent 40%, rgba(5, 4, 9, 0.55) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .mg-core, .mg-nebula, .mg-dust, .mg-stars, .mg-hero, .mg-shoot,
          .mg-spiral-rotate, .mg-planet {
            animation: none !important;
          }
          .mg-stars { opacity: 0.4; }
          .mg-hero { opacity: 0.85; }
          .mg-shoot { opacity: 0; }
        }
      `}</style>

      {/* Film grain overlay — animated SVG noise, sits above the gradient,
          below all real content. Gives the dark bg a textured, lived-in
          paper feel instead of a flat digital black. */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'overlay', opacity: 0.5, zIndex: 0 }}
        aria-hidden="true"
      >
        <filter id="filmGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.9;0.95;0.9"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix in="noise" type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#filmGrain)" />
      </svg>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-6xl mx-auto px-6 py-12"
      >
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
            className="flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors duration-200"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: isUploading ? '#3A3340' : '#C9A876',
              color: isUploading ? '#9C8C9E' : '#1A1622',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isUploading) e.currentTarget.style.background = '#DCB988';
            }}
            onMouseLeave={(e) => {
              if (!isUploading) e.currentTarget.style.background = '#C9A876';
            }}
          >
            <HiOutlineCloudUpload className="text-xl" />
            {isUploading ? `Uploading ${uploadProgress.done}/${uploadProgress.total}` : 'Add memories'}
          </button>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {loadError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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
            </motion.div>
          )}
        </AnimatePresence>

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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 [column-fill:_balance]">
            {images.map((img, idx) => (
              <motion.button
                key={img.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 8) * 0.06 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                onClick={() => openLightbox(img)}
                className="block w-full mb-8 break-inside-avoid text-left group relative"
                style={{ rotate: `${img.rotation}deg`, transformOrigin: 'center' }}
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
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Tape corners, appear on hover */}
                  <span
                    className="absolute -top-2 -left-2 w-8 h-5 opacity-0 group-hover:opacity-90 transition-opacity duration-300 rotate-[-25deg]"
                    style={{ background: 'rgba(201, 168, 118, 0.55)' }}
                  />
                  <span
                    className="absolute -top-2 -right-2 w-8 h-5 opacity-0 group-hover:opacity-90 transition-opacity duration-300 rotate-[25deg]"
                    style={{ background: 'rgba(201, 168, 118, 0.55)' }}
                  />

                  {/* Caption strip, like a handwritten note under a polaroid */}
                  <p
                    className="absolute bottom-2.5 left-3 right-3 truncate text-sm"
                    style={{ color: '#3A332E', fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                  >
                    {formatDate(img.date)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Drag-over overlay */}
        <AnimatePresence>
          {isDraggingOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox: flips like turning a photo over */}
        <AnimatePresence>
          {activeImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background: 'rgba(7, 6, 11, 0.92)' }}
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                aria-label="Close"
                className="absolute top-6 right-6 p-2 rounded-full"
                style={{ color: '#F4ECE3', background: 'rgba(255,255,255,0.08)' }}
              >
                <HiOutlineX className="text-2xl" />
              </button>

              <div
                className="relative w-full max-w-md"
                style={{ perspective: '1600px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="relative w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Front: the photo */}
                  <div
                    className="p-4 rounded-sm"
                    style={{ background: '#F4ECE3', backfaceVisibility: 'hidden' }}
                  >
                    <img
                      src={activeImage.src}
                      alt={activeImage.caption || 'A keepsake memory'}
                      className="w-full h-auto rounded-[2px]"
                    />
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full mt-3 py-2 text-sm rounded-md"
                      style={{ color: '#6B5B73', fontFamily: 'Inter, sans-serif', background: 'transparent' }}
                    >
                      Turn over →
                    </button>
                  </div>

                  {/* Back: editable caption + date, like the back of a printed photo */}
                  <div
                    className="absolute inset-0 p-8 rounded-sm flex flex-col justify-between"
                    style={{
                      background: '#EDE3D3',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex flex-col flex-1">
                      <p
                        className="text-xs uppercase tracking-[0.2em] mb-4"
                        style={{ color: '#A89678', fontFamily: 'Inter, sans-serif' }}
                      >
                        {formatDate(activeImage.date)}
                      </p>

                      {/* Editable caption textarea */}
                      <textarea
                        value={editingCaption}
                        onChange={(e) => { setEditingCaption(e.target.value); setCaptionSaved(false); }}
                        placeholder="Write something about this memory..."
                        rows={4}
                        className="flex-1 w-full resize-none bg-transparent focus:outline-none"
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

                      {/* Save button */}
                      <button
                        onClick={saveCaption}
                        disabled={captionSaving}
                        className="mt-4 self-end px-5 py-2 rounded-lg text-sm font-medium transition-all"
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

                    <button
                      onClick={() => setIsFlipped(false)}
                      className="self-start text-sm mt-4"
                      style={{ color: '#8A7960', fontFamily: 'Inter, sans-serif' }}
                    >
                      ← Back to photo
                    </button>
                  </div>

                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default MediaGallery;
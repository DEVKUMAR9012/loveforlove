import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardCopy,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineLogin,
  HiOutlineUserAdd,
} from 'react-icons/hi';
import { FaWhatsapp, FaShareAlt, FaCheck, FaHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { AnimatedMainLogo } from '../components/MainLogo';

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '').slice(0, 8);

function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    loading,
    createPartnerInvite,
    previewPartnerInvite,
    acceptPartnerInvite,
  } = useAuth();

  const [code, setCode] = useState(() => normalizeInviteCode(searchParams.get('code') || ''));
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const previewTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);
  const navigateTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const shareUrl = useMemo(() => {
    if (!generatedInvite?.code || typeof window === 'undefined') return '';
    return `${window.location.origin}/join?code=${generatedInvite.code}`;
  }, [generatedInvite]);

  // Safe async helper that prevents state updates on unmounted component
  const safeSetState = useCallback((setter, value) => {
    if (mountedRef.current) setter(value);
  }, []);

  const previewCode = useCallback(async (nextCode = code) => {
    const normalizedCode = normalizeInviteCode(nextCode);
    if (normalizedCode.length !== 8) {
      safeSetState(setError, 'Enter the 8-character invitation code.');
      return null;
    }

    safeSetState(setBusy, 'preview');
    safeSetState(setError, '');
    safeSetState(setMessage, '');
    try {
      const data = await previewPartnerInvite(normalizedCode);
      if (!mountedRef.current) return null;
      setPreview(data);
      sessionStorage.setItem('pendingInviteCode', normalizedCode);
      return data;
    } catch (err) {
      if (!mountedRef.current) return null;
      safeSetState(setPreview, null);
      safeSetState(setError, err.message);
      return null;
    } finally {
      if (mountedRef.current) safeSetState(setBusy, '');
    }
  }, [code, previewPartnerInvite, safeSetState]);

  const updateCode = useCallback((value) => {
    const next = normalizeInviteCode(value);
    setCode(next);
    setPreview(null);
    setMessage('');
    setError('');

    clearTimeout(previewTimerRef.current);
    if (next.length === 8) {
      previewTimerRef.current = setTimeout(() => previewCode(next), 300);
    }
  }, [previewCode]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(previewTimerRef.current);
      clearTimeout(copiedTimerRef.current);
      clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const previewCodeRef = useRef(previewCode);
  useEffect(() => {
    previewCodeRef.current = previewCode;
  }, [previewCode]);

  useEffect(() => {
    const initialCode = normalizeInviteCode(searchParams.get('code') || '');
    if (initialCode.length === 8) {
      setCode(initialCode);
      previewCodeRef.current(initialCode);
    }
  }, [searchParams]);

  const handleCreateInvite = async () => {
    safeSetState(setBusy, 'create');
    safeSetState(setError, '');
    safeSetState(setMessage, '');
    try {
      const data = await createPartnerInvite();
      if (!mountedRef.current) return;
      setGeneratedInvite(data);
      setMessage('Invitation code ready.');
    } catch (err) {
      if (!mountedRef.current) return;
      safeSetState(setError, err.message);
    } finally {
      if (mountedRef.current) safeSetState(setBusy, '');
    }
  };

  const handleCopy = async () => {
    if (!shareUrl && !generatedInvite?.code) return;
    const text = shareUrl || generatedInvite.code;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      safeSetState(setCopied, true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let copiedWithFallback = false;
      try {
        copiedWithFallback = document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }

      if (!copiedWithFallback) {
        safeSetState(setError, 'Copy failed. Select the code and copy it manually.');
        return;
      }
      safeSetState(setCopied, true);
    }

    safeSetState(setError, '');
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      safeSetState(setCopied, false);
    }, 1600);
  };

  const handleWhatsAppShare = () => {
    if (!generatedInvite?.code) return;
    const shareMessage = `Hey! 💖 Join my private space on loveforlove so we can share memories and stay connected! \n\nPartner Code: *${generatedInvite.code}*\nLink: ${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (!generatedInvite?.code) return;
    const shareData = {
      title: 'Join my private space on loveforlove 💖',
      text: `Use my partner invite code ${generatedInvite.code} to connect with me!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleAcceptInvite = async () => {
    const normalizedCode = normalizeInviteCode(code);
    if (normalizedCode.length !== 8) {
      safeSetState(setError, 'Enter the 8-character invitation code.');
      return;
    }

    if (!user) {
      sessionStorage.setItem('pendingInviteCode', normalizedCode);
      navigate(`/login?code=${normalizedCode}`);
      return;
    }

    safeSetState(setBusy, 'accept');
    safeSetState(setError, '');
    safeSetState(setMessage, '');
    try {
      await acceptPartnerInvite(normalizedCode);
      if (!mountedRef.current) return;
      sessionStorage.removeItem('pendingInviteCode');
      setMessage('Partner connected.');
      navigateTimerRef.current = setTimeout(() => navigate('/'), 700);
    } catch (err) {
      if (!mountedRef.current) return;
      safeSetState(setError, err.message);
    } finally {
      if (mountedRef.current) safeSetState(setBusy, '');
    }
  };

  const generatedExpiry = generatedInvite?.expiresAt
    ? new Date(generatedInvite.expiresAt).toLocaleDateString()
    : null;
  const previewExpiry = preview?.expiresAt
    ? new Date(preview.expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sky-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link
          to={user ? '/' : '/login'}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-gray-500 hover:text-blush-600"
        >
          <HiOutlineArrowLeft className="text-lg" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 md:grid-cols-[1fr_1fr]"
        >
          <section className="glass rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blush-100 text-blush-600">
                <HiOutlineUserAdd className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Invite Partner</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create one code for your partner to join your space.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-white/60" />
            ) : user?.partnerId ? (
              <div className="rounded-2xl border border-mint-200 bg-mint-50 p-4 text-sm font-medium text-mint-700">
                Your account is already connected.
              </div>
            ) : user ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCreateInvite}
                  disabled={busy === 'create'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blush-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blush-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineLink className="text-xl" />
                  {busy === 'create' ? 'Creating...' : 'Create Invite Code'}
                </button>

                <AnimatePresence>
                  {generatedInvite && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -15 }}
                      className="mt-4 flex flex-col gap-4"
                      key={`generated-${generatedInvite.code}`}
                    >
                      {/* Beautiful Shareable Invite Card */}
                      <div
                        id="shareable-invite-card"
                        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl border border-white/20"
                        style={{
                          background: 'linear-gradient(135deg, #8b1c31 0%, #ee2a7b 55%, #f9ce34 100%)',
                        }}
                      >
                        {/* Background Decorative Glow */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-black/25 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                          {/* Brand Pill */}
                          <div className="flex items-center gap-2 mb-3 bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/25">
                            <AnimatedMainLogo className="w-5 h-5 text-white" />
                            <span className="font-bold text-xs tracking-wider uppercase text-white">loveforlove</span>
                          </div>

                          <h3 className="text-xl font-extrabold tracking-tight mb-1 text-white drop-shadow-sm">
                            {user?.name ? `${user.name} invited you!` : "You're Invited!"}
                          </h3>
                          <p className="text-xs text-white/90 font-medium mb-4 max-w-xs leading-relaxed">
                            Connect in a private, secure space created just for the two of us.
                          </p>

                          {/* Invite Code Display Box */}
                          <div className="w-full bg-black/40 backdrop-blur-md border border-white/30 rounded-2xl p-4 mb-3 flex flex-col items-center shadow-inner">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 mb-1">
                              PARTNER INVITE CODE
                            </span>
                            <span className="font-mono text-3xl font-black tracking-widest text-yellow-300 drop-shadow-md my-1">
                              {generatedInvite.code}
                            </span>
                            {generatedExpiry && (
                              <span className="text-[10px] text-white/70">Valid until {generatedExpiry}</span>
                            )}
                          </div>

                          <p className="text-[11px] text-white/80 font-medium">
                            Tap link or enter code to join instantly
                          </p>
                        </div>
                      </div>

                      {/* Action & Share Buttons */}
                      <div className="flex flex-col gap-2.5">
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* WhatsApp Share */}
                          <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <FaWhatsapp className="text-lg" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Native Share */}
                          <button
                            type="button"
                            onClick={handleNativeShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <FaShareAlt className="text-base" />
                            <span>Share Link</span>
                          </button>
                        </div>

                        {/* Copy Direct Link */}
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl font-bold text-xs text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-xs cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <FaCheck className="text-emerald-500 text-base" />
                              <span className="text-emerald-600">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <HiOutlineClipboardCopy className="text-lg text-gray-500" />
                              <span>Copy Direct Invite Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-medium text-sky-700">
                  Sign in to create an invitation code.
                </div>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600"
                >
                  <HiOutlineLogin className="text-xl" />
                  Sign In
                </Link>
              </div>
            )}
          </section>

          <section className="glass rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <HiOutlineKey className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Join With Code</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the invitation code your partner shared.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label htmlFor="partner-invite-code" className="sr-only">
                Invitation code
              </label>
              <input
                id="partner-invite-code"
                type="text"
                value={code}
                onChange={(e) => updateCode(e.target.value)}
                maxLength={12}
                placeholder="ABCD2345"
                className="w-full rounded-2xl border border-sky-200 bg-white/80 px-4 py-3 font-mono text-lg uppercase text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                aria-label="Invitation code"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => previewCode()}
                  disabled={busy === 'preview'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineKey className="text-xl" />
                  {busy === 'preview' ? 'Checking...' : 'Check Code'}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={busy === 'accept'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineUserAdd className="text-xl" />
                  {busy === 'accept' ? 'Joining...' : user ? 'Join Partner' : 'Sign In & Join'}
                </button>
              </div>

              <AnimatePresence>
                {preview && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-sky-100 bg-sky-50 p-4"
                    key={`preview-${preview.code}`}
                  >
                    <p className="text-sm font-semibold text-sky-800">
                      Invite from {preview.inviterName}
                    </p>
                    {previewExpiry && (
                      <p className="mt-1 text-xs text-sky-600">Expires {previewExpiry}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>

        <AnimatePresence>
          {(message || error) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${error ? 'bg-red-50 text-red-600' : 'bg-mint-50 text-mint-700'
                }`}
              role="status"
              aria-live="polite"
            >
              {error || message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Invite; 
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
import { useAuth } from '../context/AuthContext';

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

  // Mount/unmount lifecycle only — must not depend on any state that changes
  // while the component is mounted, or the cleanup fires on every re-render.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(previewTimerRef.current);
      clearTimeout(copiedTimerRef.current);
      clearTimeout(navigateTimerRef.current);
    };
  }, []);

  // Keep a ref to the latest previewCode so the URL-driven effect below can
  // call it without needing it in its dependency array (it changes on every
  // keystroke since it closes over `code`).
  const previewCodeRef = useRef(previewCode);
  useEffect(() => {
    previewCodeRef.current = previewCode;
  }, [previewCode]);

  // Prefill + preview from ?code= in the URL. Only reruns when the URL
  // actually changes, not on every keystroke in the input.
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-blush-100 bg-white/70 p-4"
                      key={`generated-${generatedInvite.code}`}
                    >
                      <p className="text-xs font-semibold uppercase text-gray-400">Invitation code</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <code className="rounded-xl bg-gray-900 px-4 py-3 font-mono text-xl font-bold text-white">
                          {generatedInvite.code}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:text-blush-600"
                          aria-label="Copy invite link"
                        >
                          <HiOutlineClipboardCopy className="text-xl" />
                        </button>
                      </div>
                      {shareUrl && (
                        <p className="mt-3 break-all text-xs text-gray-400">{shareUrl}</p>
                      )}
                      {generatedExpiry && (
                        <p className="mt-2 text-xs text-gray-400">Expires {generatedExpiry}</p>
                      )}
                      {copied && (
                        <p className="mt-2 text-sm font-medium text-mint-700">Copied.</p>
                      )}
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
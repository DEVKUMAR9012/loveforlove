// vibecheck-disable SECAI006
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCamera, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineExclamation, HiOutlineTrash, HiOutlineClock } from 'react-icons/hi';

function Settings() {
  const { user, backendUrl, updateRelationshipDate, updateAvatarUrl, updateName, updateEmail } = useAuth();

  // ── Relationship date ──
  const [date, setDate] = useState(() =>
    user?.relationshipStartDate ? new Date(user.relationshipStartDate).toISOString().split('T')[0] : ''
  );
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [dateMsg, setDateMsg] = useState('');

  // ── Avatar upload ──
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');

  // ── Name editing ──
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  // ── Email editing / adding ──
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(user?.email || '');
  const [passwordValue, setPasswordValue] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  // ── Disconnect Partner state ──
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectMsg, setDisconnectMsg] = useState('');
  const [isPendingDisconnection, setIsPendingDisconnection] = useState(false);

  useEffect(() => {
    const checkDisconnectionStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${backendUrl}/api/settings/disconnection-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsPendingDisconnection(!!data.isPending);
        }
      } catch (err) {
        console.error('Failed to fetch disconnection status', err);
      }
    };
    checkDisconnectionStatus();
  }, [backendUrl]);

  const handleSaveDate = async (e) => {
    e.preventDefault();
    setIsSavingDate(true);
    setDateMsg('');
    try {
      const res = await fetch(`${backendUrl}/api/settings/relationship-date`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error('Failed to update date');
      const data = await res.json();
      updateRelationshipDate(data.relationshipStartDate);
      setDateMsg('Anniversary date updated! 🎉');
    } catch {
      setDateMsg('Error updating date.');
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarMsg('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${backendUrl}/api/settings/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        updateAvatarUrl(data.avatarUrl);
        setAvatarMsg('Profile picture updated! 📸');
      } else {
        const err = await res.json().catch(() => ({}));
        setAvatarMsg(`Failed: ${err.error || res.statusText}`);
      }
    } catch (err) {
      setAvatarMsg(`Error: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = null;
    }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    setNameMsg('');
    try {
      const res = await fetch(`${backendUrl}/api/settings/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update name');
      const data = await res.json();
      updateName(data.name);
      setNameMsg('Name updated! ✨');
      setEditingName(false);
    } catch {
      setNameMsg('Error updating name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailValue.trim()) return;
    setSavingEmail(true);
    setEmailMsg('');
    try {
      const res = await fetch(`${backendUrl}/api/settings/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: emailValue.trim(),
          password: passwordValue.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update email');
      updateEmail(data.email);
      setEmailMsg('Email saved successfully! ✉️');
      setEditingEmail(false);
      setPasswordValue('');
    } catch (err) {
      setEmailMsg(err.message || 'Error updating email.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleExport = () => {
    alert('This feature will compile all your memories and messages into a beautiful PDF in the future!');
  };

  const handleDisconnectPartner = async (e) => {
    if (e) e.preventDefault();
    if (!disconnectReason.trim()) {
      setDisconnectMsg('Please provide a brief description / reason for breaking the connection.');
      return;
    }
    if (!confirmDisconnect) {
      setDisconnectMsg('Please check the confirmation box to proceed.');
      return;
    }

    setIsDisconnecting(true);
    setDisconnectMsg('');
    try {
      const res = await fetch(`${backendUrl}/api/settings/disconnect-partner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: disconnectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit disconnection request');

      alert('Disconnection request submitted! Website admin will review your request to break connection and purge all shared data.');
      setIsPendingDisconnection(true);
      setShowDisconnectModal(false);
    } catch (err) {
      setDisconnectMsg(err.message || 'Failed to submit disconnection request.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you absolutely sure? This will disconnect you from your partner and reset all your settings and data.')) return;
    try {
      const res = await fetch(`${backendUrl}/api/settings/danger-zone`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        alert('App has been reset.');
        window.location.reload();
      }
    } catch {
      alert('Failed to reset app.');
    }
  };

  const firstLetter = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="bg-white/60 p-6 rounded-[2rem] shadow-sm border border-white/80 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">My Profile</h2>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-md select-none cursor-pointer group overflow-hidden border-4 border-white/70"
              style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : firstLetter
              }
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <HiOutlineCamera className="text-white text-2xl" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#ee2a7b] hover:bg-rose-50 transition"
              title="Change photo"
            >
              <HiOutlineCamera className="text-sm" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name field */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(user?.name || ''); } }}
                  maxLength={60}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#ee2a7b]/40 focus:outline-none focus:ring-2 focus:ring-[#ee2a7b]/30 text-gray-800 font-semibold text-lg bg-white/80"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-8 h-8 rounded-full bg-[#ee2a7b] flex items-center justify-center text-white hover:bg-[#c51e67] transition disabled:opacity-50"
                >
                  <HiOutlineCheck />
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                >
                  <HiOutlineX />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xl font-bold text-gray-800">{user?.name}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-gray-400 hover:text-[#ee2a7b] transition"
                  title="Edit name"
                >
                  <HiOutlinePencil />
                </button>
              </div>
            )}

            {/* Email field */}
            {editingEmail ? (
              <form onSubmit={handleSaveEmail} className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#ee2a7b]/40 focus:outline-none focus:ring-2 focus:ring-[#ee2a7b]/30 text-gray-800 text-sm bg-white/80"
                  />
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="w-8 h-8 rounded-full bg-[#ee2a7b] flex items-center justify-center text-white hover:bg-[#c51e67] transition disabled:opacity-50"
                    title="Save email"
                  >
                    <HiOutlineCheck />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingEmail(false); setEmailValue(user?.email || ''); setPasswordValue(''); }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                    title="Cancel"
                  >
                    <HiOutlineX />
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Set account password (optional)"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 text-xs bg-white/80 focus:outline-none"
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                {user?.email ? (
                  <>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <button
                      onClick={() => { setEditingEmail(true); setEmailValue(user.email); }}
                      className="text-gray-400 hover:text-[#ee2a7b] transition text-xs"
                      title="Edit email"
                    >
                      <HiOutlinePencil />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      No email linked
                    </span>
                    <button
                      onClick={() => setEditingEmail(true)}
                      className="px-3 py-1 bg-[#ee2a7b] text-white text-xs font-semibold rounded-full hover:bg-[#c51e67] transition shadow-xs"
                    >
                      + Add Email
                    </button>
                  </div>
                )}
              </div>
            )}

            {(nameMsg || avatarMsg || emailMsg) && (
              <p className={`text-xs mt-2 font-medium ${(nameMsg || avatarMsg || emailMsg).includes('Error') || (nameMsg || avatarMsg || emailMsg).includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>
                {nameMsg || avatarMsg || emailMsg}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">Click on the photo to change it. Click the pencil icon to edit your profile details.</p>
      </div>

      {/* ── Relationship Details ──────────────────────────────────────── */}
      <div className="bg-white/60 p-6 rounded-[2rem] shadow-sm border border-white/80 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Relationship Details</h2>
        <form onSubmit={handleSaveDate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Our Anniversary Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blush-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingDate}
            className="self-start px-6 py-2 bg-blush-500 text-white rounded-full font-medium hover:bg-blush-600 transition disabled:opacity-50"
          >
            {isSavingDate ? 'Saving...' : 'Save Date'}
          </button>
          {dateMsg && <p className="text-sm text-green-600">{dateMsg}</p>}
        </form>
      </div>

      {/* ── Export ───────────────────────────────────────────────────── */}
      <div className="bg-white/60 p-6 rounded-[2rem] shadow-sm border border-white/80 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Export Data</h2>
        <p className="text-sm text-gray-500 mb-4">Download a copy of all your memories, messages, and photos.</p>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-white text-gray-800 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition shadow-sm"
        >
          Request Data Export
        </button>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <div className="bg-red-50 p-6 rounded-[2rem] shadow-sm border border-red-100">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-5">
          Request to break your partner connection. Submitting a request sends a report to website admin with your description. Once website admin approves the request, your connection will be broken and all shared memories, messages, snaps, voice notes, and location histories will be permanently purged.
        </p>

        {isPendingDisconnection && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <HiOutlineClock className="text-2xl text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 mb-0.5">Disconnection Request Pending Admin Approval</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your request to break connection has been submitted to website admin. Connection unlinking and data purge will be completed automatically once approved by admin.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setShowDisconnectModal(true); setDisconnectMsg(''); setDisconnectReason(''); setConfirmDisconnect(false); }}
            disabled={isPendingDisconnection}
            className="px-5 py-2.5 bg-red-600 text-white rounded-full font-semibold text-sm hover:bg-red-700 transition flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <HiOutlineTrash className="text-base" />
            {isPendingDisconnection ? 'Disconnection Request Pending' : 'Request Connection Break & Data Purge'}
          </button>

          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-white text-red-700 border border-red-200 rounded-full font-semibold text-sm hover:bg-red-100/50 transition"
          >
            Reset Account Data
          </button>
        </div>
      </div>

      {/* ── Disconnect & Purge Confirmation Modal ──────────────────────── */}
      <AnimatePresence>
        {showDisconnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDisconnectModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-red-100 relative overflow-hidden"
            >
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <HiOutlineX />
              </button>

              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <HiOutlineExclamation className="text-2xl text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Break Partner Connection</h3>
                  <p className="text-xs text-red-500 font-medium">Sends admin report & purges all connected data</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Breaking your connection will notify website admin and <strong className="text-red-700">permanently delete everything</strong> created during your connected time — including all shared photos, memories, messages, voice notes, snaps, and location history.
              </p>

              <form onSubmit={handleDisconnectPartner} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Brief Description / Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter a brief description explaining why you want to break the connection..."
                    value={disconnectReason}
                    onChange={(e) => setDisconnectReason(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl border border-gray-300 text-sm text-gray-800 focus:ring-2 focus:ring-red-400 focus:outline-none bg-gray-50/50"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-red-800">
                    <input
                      type="checkbox"
                      checked={confirmDisconnect}
                      onChange={(e) => setConfirmDisconnect(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 shrink-0"
                    />
                    <span>
                      I understand that this action is permanent, will send a report to admin, and will delete all shared data between both partners forever.
                    </span>
                  </label>
                </div>

                {disconnectMsg && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {disconnectMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisconnectModal(false)}
                    className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisconnecting || !confirmDisconnect || !disconnectReason.trim()}
                    className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 shadow-md flex items-center gap-2"
                  >
                    {isDisconnecting ? 'Breaking Connection...' : 'Confirm & Delete Everything'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Settings;

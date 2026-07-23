// vibecheck-disable SECAI006
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCamera, HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

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

  const handleReset = async () => {
    if (!window.confirm('Are you absolutely sure? This will disconnect you from your partner and reset your settings.')) return;
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
        <p className="text-sm text-red-600 mb-4">Disconnect from your partner and reset all relationship settings. This action is irreversible.</p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition"
        >
          Reset Account Data
        </button>
      </div>
    </motion.div>
  );
}

export default Settings;

import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineCalendar, HiOutlinePhotograph, HiOutlineCamera, HiOutlineMicrophone, HiOutlinePencilAlt, HiOutlineUserAdd, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { AnimatedMainLogo } from '../components/MainLogo';


function Dashboard() {
  const { user, backendUrl, updateAvatarUrl } = useAuth();
  const navigate = useNavigate();
  const [recentMemories, setRecentMemories] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState(null);
  const [partner, setPartner] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/memories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Show the 3 most recent
          setRecentMemories(data.slice(-3).reverse());
        }
      } catch (_) {
        // silently fail
      }
    };
    fetchRecent();

    // Fetch partner info if linked
    if (user?.partnerId) {
      const fetchPartner = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${backendUrl}/api/settings/partner`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPartner(data.partner);
          }
        } catch (_) { /* silently fail */ }
      };
      fetchPartner();
    }
  }, [backendUrl, user?.partnerId]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarNotice(null);
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
        setAvatarNotice({ type: 'success', text: 'Profile picture updated.' });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setAvatarNotice({ type: 'error', text: `Failed to upload avatar: ${errorData.error || res.statusText}` });
      }
    } catch (err) {
      setAvatarNotice({ type: 'error', text: `Error uploading avatar: ${err.message}` });
    } finally {
      setUploadingAvatar(false);
      e.target.value = null; // reset input
    }
  };

  // Widget accents pull from the loveforlove brand ramp (rose -> coral -> amber)
  // plus a few complementary tones, mirroring the palette used on Login/About.
  const widgets = [
    { title: 'My Gallery', icon: HiOutlinePhotograph, path: '/gallery', color: 'text-[#ee2a7b]', bg: 'from-rose-50 to-pink-50', desc: 'Photos & memories' },
    { title: 'Calendar', icon: HiOutlineCalendar, path: '/calendar', color: 'text-sky-500', bg: 'from-sky-50 to-blue-50', desc: 'Important dates' },
    { title: 'Mood Journal', icon: HiOutlineHeart, path: '/mood', color: 'text-[#f26e4e]', bg: 'from-orange-50 to-rose-50', desc: 'Track your feelings' },
    { title: 'Snap', icon: HiOutlineCamera, path: '/snap', color: 'text-purple-500', bg: 'from-purple-50 to-violet-50', desc: 'Camera selfies' },
    { title: 'Voice Notes', icon: HiOutlineMicrophone, path: '/voice', color: 'text-[#f9ce34]', bg: 'from-amber-50 to-yellow-50', desc: 'Record your voice' },
    { title: 'Messages', icon: HiOutlinePencilAlt, path: '/messages', color: 'text-teal-500', bg: 'from-teal-50 to-emerald-50', desc: 'Notes & letters' },
    { title: user?.partnerId ? 'Partner Linked' : 'Invite Partner', icon: HiOutlineUserAdd, path: '/invite', color: 'text-emerald-500', bg: 'from-emerald-50 to-teal-50', desc: user?.partnerId ? 'Connected' : 'Share a code' },
  ];

  const greetingEmoji = () => {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 18) return '🌤️';
    return '🌙';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto h-full"
    >
      {/* Hero Section */}
      <div className="glass p-8 md:p-12 rounded-[2rem] shadow-sm mb-8 relative overflow-hidden">
        {/* Top gradient accent bar */}
        <div className="absolute top-0 left-0 w-full h-2"
          style={{ background: 'linear-gradient(90deg, #ee2a7b, #f26e4e, #f9ce34)' }} />
        {/* Soft glow blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ee2a7b, transparent 70%)' }} />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f9ce34, transparent 70%)' }} />

        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />

        {partner ? (
          /* ── COUPLED VIEW ── */
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
            {/* Avatar pair cluster */}
            <div className="relative flex items-center justify-center shrink-0 w-48 h-40">
              {/* Spinning orbit ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="absolute w-36 h-36 rounded-full border-2 border-dashed pointer-events-none"
                style={{ borderColor: 'rgba(238,42,123,0.25)' }}
              />
              {/* Inner glow */}
              <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }} />

              {/* My avatar */}
              <motion.div
                onClick={handleAvatarClick}
                title="Change your photo"
                whileHover={{ scale: 1.1, zIndex: 20 }}
                className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group -mr-4"
                style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
              >
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center w-full h-full text-3xl font-bold text-white">{user?.name?.[0]?.toUpperCase() ?? '?'}</span>
                }
                {uploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiOutlineCamera className="text-white text-xl" />
                  </div>
                )}
              </motion.div>

              {/* Logo badge — the real brand mark, animated exactly like the Login page */}
              <div
                className="relative z-30 w-12 h-12 rounded-full bg-white shadow-lg border border-rose-100 flex items-center justify-center shrink-0"
                style={{ boxShadow: '0 0 0 4px rgba(238,42,123,0.08)' }}
              >
                <AnimatedLogo className="w-7 h-7" />
              </div>

              {/* Partner avatar */}
              <motion.div
                whileHover={{ scale: 1.1, zIndex: 20 }}
                className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl -ml-4"
                style={{ background: 'linear-gradient(135deg, #f26e4e, #f9ce34)' }}
              >
                {partner.avatarUrl
                  ? <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center w-full h-full text-3xl font-bold text-white">{partner.name?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </motion.div>

              {/* Names under avatars */}
              <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-1">
                <p className="text-[10px] font-semibold text-gray-500 text-center w-20">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] font-semibold text-[#ee2a7b] text-center w-20">{partner.name?.split(' ')[0]}</p>
              </div>
            </div>

            {/* Greeting text */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-w-0 text-center sm:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 mb-3">
                <span className="text-xs font-semibold text-[#ee2a7b]">Connected with love</span>
                <span className="text-xs">✨</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-[#8b1c31] mb-2">
                {greetingEmoji()} Hello,{' '}
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #ee2a7b, #f26e4e, #f9ce34)' }}>
                  {firstName}
                </span>!
              </h1>
              <p className="text-gray-500 text-base max-w-md">
                Welcome back to your space —{' '}
                <span className="font-semibold text-[#ee2a7b]">{partner.name}</span> is waiting for you 💌
              </p>
            </motion.div>
          </div>
        ) : (
          /* ── SOLO VIEW ── */
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              onClick={handleAvatarClick}
              whileHover={{ scale: 1.08 }}
              className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md select-none cursor-pointer group overflow-hidden border-2 border-white/50"
              style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : (user?.name ? user.name[0].toUpperCase() : '?')
              }
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <HiOutlineCamera className="text-white text-xl" />
                </div>
              )}
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        )}

        {avatarNotice && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${avatarNotice.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
            {avatarNotice.text}
          </div>
        )}

        {!partner && (
          <>
            <h1 className="text-3xl md:text-5xl font-bold text-[#8b1c31] mb-3">
              {greetingEmoji()} Hello,{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #ee2a7b, #f26e4e, #f9ce34)' }}>
                {firstName}
              </span>!
            </h1>
            <p className="text-gray-500 text-lg max-w-xl">Welcome back to your space.</p>
          </>
        )}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {widgets.map((widget, idx) => (
          <motion.div
            key={widget.path}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + idx * 0.07 }}
            whileHover={{ y: -6, scale: 1.04 }}
            onClick={() => navigate(widget.path)}
            className={`bg-gradient-to-br ${widget.bg} p-5 rounded-2xl shadow-sm cursor-pointer border border-white/80 hover:shadow-md transition-all group col-span-1`}
          >
            <div className={`p-3 rounded-xl bg-white/70 inline-block mb-3 shadow-sm group-hover:scale-110 transition-transform ${widget.color}`}>
              <widget.icon className="text-2xl" />
            </div>
            <h2 className="text-sm font-bold text-[#8b1c31]">{widget.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{widget.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Memories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass p-8 rounded-[2rem] shadow-sm"
      >
        <h2 className="text-2xl font-bold text-[#8b1c31] mb-6 flex items-center gap-2">
          <HiOutlinePhotograph className="text-[#ee2a7b]" /> Recent Memories
        </h2>

        {recentMemories.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-gray-400 font-medium">No memories yet</p>
            <p className="text-gray-300 text-sm mt-1">Go to Gallery to add your first one!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/gallery')}
              className="mt-4 px-5 py-2 rounded-xl bg-rose-100 text-[#ee2a7b] text-sm font-semibold hover:bg-rose-200 transition"
            >
              Open Gallery →
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMemories.map((memory, i) => (
              <motion.div
                key={memory._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                onClick={() => navigate('/gallery')}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 hover:bg-white/60 transition cursor-pointer group"
              >
                {memory.imageUrl ? (
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-xl">
                    📸
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-semibold truncate">{memory.title}</p>
                  <p className="text-xs text-gray-400 truncate">{memory.description}</p>
                </div>
                <p className="text-xs text-gray-300 whitespace-nowrap">
                  {new Date(memory.date).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      {/* Floating Report Button */}
      <motion.button
        id="floating-report-btn"
        onClick={() => navigate('/report')}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        title="Report an issue"
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow group"
        style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
      >
        <HiOutlineExclamationCircle className="text-2xl group-hover:rotate-12 transition-transform" />
      </motion.button>
    </motion.div>
  );
}

export default Dashboard;
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineCalendar, HiOutlinePhotograph, HiOutlineCamera, HiOutlineMicrophone, HiOutlinePencilAlt, HiOutlineUserAdd, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

function Dashboard() {
  const { user, backendUrl, updateAvatarUrl } = useAuth();
  const navigate = useNavigate();
  const [recentMemories, setRecentMemories] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState(null);
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
  }, [backendUrl]);

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

  const widgets = [
    { title: 'My Gallery', icon: HiOutlinePhotograph, path: '/gallery', color: 'text-blush-500', bg: 'from-blush-50 to-pink-50', desc: 'Photos & memories' },
    { title: 'Calendar', icon: HiOutlineCalendar, path: '/calendar', color: 'text-sky-500', bg: 'from-sky-50 to-blue-50', desc: 'Important dates' },
    { title: 'Mood Journal', icon: HiOutlineHeart, path: '/mood', color: 'text-rose-400', bg: 'from-rose-50 to-pink-50', desc: 'Track your feelings' },
    { title: 'Snap', icon: HiOutlineCamera, path: '/snap', color: 'text-violet-500', bg: 'from-violet-50 to-purple-50', desc: 'Camera selfies' },
    { title: 'Voice Notes', icon: HiOutlineMicrophone, path: '/voice', color: 'text-amber-500', bg: 'from-amber-50 to-yellow-50', desc: 'Record your voice' },
    { title: 'Messages', icon: HiOutlinePencilAlt, path: '/messages', color: 'text-teal-500', bg: 'from-teal-50 to-emerald-50', desc: 'Notes & letters' },
    { title: user?.partnerId ? 'Partner Linked' : 'Invite Partner', icon: HiOutlineUserAdd, path: '/invite', color: 'text-mint-500', bg: 'from-mint-50 to-emerald-50', desc: user?.partnerId ? 'Connected' : 'Share a code' },
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
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blush-400 via-white to-sky-400" />
        {/* Avatar bubble */}
        <div className="flex items-center gap-4 mb-4">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
          />
          <div 
            onClick={handleAvatarClick}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blush-300 to-sky-300 flex items-center justify-center text-2xl font-bold text-white shadow-md select-none cursor-pointer group overflow-hidden border-2 border-white/50"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name[0].toUpperCase() : '?'
            )}
            
            {uploadingAvatar ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <HiOutlineCamera className="text-white text-xl" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
          </div>
        </div>
        {avatarNotice && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
            avatarNotice.type === 'error'
              ? 'bg-red-50 text-red-600'
              : 'bg-mint-50 text-mint-700'
          }`}>
            {avatarNotice.text}
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-3">
          {greetingEmoji()} Hello, <span className="text-blush-500">{firstName}</span>!
        </h1>
        <p className="text-gray-500 text-lg max-w-xl">
          Welcome
        </p>
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
            <h2 className="text-sm font-bold text-gray-800">{widget.title}</h2>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <HiOutlinePhotograph className="text-blush-500" /> Recent Memories
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
              className="mt-4 px-5 py-2 rounded-xl bg-blush-100 text-blush-600 text-sm font-semibold hover:bg-blush-200 transition"
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
                  <div className="w-12 h-12 rounded-xl bg-blush-100 flex items-center justify-center text-xl">
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
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blush-400 to-sky-400 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow group"
      >
        <HiOutlineExclamationCircle className="text-2xl group-hover:rotate-12 transition-transform" />
      </motion.button>
    </motion.div>
  );
}

export default Dashboard;

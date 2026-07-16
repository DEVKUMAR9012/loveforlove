import { useId } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlinePhotograph,
  HiOutlineCalendar,
  HiOutlineHeart,
  HiOutlineCamera,
  HiOutlineMail,
  HiOutlineMicrophone,
  HiOutlineLogout,
  HiOutlineCog,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const navItems = [
  { label: 'Home', to: '/', icon: HiOutlineHome },
  { label: 'Gallery', to: '/gallery', icon: HiOutlinePhotograph },
  { label: 'Calendar', to: '/calendar', icon: HiOutlineCalendar },
  { label: 'Mood', to: '/mood', icon: HiOutlineHeart },
  { label: 'Snap', to: '/snap', icon: HiOutlineCamera },
  { label: 'Messages', to: '/messages', icon: HiOutlineMail },
  { label: 'Voice', to: '/voice', icon: HiOutlineMicrophone },
  { label: 'Settings', to: '/settings', icon: HiOutlineCog },
];

// Draw-in variants for each ribbon stroke — same as the Login page logo.
const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, delay: i * 0.25, ease: 'easeInOut' },
      opacity: { duration: 0.3, delay: i * 0.25 },
    },
  }),
};

// Small woven-heart mark, matching the Login/About logo.
const LogoMark = ({ className }) => {
  const uid = useId();
  const gradId = `sidebarLogoGradient-${uid}`;
  const gradSoftId = `sidebarLogoGradientSoft-${uid}`;

  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ee2a7b" />
          <stop offset="50%" stopColor="#f26e4e" />
          <stop offset="100%" stopColor="#f9ce34" />
        </linearGradient>
        <linearGradient id={gradSoftId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ee2a7b" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#f26e4e" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f9ce34" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <motion.path
        d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
        fill="none"
        stroke={`url(#${gradSoftId})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={drawPath}
      />
      <motion.path
        d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={drawPath}
      />
    </svg>
  );
};

// Wraps LogoMark: strokes draw themselves in, then settle into a gentle,
// looping heartbeat pulse — same rhythm as the Login page logo.
const AnimatedLogo = ({ className }) => (
  <motion.div
    className="inline-block"
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1, 1.08, 1, 1.05, 1] }}
    transition={{
      duration: 1.6,
      delay: 1.4,
      repeat: Infinity,
      repeatDelay: 1.8,
      ease: 'easeInOut',
    }}
  >
    <LogoMark className={className} />
  </motion.div>
);

function Sidebar() {
  const { user, logout } = useAuth();
  const firstLetter = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <aside className="fixed bottom-0 w-full md:relative flex md:flex-col md:h-screen md:w-full md:max-w-[280px] bg-white md:border-r border-t md:border-t-0 border-gray-100 md:px-5 md:py-8 z-50">
      {/* Brand - hidden on mobile */}
      <div className="hidden md:flex flex-col items-center mb-8">
        <AnimatedLogo className="w-16 h-16 mb-1 drop-shadow-sm" />
        <p className="text-sm text-sky-500 font-medium flex items-center gap-1">
          Together Forever <span aria-hidden="true">✨</span>
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex md:flex-col w-full overflow-x-auto md:overflow-visible gap-2 px-2 py-2 md:p-0 hide-scrollbar items-center md:items-stretch">
        {navItems.map(({ label, to, icon: Icon }, i) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: isActive ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:px-4 md:py-3.5 rounded-2xl font-semibold text-xs md:text-base transition-colors min-w-[4.5rem] md:min-w-0 flex-shrink-0 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-500 hover:bg-rose-50 hover:text-[#8b1c31]'
                }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(135deg, #ee2a7b, #f26e4e)' }
                    : undefined
                }
              >
                <Icon className={`text-xl md:text-xl shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className={`${!isActive ? 'hidden md:block' : 'block'}`}>{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/admin">
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: isActive ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:px-4 md:py-3.5 rounded-2xl font-semibold text-xs md:text-base transition-colors min-w-[4.5rem] md:min-w-0 flex-shrink-0 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(135deg, #a855f7, #ec4899)' }
                    : undefined
                }
              >
                <HiOutlineShieldCheck className={`text-xl md:text-xl shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className={`${!isActive ? 'hidden md:block' : 'block'}`}>Admin</span>
              </motion.div>
            )}
          </NavLink>
        )}
        
        {/* Mobile Logout Button */}
        <button
          onClick={logout}
          className="md:hidden flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-colors min-w-[4.5rem] flex-shrink-0 text-gray-500 hover:bg-rose-50 hover:text-[#8b1c31]"
        >
          <HiOutlineLogout className="text-xl" />
          <span className="text-xs font-semibold">Logout</span>
        </button>
      </nav>

      {/* Account - hidden on mobile */}
      <div className="hidden md:flex flex-col gap-3 mt-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-50 border border-sky-100">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
          >
            {firstLetter}
          </div>
          <span className="text-sm text-gray-500 font-medium truncate">{user?.email}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-rose-200 text-[#ee2a7b] font-bold hover:bg-rose-50 transition-colors"
        >
          <HiOutlineLogout className="text-lg" />
          Logout
        </motion.button>
      </div>
    </aside>
  );
}

export default Sidebar;
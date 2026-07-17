import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedMainLogo } from '../MainLogo';
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
  HiOutlineShieldCheck,
  HiOutlineLocationMarker
} from 'react-icons/hi';

const navItems = [
  { label: 'Home', to: '/', icon: HiOutlineHome },
  { label: 'Gallery', to: '/gallery', icon: HiOutlinePhotograph },
  { label: 'Calendar', to: '/calendar', icon: HiOutlineCalendar },
  { label: 'Mood', to: '/mood', icon: HiOutlineHeart },
  { label: 'Snap', to: '/snap', icon: HiOutlineCamera },
  { label: 'Messages', to: '/messages', icon: HiOutlineMail },
  { label: 'Voice', to: '/voice', icon: HiOutlineMicrophone },
  { label: 'Location', to: '/location', icon: HiOutlineLocationMarker },
  { label: 'Settings', to: '/settings', icon: HiOutlineCog },
];


function Sidebar() {
  const { user, logout } = useAuth();
  const firstLetter = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <aside className="fixed bottom-0 w-full md:relative flex md:flex-col md:h-screen md:w-full md:max-w-[280px] bg-white md:border-r border-t md:border-t-0 border-gray-100 md:px-5 md:py-8 z-50">
      {/* Hidden SVG for Icon Gradient */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ee2a7b" />
            <stop offset="50%" stopColor="#f26e4e" />
            <stop offset="100%" stopColor="#f9ce34" />
          </linearGradient>
        </defs>
      </svg>
      {/* Brand - hidden on mobile */}
      <div className="hidden md:flex flex-col items-center mb-8">
        <AnimatedMainLogo className="w-16 h-16 mb-1 drop-shadow-sm" />
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
                <Icon
                  className="text-xl md:text-xl shrink-0"
                  style={{
                    stroke: isActive ? 'white' : 'url(#icon-gradient)',
                    color: isActive ? 'white' : 'transparent',
                  }}
                />
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
                <HiOutlineShieldCheck
                  className="text-xl md:text-xl shrink-0"
                  style={{
                    stroke: isActive ? 'white' : 'url(#icon-gradient)',
                    color: isActive ? 'white' : 'transparent',
                  }}
                />
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
          <HiOutlineLogout
            className="text-xl"
            style={{ stroke: 'url(#icon-gradient)', color: 'transparent' }}
          />
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
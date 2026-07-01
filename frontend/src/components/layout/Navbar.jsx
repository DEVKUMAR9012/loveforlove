import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiOutlineHome, 
  HiOutlinePhotograph, 
  HiOutlineCalendar, 
  HiOutlineHeart, 
  HiOutlineChatAlt2,
  HiOutlineMicrophone,
  HiOutlineMail
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', name: 'Home', icon: HiOutlineHome },
  { path: '/gallery', name: 'Gallery', icon: HiOutlinePhotograph },
  { path: '/calendar', name: 'Calendar', icon: HiOutlineCalendar },
  { path: '/mood', name: 'Mood', icon: HiOutlineHeart },
  { path: '/prompts', name: 'Prompts', icon: HiOutlineChatAlt2 },
  { path: '/messages', name: 'Messages', icon: HiOutlineMail },
  { path: '/voice', name: 'Voice', icon: HiOutlineMicrophone },
];

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-0 w-full md:relative md:w-64 h-20 md:h-screen glass z-50 flex md:flex-col justify-between items-center md:items-start p-4 shadow-lg border-t md:border-t-0 md:border-r border-white/40">
      
      <div className="hidden md:block w-full text-center mb-8 mt-4">
        <h1 className="text-2xl font-bold text-blush-600 tracking-wide">arudev</h1>
        <p className="text-xs text-sky-600 mt-1">Together Forever ✨</p>
      </div>

      <div className="flex md:flex-col flex-1 w-full justify-around md:justify-start gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col md:flex-row items-center gap-2 p-2 md:p-4 rounded-2xl transition-all duration-300 w-full ${
                isActive 
                  ? 'bg-gradient-to-r from-blush-400 to-blush-500 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-blush-100 hover:text-blush-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`text-2xl md:text-xl ${isActive ? 'text-white' : ''}`} />
                <span className={`text-xs md:text-base font-medium ${!isActive && 'hidden md:block'}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:block w-full mt-auto">
        <div className="p-4 bg-sky-50 rounded-2xl mb-4 border border-sky-100 shadow-sm text-center">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-white/80 text-blush-600 font-semibold rounded-xl border border-blush-200 hover:bg-blush-50 hover:text-blush-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

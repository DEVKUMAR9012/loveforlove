import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheckCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef(null);

  // Mock notifications for now
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to LoveForLove! 🎉', message: 'We are so happy you are here.', isRead: false },
    { id: 2, title: 'Partner connected!', message: 'You and your partner are now linked.', isRead: true },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-sky-100 hover:bg-sky-50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <HiOutlineBell className="text-2xl text-sky-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blush-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blush-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 bg-sky-50/50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                >
                  <HiOutlineCheckCircle /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && <div className="h-2 w-2 bg-blush-500 rounded-full mt-1.5"></div>}
                    </div>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 text-center bg-gray-50 border-t border-gray-100">
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                View all history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

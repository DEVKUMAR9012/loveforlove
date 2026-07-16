import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineRefresh } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, backendUrl } = useAuth();
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      // Ensure array
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Notification fetch error:', err);
      setError(err.message);
      // Keep old data if exists
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Fetch initial notifications and setup SSE
  useEffect(() => {
    fetchNotifications();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`${backendUrl}/api/notifications/stream?token=${token}`);
    
    eventSource.onmessage = (e) => {
      try {
        const newNotif = JSON.parse(e.data);
        setNotifications(prev => [newNotif, ...prev.filter(n => n._id !== newNotif._id)]);
        setLatestNotification(newNotif);
        
        // Hide toast after 5 seconds
        setTimeout(() => setLatestNotification(null), 5000);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchNotifications, backendUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark all as read on the server
  const markAllAsRead = async () => {
    const previous = [...notifications];
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const res = await fetch(`${backendUrl}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    } catch (err) {
      // Revert on failure
      setNotifications(previous);
      console.error(err);
    }
  };

  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(); // refresh on open
        }}
        className="relative p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-sky-100 hover:bg-sky-50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <HiOutlineBell className="text-2xl text-sky-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blush-500 text-white text-xs font-bold shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Real-time Toast Popup */}
      <AnimatePresence>
        {latestNotification && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-72 bg-white p-3 rounded-xl shadow-2xl border border-sky-100 z-50 cursor-pointer"
            onClick={() => {
              setIsOpen(true);
              setLatestNotification(null);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="bg-blush-50 p-2 rounded-full text-blush-500">
                <HiOutlineBell className="text-xl" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-800">{latestNotification.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{latestNotification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
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

            {/* Body */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-6 flex items-center justify-center text-gray-400">
                  <HiOutlineRefresh className="animate-spin mr-2" /> Loading...
                </div>
              ) : error && notifications.length === 0 ? (
                <div className="p-6 text-center text-red-400 text-sm">Failed to load notifications.</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif._id}
                    className={`px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={`text-sm ${
                          !notif.isRead ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && <div className="h-2 w-2 bg-blush-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                    {notif.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 text-center bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {/* navigate to /notifications if needed */}}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                View all history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

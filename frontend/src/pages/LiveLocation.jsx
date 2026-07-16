import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLocation, useLocationSocket } from '../hooks/useLocation';
import { LocationMap } from '../components/LocationMap';
import {
  calculateDistance,
  formatDistance,
  getTimeAgo,
  getMovementStatus,
} from '../utils/locationUtils';
import './LiveLocation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function LiveLocation() {
  const { user, token } = useAuth();
  const { location, error: locError, isWatching, battery, startWatching, stopWatching } =
    useLocation();

  const [socket, setSocket] = useState(null);
  const [partner, setPartner] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [partnerTrail, setPartnerTrail] = useState([]);
  const [distance, setDistance] = useState(null);
  const [isMovingToward, setIsMovingToward] = useState(false);
  const [sharingActive, setSharingActive] = useState(true);
  const [showHugAnimation, setShowHugAnimation] = useState(false);
  const [showArrivalAnimation, setShowArrivalAnimation] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const arrivalTimeoutRef = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('location:update', (data) => {
      setPartnerLocation(data);
      setPartnerTrail((prev) => {
        const newTrail = [...prev, [data.latitude, data.longitude]];
        if (newTrail.length > 50) newTrail.shift(); // Keep last 50 points
        return newTrail;
      });
    });

    newSocket.on('hug:received', (data) => {
      setShowHugAnimation(true);
      // Haptic feedback if available
      navigator.vibrate?.([200, 100, 200]);
      setTimeout(() => setShowHugAnimation(false), 1000);
    });

    newSocket.on('arrival:celebrate', (data) => {
      setShowArrivalAnimation(true);
      navigator.vibrate?.([100, 50, 100, 50, 100]);
      setTimeout(() => setShowArrivalAnimation(false), 3000);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  // Use Socket.io for location broadcasting
  useLocationSocket(socket, location, battery);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch partner location
        const locRes = await fetch(`${API_URL}/api/location/partner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (locRes.ok) {
          const data = await locRes.json();
          setPartner(data.partner);
          setPartnerLocation(data.location);
          if (data.location?.latitude && data.location?.longitude) {
            setPartnerTrail([[data.location.latitude, data.location.longitude]]);
          }
        }

        // Fetch safe zones
        const zonesRes = await fetch(`${API_URL}/api/location/safe-zones`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (zonesRes.ok) {
          const data = await zonesRes.json();
          setSafeZones(data.safeZones || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load location data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token]);

  // Calculate distance
  useEffect(() => {
    if (location && partnerLocation) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        partnerLocation.latitude,
        partnerLocation.longitude
      );
      setDistance(dist);

      // Check if partner is moving toward us
      if (partnerLocation.speed > 1) {
        import('../utils/locationUtils').then((utils) => {
          if (utils.isMovingTowardTarget) {
             setIsMovingToward(
               utils.isMovingTowardTarget(
                 partnerLocation.latitude,
                 partnerLocation.longitude,
                 location.latitude,
                 location.longitude,
                 partnerLocation.heading,
                 partnerLocation.speed
               )
             );
          }
        });
      } else {
        setIsMovingToward(false);
      }

      // Check for arrival (within 500m)
      if (dist < 0.5 && arrivalTimeoutRef.current === null) {
        setShowArrivalAnimation(true);
        if (socket) socket.emit('arrival:celebrate', {});
        navigator.vibrate?.([100, 50, 100, 50, 100]);

        arrivalTimeoutRef.current = setTimeout(() => {
          arrivalTimeoutRef.current = null;
        }, 30000);
      }
    }
  }, [location, partnerLocation, socket]);

  // Start location watching on mount
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  // Update location on server
  useEffect(() => {
    if (!location || !isWatching) return;

    const updateLocationOnServer = async () => {
      try {
        await fetch(`${API_URL}/api/location/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            battery: battery,
            speed: location.speed,
            heading: location.heading,
          }),
        });
      } catch (err) {
        console.error('Error updating location on server:', err);
      }
    };

    updateLocationOnServer();
  }, [location, battery, token, isWatching]);

  const handleSendHug = () => {
    if (socket) {
      socket.emit('hug:send', {});
      setShowHugAnimation(true);
      navigator.vibrate?.([100, 50, 100]);
      setTimeout(() => setShowHugAnimation(false), 600);
    }
  };

  const handleToggleSharing = async () => {
    try {
      const endpoint = sharingActive
        ? '/api/location/pause'
        : '/api/location/resume';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSharingActive(!sharingActive);
      }
    } catch (err) {
      console.error('Error toggling sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="live-location-loading">
        <div className="spinner"></div>
        <p>Loading live location...</p>
      </div>
    );
  }

  return (
    <div className="live-location-container">
      {/* Background with gradient */}
      <div className="location-gradient-bg"></div>

      {/* Map */}
      <div className="map-wrapper" style={{ marginTop: '20px', borderRadius: '24px', overflow: 'hidden', height: 'calc(100% - 20px)' }}>
        <LocationMap
          myLocation={location}
          partnerLocation={partnerLocation}
          safeZones={safeZones}
          user={user}
          partner={partner}
          partnerTrail={partnerTrail}
        />

        {/* Distance / ETA badge (Top Card) */}
        {distance !== null && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-3 z-[1000]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-800">
                {formatDistance(distance)} away
              </span>
              {partnerLocation?.speed > 0 && (
                <span className="text-xs font-medium text-sky-500">
                  ETA: {Math.max(1, Math.round((distance / (partnerLocation.speed * 3.6)) * 60))} min
                </span>
              )}
            </div>
            {isMovingToward && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                On my way
              </span>
            )}
          </motion.div>
        )}

        {/* Sharing status */}
        {!sharingActive && (
          <div className="pause-badge">
            ⏸️ Sharing paused
          </div>
        )}

        {/* Hug animation */}
        {showHugAnimation && (
          <motion.div
            className="hug-animation"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            💛
          </motion.div>
        )}

        {/* Arrival celebration */}
        {showArrivalAnimation && <ArrivalConfetti />}
      </div>

      {/* Bottom sheet */}
      <motion.div
        className="bottom-sheet"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="sheet-handle"></div>

        {partnerLocation && (
          <div className="partner-status">
            <div className="partner-info">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blush-200">
                {partner?.avatarUrl ? (
                  <img src={partner.avatarUrl} alt="Partner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blush-100 flex items-center justify-center text-blush-600 font-bold text-lg">
                    {partner?.name ? partner.name[0] : '💛'}
                  </div>
                )}
              </div>
              <div className="partner-details">
                <h3 className="font-bold text-gray-800 text-base">{partner?.name || 'Partner'}</h3>
                <p className="flex flex-col gap-0.5 mt-0.5">
                  <span className="status-indicator">
                    <span className="status-dot"></span>
                    {getMovementStatus(partnerLocation.speed)} 
                    {partnerLocation.address && ` • ${partnerLocation.address.split(',')[0]}`}
                  </span>
                </p>
                {partnerLocation.lastUpdated && (
                  <p className="last-seen">
                    Last updated {getTimeAgo(partnerLocation.lastUpdated)}
                  </p>
                )}
              </div>
            </div>
            {partnerLocation.battery && (
              <div className="battery-badge">🔋 {Math.round(partnerLocation.battery)}%</div>
            )}
          </div>
        )}

        <div className="actions">
          <motion.button
            className="action-btn btn-primary"
            onClick={handleSendHug}
            whileTap={{ scale: 0.95 }}
          >
            🤗 Send Hug
          </motion.button>
          <motion.button
            className="action-btn btn-secondary"
            onClick={handleToggleSharing}
            whileTap={{ scale: 0.95 }}
          >
            {sharingActive ? '⏸️ Pause sharing' : '▶️ Resume sharing'}
          </motion.button>
        </div>

        <div className="quick-actions">
          <div className="flex flex-col items-center gap-1">
            <div className="quick-action" title="Ride">🚗</div>
            <span className="text-[10px] text-gray-500 font-medium">Ride</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="quick-action" title="Message">💬</div>
            <span className="text-[10px] text-gray-500 font-medium">Chat</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="quick-action" title="Weather">☔</div>
            <span className="text-[10px] text-gray-500 font-medium">Weather</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="quick-action" title="Call">📞</div>
            <span className="text-[10px] text-gray-500 font-medium">Call</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {locError && <div className="error-message">{locError}</div>}
      </motion.div>
    </div>
  );
}

// Confetti animation component
function ArrivalConfetti() {
  return (
    <div className="confetti-container">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="confetti"
          initial={{
            opacity: 1,
            x: Math.random() * 100 - 50,
            y: -10,
          }}
          animate={{
            opacity: 0,
            x: Math.random() * 200 - 100,
            y: window.innerHeight,
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: 'easeIn',
          }}
        >
          {['💛', '💚', '💕', '🎉'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import {
  FiClock,
  FiCloudRain,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiPause,
  FiPhoneCall,
  FiPlay,
  FiShield,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLocation, useLocationSocket } from '../hooks/useLocation';
import { LocationMap } from '../components/LocationMap';
import { getApiBaseUrl } from '../utils/api';
import {
  calculateDistance,
  formatDistance,
  getTimeAgo,
  getMovementStatus,
  isMovingTowardTarget,
} from '../utils/locationUtils';
import './LiveLocation.css';

const API_URL = getApiBaseUrl();
const TRAIL_RETENTION_MS = 48 * 60 * 60 * 1000;
const ARRIVAL_DISTANCE_KM = 0.5;
const TOGETHER_DISTANCE_KM = 0.05;
const NEAR_DISTANCE_KM = 0.1;

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getZoneKey(zone) {
  return zone?._id || zone?.id || zone?.name;
}

function toTrailPoint(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    timestamp: location?.timestamp || location?.lastUpdated || new Date().toISOString(),
  };
}

function pruneTrail(points) {
  const cutoff = Date.now() - TRAIL_RETENTION_MS;

  return points
    .filter((point) => {
      const timestamp = new Date(point.timestamp || Date.now()).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    })
    .slice(-80);
}

function getEtaMinutes(distanceKm, speedMs) {
  const speedKmh = Number(speedMs) * 3.6;

  if (!Number.isFinite(distanceKm) || !Number.isFinite(speedKmh) || speedKmh < 2) {
    return null;
  }

  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

function getDisplayDistance(myLocation, partnerLocation, fallbackDistance) {
  if (myLocation && partnerLocation) {
    return calculateDistance(
      myLocation.latitude,
      myLocation.longitude,
      partnerLocation.latitude,
      partnerLocation.longitude
    );
  }

  return Number.isFinite(Number(fallbackDistance)) ? Number(fallbackDistance) : null;
}

function getJourneyText(distanceKm, etaMinutes) {
  if (distanceKm === null) return 'Waiting for both live markers';
  if (distanceKm <= TOGETHER_DISTANCE_KM) return "You're together! 💛";
  if (distanceKm < NEAR_DISTANCE_KM) return 'Right next to each other';

  return `${formatDistance(distanceKm)} away${etaMinutes ? ` · reaching in ${etaMinutes} min` : ''}`;
}

function getDistanceInsightText(distanceKm, distanceStats) {
  if (distanceKm !== null && distanceKm < NEAR_DISTANCE_KM) {
    return 'Right next to each other';
  }

  if (distanceStats) {
    const totalDistance = Number(distanceStats.totalDistanceApartKm || 0);
    return `${totalDistance.toLocaleString()} km apart`;
  }

  if (distanceKm !== null) return `${formatDistance(distanceKm)} apart now`;
  return 'Live distance';
}

function getMeetingInsightText(distanceStats, isTogetherNow) {
  if (isTogetherNow) return 'Together now';

  const meetings = Number(distanceStats?.meetingsThisMonth || 0);
  return `Met ${meetings} time${meetings === 1 ? '' : 's'}`;
}

function getShortAddress(location) {
  const address = location?.address || location?.placeName || '';
  if (!address) return '';

  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

function loadMemoryPins() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(localStorage.getItem('liveLocationMemoryPins') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export default function LiveLocation() {
  const { user } = useAuth();
  const token = getStoredToken();
  const { location, error: locError, isWatching, battery, startWatching, stopWatching } =
    useLocation();

  const [socket, setSocket] = useState(null);
  const [partner, setPartner] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [partnerTrail, setPartnerTrail] = useState([]);
  const [distance, setDistance] = useState(null);
  const [isMovingToward, setIsMovingToward] = useState(false);
  const [sharingActive, setSharingActive] = useState(true);
  const [partnerSharingActive, setPartnerSharingActive] = useState(true);
  const [showHugAnimation, setShowHugAnimation] = useState(false);
  const [showArrivalAnimation, setShowArrivalAnimation] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [activeZoneStatuses, setActiveZoneStatuses] = useState({});
  const [distanceStats, setDistanceStats] = useState(null);
  const [memoryPins, setMemoryPins] = useState(loadMemoryPins);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const arrivalTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const onMyWayNotifiedRef = useRef(false);
  const lastZoneStateRef = useRef({});

  const partnerName = partner?.name || 'Partner';
  const bothSharingActive = sharingActive && partnerSharingActive;

  const showToast = useCallback((message, tone = 'warm') => {
    setToast({ id: Date.now(), message, tone });
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const activePartnerZone = useMemo(
    () => safeZones.find((zone) => activeZoneStatuses[getZoneKey(zone)]),
    [activeZoneStatuses, safeZones]
  );

  const displayDistance = useMemo(
    () => getDisplayDistance(location, partnerLocation, distance),
    [distance, location, partnerLocation]
  );
  const isTogetherNow =
    bothSharingActive && displayDistance !== null && displayDistance <= TOGETHER_DISTANCE_KM;

  const etaMinutes = useMemo(
    () => getEtaMinutes(displayDistance, partnerLocation?.speed),
    [displayDistance, partnerLocation?.speed]
  );

  const journeyText = getJourneyText(displayDistance, etaMinutes);

  const lastUpdatedText = partnerLocation?.lastUpdated
    ? `Last updated ${getTimeAgo(partnerLocation.lastUpdated)}`
    : '';

  const statusLine = useMemo(() => {
    if (!sharingActive) return 'You paused location sharing';
    if (!partnerSharingActive) return `${partnerName} paused location sharing`;
    if (!partnerLocation) return `Waiting for ${partnerName}'s live location`;
    if (isTogetherNow) return "You're together right now";

    const place = getShortAddress(partnerLocation) || activePartnerZone?.name;
    if (place) return `${partnerName} is near ${place}`;

    return lastUpdatedText || `${partnerName}'s live location is on`;
  }, [
    activePartnerZone?.name,
    lastUpdatedText,
    partnerLocation,
    partnerName,
    partnerSharingActive,
    isTogetherNow,
    sharingActive,
  ]);

  const applyPartnerSnapshot = useCallback((data) => {
    const nextLocationState =
      data?.locationState ||
      (data?.location?.sharingActive === false ? 'paused' : data?.location ? 'live' : 'waiting');
    const nextLocation = data?.location
      ? {
          ...data.location,
          lastUpdated: data.location.lastUpdated || data.location.timestamp || new Date().toISOString(),
        }
      : null;

    setPartner(data?.partner || null);
    setPartnerLocation(nextLocation);
    setPartnerSharingActive(nextLocationState !== 'paused');

    const trailPoint = toTrailPoint(nextLocation);
    if (trailPoint) {
      setPartnerTrail((prev) => {
        const hasSamePoint = prev.some(
          (point) =>
            point.latitude === trailPoint.latitude &&
            point.longitude === trailPoint.longitude &&
            point.timestamp === trailPoint.timestamp
        );
        return hasSamePoint ? prev : pruneTrail([...prev, trailPoint]);
      });
    }

    if (Array.isArray(data?.trail)) {
      setPartnerTrail(pruneTrail(data.trail.map(toTrailPoint).filter(Boolean)));
    }

    if (Number.isFinite(Number(data?.distanceKm))) {
      setDistance(Number(data.distanceKm));
    } else if (!nextLocation) {
      setDistance(null);
    }
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (!token || !user?._id) return;

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
      if (data?.userId && String(data.userId) === String(user._id)) return;

      const nextLocation = {
        ...data,
        sharingActive: data?.sharingActive !== false,
        lastUpdated: data?.timestamp || data?.lastUpdated || new Date().toISOString(),
      };

      setPartnerSharingActive(nextLocation.sharingActive);
      setPartnerLocation((prev) => ({ ...prev, ...nextLocation }));

      const trailPoint = toTrailPoint(nextLocation);
      if (trailPoint) {
        setPartnerTrail((prev) => pruneTrail([...prev, trailPoint]));
      }
    });

    newSocket.on('location:sharing-state', (data) => {
      const isMe = data?.userId && String(data.userId) === String(user._id);
      const nextSharingState = data?.sharingActive === true;

      if (isMe) {
        setSharingActive(nextSharingState);
      } else {
        setPartnerSharingActive(nextSharingState);
        showToast(
          nextSharingState
            ? `${partnerName} resumed location sharing`
            : `${partnerName} paused location sharing`,
          'privacy'
        );
      }
    });

    newSocket.on('hug:received', () => {
      setShowHugAnimation(true);
      navigator.vibrate?.([200, 100, 200]);
      showToast(`${partnerName} sent you a hug`, 'warm');
      window.setTimeout(() => setShowHugAnimation(false), 1000);
    });

    newSocket.on('arrival:celebrate', () => {
      setShowArrivalAnimation(true);
      navigator.vibrate?.([100, 50, 100, 50, 100]);
      showToast('You found each other', 'celebrate');
      window.setTimeout(() => setShowArrivalAnimation(false), 3200);
    });

    newSocket.on('geofence:event', (data) => {
      if (data?.userId && String(data.userId) === String(user._id)) return;
      const eventText = data?.eventType === 'exit' ? 'left' : 'reached';
      showToast(`${partnerName} ${eventText} ${data?.zoneName || 'a safe zone'}`, 'zone');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [partnerName, showToast, token, user?._id]);

  // Use Socket.io for location broadcasting only while consent is active.
  useLocationSocket(socket, sharingActive ? location : null, battery);

  const fetchPartnerSnapshot = useCallback(async () => {
    if (!token) return false;

    const locRes = await fetch(`${API_URL}/api/location/partner`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!locRes.ok) return false;

    const data = await locRes.json();
    applyPartnerSnapshot(data);
    return Boolean(data.location);
  }, [applyPartnerSnapshot, token]);

  const fetchDistanceStats = useCallback(async () => {
    if (!token) return;

    const statsRes = await fetch(`${API_URL}/api/location/distance-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (statsRes.ok) {
      const data = await statsRes.json();
      setDistanceStats(data);
    }
  }, [token]);

  // Fetch initial data
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const headers = { Authorization: `Bearer ${token}` };

        await fetchPartnerSnapshot();
        if (cancelled) return;

        const zonesRes = await fetch(`${API_URL}/api/location/safe-zones`, { headers });
        if (zonesRes.ok) {
          const data = await zonesRes.json();
          if (!cancelled) setSafeZones(data.safeZones || []);
        }

        await fetchDistanceStats();
      } catch (err) {
        console.error('Error fetching initial data:', err);
        if (!cancelled) setError('Failed to load location data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, [fetchDistanceStats, fetchPartnerSnapshot, token]);

  useEffect(() => {
    if (!token) return undefined;

    const intervalId = window.setInterval(() => {
      fetchDistanceStats().catch((err) => {
        console.warn('Could not refresh distance stats:', err);
      });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchDistanceStats, token]);

  useEffect(() => {
    if (!token || partnerLocation || !sharingActive) return undefined;

    const intervalId = window.setInterval(() => {
      fetchPartnerSnapshot().catch((err) => {
        console.warn('Could not refresh partner location:', err);
      });
    }, 6000);

    fetchPartnerSnapshot().catch((err) => {
      console.warn('Could not refresh partner location:', err);
    });

    return () => window.clearInterval(intervalId);
  }, [fetchPartnerSnapshot, partnerLocation, sharingActive, token]);

  // Calculate distance, ETA state, and arrival celebration.
  useEffect(() => {
    if (!location || !partnerLocation) {
      setDistance(null);
      setIsMovingToward(false);
      return;
    }

    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      partnerLocation.latitude,
      partnerLocation.longitude
    );
    setDistance(dist);

    const speed = Number(partnerLocation.speed) || 0;
    const heading = Number(partnerLocation.heading);
    const movingToward =
      bothSharingActive &&
      Number.isFinite(heading) &&
      isMovingTowardTarget(
        partnerLocation.latitude,
        partnerLocation.longitude,
        location.latitude,
        location.longitude,
        heading,
        speed
      );

    setIsMovingToward(movingToward);

    if (bothSharingActive && dist < ARRIVAL_DISTANCE_KM && arrivalTimeoutRef.current === null) {
      setShowArrivalAnimation(true);
      showToast(dist <= TOGETHER_DISTANCE_KM ? "You're together now" : 'You found each other', 'celebrate');
      socket?.emit('arrival:celebrate', {});
      navigator.vibrate?.([100, 50, 100, 50, 100]);
      window.setTimeout(() => setShowArrivalAnimation(false), 3200);

      arrivalTimeoutRef.current = window.setTimeout(() => {
        arrivalTimeoutRef.current = null;
      }, 30000);
    }
  }, [bothSharingActive, location, partnerLocation, showToast, socket]);

  useEffect(() => {
    if (!isMovingToward || !bothSharingActive || onMyWayNotifiedRef.current) return;

    onMyWayNotifiedRef.current = true;
    const message = `${partnerName} is heading your way`;
    showToast(message, 'route');

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        body: etaMinutes ? `Reaching in ${etaMinutes} min` : 'Live location says they are moving toward you.',
      });
    }
  }, [bothSharingActive, etaMinutes, isMovingToward, partnerName, showToast]);

  useEffect(() => {
    if (!partnerLocation || safeZones.length === 0 || !bothSharingActive) {
      setActiveZoneStatuses({});
      return;
    }

    const nextStatuses = {};

    safeZones.forEach((zone) => {
      const zoneKey = getZoneKey(zone);
      const zoneDistance = calculateDistance(
        partnerLocation.latitude,
        partnerLocation.longitude,
        zone.latitude,
        zone.longitude
      );
      const isInside = zoneDistance <= (zone.radiusMeters || 500) / 1000;
      const previous = lastZoneStateRef.current[zoneKey];

      nextStatuses[zoneKey] = isInside;

      if (
        previous !== undefined &&
        previous !== isInside &&
        zone.notificationsEnabled !== false
      ) {
        const eventType = isInside ? 'enter' : 'exit';
        showToast(
          `${partnerName} ${isInside ? 'reached' : 'left'} ${zone.name}`,
          'zone'
        );
        socket?.emit('geofence:event', {
          zoneId: zoneKey,
          zoneName: zone.name,
          eventType,
        });
      }
    });

    lastZoneStateRef.current = { ...lastZoneStateRef.current, ...nextStatuses };
    setActiveZoneStatuses(nextStatuses);
  }, [bothSharingActive, partnerLocation, partnerName, safeZones, showToast, socket]);

  // Start location watching on mount
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  // Update location on server
  useEffect(() => {
    if (!location || !isWatching || !sharingActive || !token) return;

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
            battery,
            speed: location.speed,
            heading: location.heading,
          }),
        });
      } catch (err) {
        console.error('Error updating location on server:', err);
      }
    };

    updateLocationOnServer();
  }, [battery, isWatching, location, sharingActive, token]);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimeoutRef.current);
      window.clearTimeout(arrivalTimeoutRef.current);
    };
  }, []);

  const handleSendHug = () => {
    if (!bothSharingActive) {
      showToast('Both partners need sharing on before live hugs', 'privacy');
      return;
    }

    socket?.emit('hug:send', {});
    setShowHugAnimation(true);
    navigator.vibrate?.([100, 50, 100]);
    window.setTimeout(() => setShowHugAnimation(false), 600);
  };

  const handleToggleSharing = async () => {
    try {
      const nextSharingState = !sharingActive;
      const endpoint = sharingActive ? '/api/location/pause' : '/api/location/resume';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSharingActive(nextSharingState);
        socket?.emit('location:sharing-state', { sharingActive: nextSharingState });
        showToast(
          nextSharingState
            ? 'Location sharing resumed for both of you'
            : 'Sharing paused. Your partner can see it is paused.',
          'privacy'
        );

        if (nextSharingState) startWatching();
        else stopWatching();
      }
    } catch (err) {
      console.error('Error toggling sharing:', err);
      showToast('Could not update sharing state', 'privacy');
    }
  };

  const handleDropMemoryPin = () => {
    const source = partnerLocation || location;

    if (!source) {
      showToast('Wait for a live marker before saving a heart pin', 'privacy');
      return;
    }

    const pin = {
      id: `memory-${Date.now()}`,
      latitude: Number(source.latitude),
      longitude: Number(source.longitude),
      label: getShortAddress(source) || activePartnerZone?.name || 'Memory spot',
      createdAt: new Date().toISOString(),
    };
    const nextPins = [pin, ...memoryPins].slice(0, 16);

    setMemoryPins(nextPins);
    localStorage.setItem('liveLocationMemoryPins', JSON.stringify(nextPins));
    showToast('Heart pin saved here', 'celebrate');
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
      <div className="location-gradient-bg"></div>

      <div className="map-wrapper">
        <LocationMap
          myLocation={location}
          partnerLocation={partnerLocation}
          safeZones={safeZones}
          user={user}
          partner={partner}
          partnerTrail={partnerTrail}
          sharingActive={sharingActive}
          partnerSharingActive={partnerSharingActive}
          memoryPins={memoryPins}
        />

        <motion.div
          className="journey-card"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiNavigation aria-hidden="true" />
          <span>{journeyText}</span>
          {isMovingToward && <strong>On my way</strong>}
        </motion.div>

        <motion.div
          className="map-status-line"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiMapPin aria-hidden="true" />
          <span>{statusLine}</span>
          {lastUpdatedText && <small>{lastUpdatedText}</small>}
        </motion.div>

        {!bothSharingActive && (
          <div className="pause-badge">
            <FiPause aria-hidden="true" />
            {!sharingActive ? 'You paused sharing' : `${partnerName} paused sharing`}
          </div>
        )}

        {toast && (
          <motion.div
            key={toast.id}
            className={`live-toast live-toast-${toast.tone}`}
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
          >
            {toast.message}
          </motion.div>
        )}

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

        {showArrivalAnimation && <ArrivalConfetti />}
      </div>

      <motion.div
        className="bottom-sheet"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="sheet-handle"></div>

        <div className="partner-status">
          <div className="partner-info">
            <div className={`profile-avatar ${partnerSharingActive ? 'is-live' : 'is-paused'}`}>
              {partner?.avatarUrl ? (
                <img src={partner.avatarUrl} alt={partnerName} />
              ) : (
                <span>{partnerName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="partner-details">
              <h3>{partnerName}</h3>
              <p className="partner-status-copy">
                <span className={`status-indicator ${partnerSharingActive ? '' : 'is-paused'}`}>
                  <span className="status-dot"></span>
                  {partnerSharingActive
                    ? getMovementStatus(partnerLocation?.speed)
                    : 'Paused'}
                </span>
              </p>
              <p className="last-seen">{statusLine}</p>
            </div>
          </div>
          {partnerLocation?.battery && (
            <div className="battery-badge">Battery {Math.round(partnerLocation.battery)}%</div>
          )}
        </div>

        <div className="privacy-strip">
          <span className={`consent-pill ${sharingActive ? 'is-on' : 'is-paused'}`}>
            <FiShield aria-hidden="true" />
            You {sharingActive ? 'sharing' : 'paused'}
          </span>
          <span className={`consent-pill ${partnerSharingActive ? 'is-on' : 'is-paused'}`}>
            <FiShield aria-hidden="true" />
            {partnerName} {partnerSharingActive ? 'sharing' : 'paused'}
          </span>
          <span className="consent-pill is-muted">
            <FiClock aria-hidden="true" />
            Trail clears in 48h
          </span>
        </div>

        <div className="location-insights">
          <div className="insight-card">
            <strong>
              {getDistanceInsightText(displayDistance, distanceStats)}
            </strong>
            <span>{displayDistance !== null && displayDistance < NEAR_DISTANCE_KM ? 'live now' : distanceStats ? 'this month' : 'updates when both markers are live'}</span>
          </div>
          <div className="insight-card">
            <strong>
              {distanceStats ? getMeetingInsightText(distanceStats, isTogetherNow) : `${safeZones.length} safe zones`}
            </strong>
            <span>{isTogetherNow ? 'inside 50 m' : distanceStats ? 'this month' : 'Home, college, office alerts'}</span>
          </div>
        </div>

        {safeZones.length > 0 && (
          <div className="safe-zone-chips">
            {safeZones.map((zone) => {
              const zoneKey = getZoneKey(zone);
              return (
                <span
                  key={zoneKey}
                  className={`zone-chip ${activeZoneStatuses[zoneKey] ? 'is-active' : ''}`}
                >
                  {zone.emoji || '📍'} {zone.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="actions">
          <motion.button
            className="action-btn btn-primary"
            onClick={handleSendHug}
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            <FiHeart aria-hidden="true" />
            Send Hug
          </motion.button>
          <motion.button
            className="action-btn btn-secondary"
            onClick={handleToggleSharing}
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            {sharingActive ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
            {sharingActive ? 'Pause sharing' : 'Resume sharing'}
          </motion.button>
        </div>

        <div className="quick-actions">
          <QuickAction className="quick-action-ride" icon={<FiNavigation />} label="Ride" />
          <QuickAction className="quick-action-chat" icon={<FiMessageCircle />} label="Chat" />
          <QuickAction className="quick-action-weather" icon={<FiCloudRain />} label="Weather" />
          <QuickAction className="quick-action-call" icon={<FiPhoneCall />} label="Call" />
          <QuickAction className="quick-action-memory" icon={<FiHeart />} label="Memory" onClick={handleDropMemoryPin} />
        </div>

        {error && <div className="error-message">{error}</div>}
        {locError && <div className="error-message">{locError}</div>}
      </motion.div>
    </div>
  );
}

function QuickAction({ className, icon, label, onClick }) {
  return (
    <div className="quick-action-item">
      <button
        className={`quick-action ${className}`}
        title={label}
        onClick={onClick}
        type="button"
      >
        {React.cloneElement(icon, { 'aria-hidden': true })}
      </button>
      <span>{label}</span>
    </div>
  );
}

function ArrivalConfetti() {
  return (
    <div className="confetti-container">
      <div className="arrival-message">You found each other</div>
      {[...Array(28)].map((_, i) => (
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
            x: Math.random() * 240 - 120,
            y: window.innerHeight,
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: 'easeIn',
          }}
        >
          {['💛', '💕', '🎉', '✨'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}

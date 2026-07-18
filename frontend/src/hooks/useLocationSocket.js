import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { getApiBaseUrl } from '../utils/api';

const API_URL = getApiBaseUrl();
const LOCATION_EMIT_THROTTLE_MS = 9000;

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function needsSecureLocationContext() {
  if (typeof window === 'undefined') return false;
  return !window.isSecureContext && !isLoopbackHost(window.location.hostname);
}

function normalizePartnerLocation(payload) {
  if (!payload || payload.isSharing === false || payload.sharingActive === false) {
    return null;
  }

  const latitude = Number(payload.lat ?? payload.latitude);
  const longitude = Number(payload.lng ?? payload.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const battery = payload.batteryLevel ?? payload.battery ?? null;

  return {
    latitude,
    longitude,
    accuracy: payload.accuracy ?? null,
    speed: payload.speed ?? null,
    battery,
    batteryLevel: battery,
    sharingActive: payload.isSharing !== false,
    lastUpdated: payload.updatedAt || payload.timestamp || new Date().toISOString(),
  };
}

function getPositionPayload(position, batteryLevel) {
  const { coords } = position;

  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy,
    speed: coords.speed,
    batteryLevel,
  };
}

function getDisplayLocation(position, batteryLevel) {
  const { coords } = position;

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    speed: coords.speed,
    heading: coords.heading,
    battery: batteryLevel,
    batteryLevel,
    timestamp: new Date(),
  };
}

export function useLocationSocket({
  enabled = true,
  isSharing = true,
  token,
  onPartnerLocation,
  onPartnerSharingChanged,
} = {}) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [location, setLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [partnerSharingActive, setPartnerSharingActive] = useState(true);
  const [battery, setBattery] = useState(null);
  const [error, setError] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const batteryRef = useRef(null);
  const lastEmitAtRef = useRef(0);
  const onPartnerLocationRef = useRef(onPartnerLocation);
  const onPartnerSharingChangedRef = useRef(onPartnerSharingChanged);

  useEffect(() => {
    onPartnerLocationRef.current = onPartnerLocation;
  }, [onPartnerLocation]);

  useEffect(() => {
    onPartnerSharingChangedRef.current = onPartnerSharingChanged;
  }, [onPartnerSharingChanged]);

  useEffect(() => {
    batteryRef.current = battery;
  }, [battery]);

  useEffect(() => {
    let batteryManager = null;

    if (!navigator.getBattery && !navigator.battery) {
      return undefined;
    }

    const updateBattery = () => {
      if (!batteryManager) return;
      setBattery(Math.round(batteryManager.level * 100));
    };

    const setupBattery = async () => {
      try {
        batteryManager = await (navigator.getBattery?.() || navigator.battery);
        updateBattery();
        batteryManager.addEventListener?.('levelchange', updateBattery);
      } catch {
        // Battery status is optional and unsupported in many browsers.
      }
    };

    setupBattery();

    return () => {
      batteryManager?.removeEventListener?.('levelchange', updateBattery);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !token) {
      setIsConnected(false);
      return undefined;
    }

    const nextSocket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);
    setSocketError(null);

    const handleConnect = () => {
      setIsConnected(true);
      setSocketError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      setIsConnected(false);
      setSocketError(err?.message || 'Socket connection failed');
    };

    const handleLocationError = (payload) => {
      setSocketError(payload?.message || 'Location socket error');
    };

    const handlePartnerLocation = (payload) => {
      const normalized = normalizePartnerLocation(payload);
      if (!normalized) return;

      setPartnerSharingActive(true);
      setPartnerLocation(normalized);
      onPartnerLocationRef.current?.(payload, normalized);
    };

    const handlePartnerSharingChanged = (payload) => {
      const nextSharingState = payload?.isSharing === true;

      setPartnerSharingActive(nextSharingState);
      if (!nextSharingState) setPartnerLocation(null);
      onPartnerSharingChangedRef.current?.(payload, nextSharingState);
    };

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);
    nextSocket.on('connect_error', handleConnectError);
    nextSocket.on('location:error', handleLocationError);
    nextSocket.on('partner:location', handlePartnerLocation);
    nextSocket.on('partner:sharingChanged', handlePartnerSharingChanged);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.off('connect_error', handleConnectError);
      nextSocket.off('location:error', handleLocationError);
      nextSocket.off('partner:location', handlePartnerLocation);
      nextSocket.off('partner:sharingChanged', handlePartnerSharingChanged);
      nextSocket.close();

      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [enabled, token]);

  useEffect(() => {
    if (!enabled || !token || !isSharing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatching(false);
      return undefined;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return undefined;
    }

    if (needsSecureLocationContext()) {
      setError('Live GPS needs HTTPS on phone. Use the deployed HTTPS app or a secure tunnel for mobile testing.');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(getDisplayLocation(position, batteryRef.current));
        setError(null);

        const now = Date.now();
        if (now - lastEmitAtRef.current < LOCATION_EMIT_THROTTLE_MS) return;
        lastEmitAtRef.current = now;

        if (!socketRef.current?.connected) return;
        socketRef.current.emit('location:update', getPositionPayload(position, batteryRef.current));
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = watchId;
    setIsWatching(true);

    return () => {
      if (watchIdRef.current === watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
      }
    };
  }, [enabled, isSharing, token]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const emitSharingToggle = useCallback((nextSharingState) => (
    new Promise((resolve) => {
      const activeSocket = socketRef.current;
      if (!activeSocket?.connected) {
        resolve({ ok: false, message: 'Socket is not connected' });
        return;
      }

      activeSocket.timeout(5000).emit(
        'sharing:toggle',
        { isSharing: nextSharingState },
        (err, response) => {
          if (err) {
            resolve({ ok: false, message: 'Socket acknowledgement timed out' });
            return;
          }

          resolve(response || { ok: true, isSharing: nextSharingState });
        }
      );
    })
  ), []);

  return {
    socket,
    isConnected,
    location,
    partnerLocation,
    partnerSharingActive,
    battery,
    error,
    socketError,
    isWatching,
    emitSharingToggle,
  };
}

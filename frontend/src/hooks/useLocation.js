import { useEffect, useState, useRef, useCallback } from 'react';

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function needsSecureLocationContext() {
  if (typeof window === 'undefined') return false;
  return !window.isSecureContext && !isLoopbackHost(window.location.hostname);
}

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Request location permission
  const requestPermission = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
        return false;
      }

      if (needsSecureLocationContext()) {
        setError('Live GPS needs HTTPS on phone. Use the deployed HTTPS app or a secure tunnel for mobile testing.');
        return false;
      }

      // Mobile browsers require explicit permission; query when supported.
      if (navigator.permissions) {
        const permission = await navigator.permissions
          .query({ name: 'geolocation' })
          .catch(() => null);

        if (permission?.state === 'denied') {
          setError('Location permission denied. Please enable in settings.');
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  }, []);

  // Start watching location
  const startWatching = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          // Throttle updates to once per 5 seconds
          const now = Date.now();
          if (now - lastUpdateRef.current < 5000) return;
          lastUpdateRef.current = now;

          const { coords } = position;
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            speed: coords.speed, // in m/s
            heading: coords.heading, // in degrees
            timestamp: new Date(),
          });
          setError(null);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(err.message);
        },
        options
      );

      setIsWatching(true);
    } catch (err) {
      console.error('Error starting location watch:', err);
      setError(err.message);
    }
  }, [requestPermission]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Get battery status
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    if (!navigator.getBattery && !navigator.battery) {
      return;
    }

    const getBattery = async () => {
      try {
        const batStatus = await (navigator.getBattery?.() || navigator.battery);
        setBattery(batStatus.level * 100);

        batStatus.addEventListener?.('levelchange', () => {
          setBattery(batStatus.level * 100);
        });
      } catch (err) {
        console.warn('Battery API not available');
      }
    };

    getBattery();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isWatching,
    battery,
    startWatching,
    stopWatching,
    requestPermission,
  };
}

// Socket.io integration hook
export function useLocationSocket(socket, location, battery) {
  const emitInterval = useRef(null);

  useEffect(() => {
    if (!socket || !location) return;

    const emitLocation = () => {
      socket.emit('location:update', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        battery: battery,
        speed: location.speed,
        heading: location.heading,
      });
    };

    emitLocation();

    // Emit location every 10 seconds
    emitInterval.current = setInterval(() => {
      emitLocation();
    }, 10000);

    return () => {
      if (emitInterval.current) clearInterval(emitInterval.current);
    };
  }, [socket, location, battery]);
}

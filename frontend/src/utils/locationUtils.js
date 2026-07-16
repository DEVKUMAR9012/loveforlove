// Haversine formula — distance between two lat/lng points
// Returns distance in kilometers
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance for display
export function formatDistance(distanceKm) {
  if (!distanceKm) return '–';
  if (distanceKm < 0.001) return '< 1 m';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

// Detect if moving toward target
export function isMovingTowardTarget(
  currentLat,
  currentLng,
  targetLat,
  targetLng,
  bearingDegrees,
  speedMs,
  toleranceDegrees = 45
) {
  const targetBearing = calculateBearing(currentLat, currentLng, targetLat, targetLng);
  const bearingDifference = Math.abs(targetBearing - bearingDegrees);
  const normalizedDiff = Math.min(bearingDifference, 360 - bearingDifference);

  return normalizedDiff <= toleranceDegrees && speedMs > 1.4; // 1.4 m/s = 5 km/h
}

// Calculate bearing
function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// Format time ago
export function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Get status text based on speed
export function getMovementStatus(speedMs) {
  if (!speedMs || speedMs < 0.5) return '⏸️ Stationary';
  if (speedMs < 1.4) return '🚶 Walking';
  if (speedMs < 8) return '🚗 Driving';
  return '🚀 Fast moving';
}

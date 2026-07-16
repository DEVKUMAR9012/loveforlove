// Haversine formula — calculate distance between two lat/lng points
// Returns distance in kilometers
function calculateDistance(lat1, lng1, lat2, lng2) {
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

// Calculate bearing (direction) from point1 to point2
// Returns bearing in degrees (0–360)
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
  return (bearing + 360) % 360; // Normalize to 0–360
}

// Check if a point is within a geofence
// Returns true if distance from point to center < radius
function isWithinGeofence(
  pointLat,
  pointLng,
  centerLat,
  centerLng,
  radiusMeters
) {
  const distanceKm = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= radiusMeters;
}

// Detect if someone is moving toward a target
// Uses bearing and speed
function isMovingTowardTarget(
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

  // Normalize bearing difference to 0–180
  const normalizedDiff = Math.min(bearingDifference, 360 - bearingDifference);

  // Moving toward if bearing is within tolerance AND speed > 1.4 m/s (~5 km/h)
  return normalizedDiff <= toleranceDegrees && speedMs > 1.4;
}

// Format distance for display
// Input: distance in km, Output: "2.4 km" or "240 m"
function formatDistance(distanceKm) {
  if (distanceKm < 0.001) return '< 1 m';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

// Reverse geocode (placeholder — in production use OpenCage or Google API)
// For now, just return generic "Moving" or "At location"
function getReverseGeocodedAddress(latitude, longitude) {
  // TODO: Call OpenCage or Google Geocoding API
  // For Phase 1, just return a placeholder
  return 'Location detected';
}

module.exports = {
  calculateDistance,
  calculateBearing,
  isWithinGeofence,
  isMovingTowardTarget,
  formatDistance,
  getReverseGeocodedAddress,
};

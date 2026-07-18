const LocationHistory = require('../models/LocationHistory');
const User = require('../models/User');

class LocationServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getCoupleRoomName(userId, partnerId) {
  if (!userId || !partnerId) return null;
  const coupleId = [String(userId), String(partnerId)].sort().join(':');
  return `couple:${coupleId}`;
}

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function parseNumber(value, fieldName, { required = false, min = -Infinity, max = Infinity } = {}) {
  if (isMissing(value)) {
    if (required) throw new LocationServiceError(`${fieldName} is required`, 400);
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new LocationServiceError(`${fieldName} must be a valid number`, 400);
  }

  if (number < min || number > max) {
    throw new LocationServiceError(`${fieldName} must be between ${min} and ${max}`, 400);
  }

  return number;
}

function parseLocationPayload(body = {}) {
  return {
    lat: parseNumber(body.lat, 'lat', { required: true, min: -90, max: 90 }),
    lng: parseNumber(body.lng, 'lng', { required: true, min: -180, max: 180 }),
    accuracy: parseNumber(body.accuracy, 'accuracy', { min: 0 }),
    speed: parseNumber(body.speed, 'speed', { min: 0 }),
    batteryLevel: parseNumber(body.batteryLevel, 'batteryLevel', { min: 0, max: 100 }),
  };
}

function serializeOwnLocation(location) {
  return {
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    accuracy: location?.accuracy ?? null,
    speed: location?.speed ?? null,
    updatedAt: location?.updatedAt ?? null,
    isSharing: location?.isSharing !== false,
    batteryLevel: location?.batteryLevel ?? null,
  };
}

function serializePartnerLocation(location) {
  return {
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    updatedAt: location?.updatedAt ?? null,
    isSharing: location?.isSharing !== false,
    batteryLevel: location?.batteryLevel ?? null,
  };
}

async function saveUserLocation(userId, payload, { requireSharing = false } = {}) {
  if (!userId) {
    throw new LocationServiceError('Not authorized', 401);
  }

  const parsedLocation = parseLocationPayload(payload);
  const user = await User.findById(userId).select('location');

  if (!user) {
    throw new LocationServiceError('Not authorized', 401);
  }

  const isSharing = user.location?.isSharing !== false;
  
  // Ghost Mode strict privacy: block all updates (REST or Socket) if paused
  if (!isSharing) {
    return { ignored: true, reason: 'sharing_paused' };
  }

  const now = new Date();
  const nextLocation = {
    ...parsedLocation,
    updatedAt: now,
    isSharing,
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { location: nextLocation } },
    { new: true, runValidators: true, select: 'location' }
  );

  if (!updatedUser) {
    throw new LocationServiceError('Not authorized', 401);
  }

  await LocationHistory.create({
    userId,
    lat: parsedLocation.lat,
    lng: parsedLocation.lng,
    timestamp: now,
  });

  return { location: serializeOwnLocation(updatedUser.location) };
}

async function setUserLocationSharing(userId, isSharing) {
  if (!userId) {
    throw new LocationServiceError('Not authorized', 401);
  }

  if (typeof isSharing !== 'boolean') {
    throw new LocationServiceError('isSharing must be a boolean', 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { 'location.isSharing': isSharing } },
    { new: true, runValidators: true, select: 'location' }
  );

  if (!user) {
    throw new LocationServiceError('Not authorized', 401);
  }

  return {
    isSharing: user.location?.isSharing !== false,
    location: serializeOwnLocation(user.location),
  };
}

module.exports = {
  LocationServiceError,
  getCoupleRoomName,
  saveUserLocation,
  serializeOwnLocation,
  serializePartnerLocation,
  setUserLocationSharing,
};

const Location = require('../models/Location');
const LocationHistory = require('../models/LocationHistory');
const SafeZone = require('../models/SafeZone');
const User = require('../models/User');
const { calculateDistance } = require('../services/geolocationService');
const {
  saveUserLocation,
  serializePartnerLocation,
  setUserLocationSharing,
} = require('../services/locationService');

const MEETING_DISTANCE_KM = 0.1;
const MEETING_MIN_DURATION_MS = 5 * 60 * 1000;

function getAuthenticatedUserId(req) {
  return req.user?._id || req.user?.id;
}

function handleLocationServiceError(res, error, fallbackMessage) {
  if (error.statusCode && error.statusCode < 500) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

async function updateSharingFlag(req, res, isSharing, message) {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await setUserLocationSharing(userId, isSharing);

    res.json({
      message,
      isSharing: result.isSharing,
      sharingActive: result.isSharing,
    });
  } catch (error) {
    handleLocationServiceError(res, error, 'Failed to update location sharing');
  }
}

// POST /api/location/update
// Store user's current location
// Body: { lat, lng, accuracy, speed, batteryLevel }
exports.updateLocation = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await saveUserLocation(userId, req.body);
    res.json(result.location);
  } catch (error) {
    handleLocationServiceError(res, error, 'Failed to update location');
  }
};

// GET /api/location/partner
// Get partner's current shared location
exports.getPartnerLocation = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user || !user.partnerId) {
      return res.status(404).json({ message: 'No partner found' });
    }

    const partner = await User.findById(user.partnerId).select('location');
    if (!partner) {
      return res.status(404).json({ message: 'No partner found' });
    }

    res.json(serializePartnerLocation(partner.location));
  } catch (error) {
    console.error('Error fetching partner location:', error);
    res.status(500).json({ message: 'Failed to fetch partner location' });
  }
};

// POST /api/location/sharing
// Toggle current user's location sharing state
exports.setLocationSharing = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { isSharing } = req.body || {};
    const result = await setUserLocationSharing(userId, isSharing);

    res.json({ message: 'Location sharing updated', isSharing: result.isSharing });
  } catch (error) {
    handleLocationServiceError(res, error, 'Failed to update location sharing');
  }
};

// GET /api/location/history?hours=24&target=partner
// Get location trail
exports.getOwnLocationHistory = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const target = req.query.target;
    let targetUserId = userId;

    if (target === 'partner') {
      const user = await User.findById(userId);
      if (!user || !user.partnerId) {
        return res.status(404).json({ message: 'No partner linked' });
      }
      
      const partner = await User.findById(user.partnerId).select('location');
      if (!partner) {
        return res.status(404).json({ message: 'No partner found' });
      }
      
      // Enforce sharing rule
      if (partner.location?.isSharing === false) {
        return res.json([]); // Return empty trail if partner paused sharing
      }
      
      targetUserId = user.partnerId;
    }

    const hours = req.query.hours === undefined ? 24 : Number(req.query.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      return res.status(400).json({ message: 'hours must be a positive number' });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const history = await LocationHistory.find({
      userId: targetUserId,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .select('lat lng timestamp -_id')
      .lean();

    res.json(history);
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ message: 'Failed to fetch location history' });
  }
};

// POST /api/location/pause
// Backward-compatible alias for older clients
exports.pauseLocationSharing = async (req, res) => {
  await updateSharingFlag(req, res, false, 'Location sharing paused');
};

// POST /api/location/resume
// Backward-compatible alias for older clients
exports.resumeLocationSharing = async (req, res) => {
  await updateSharingFlag(req, res, true, 'Location sharing resumed');
};

// POST /api/location/safe-zone
// Create or update a safe zone
// Body: { name, latitude, longitude, radiusMeters, address }
exports.createSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, latitude, longitude, radiusMeters, address } = req.body;

    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Invalid safe zone data' });
    }

    const safeZone = new SafeZone({
      userId,
      name,
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      latitude,
      longitude,
      radiusMeters: radiusMeters || 500,
      address: address || `${name} zone`,
      emoji: getEmojiForZone(name),
    });

    await safeZone.save();

    res.json({
      message: 'Safe zone created',
      safeZone: {
        id: safeZone._id,
        name: safeZone.name,
        emoji: safeZone.emoji,
        latitude: safeZone.latitude,
        longitude: safeZone.longitude,
        radiusMeters: safeZone.radiusMeters,
      },
    });
  } catch (error) {
    console.error('Error creating safe zone:', error);
    res.status(500).json({ message: 'Failed to create safe zone' });
  }
};

// GET /api/location/safe-zones
// Get all safe zones for user
exports.getSafeZones = async (req, res) => {
  try {
    const userId = req.user.id;

    const safeZones = await SafeZone.find({ userId }).sort({ createdAt: -1 });

    res.json({ safeZones });
  } catch (error) {
    console.error('Error fetching safe zones:', error);
    res.status(500).json({ message: 'Failed to fetch safe zones' });
  }
};

// DELETE /api/location/safe-zone/:zoneId
// Delete a safe zone
exports.deleteSafeZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { zoneId } = req.params;

    const result = await SafeZone.findOneAndDelete({
      _id: zoneId,
      userId, // Ensure user owns this zone
    });

    if (!result) {
      return res.status(404).json({ message: 'Safe zone not found' });
    }

    res.json({ message: 'Safe zone deleted' });
  } catch (error) {
    console.error('Error deleting safe zone:', error);
    res.status(500).json({ message: 'Failed to delete safe zone' });
  }
};

// GET /api/location/distance-stats
// Get distance stats (milestones)
exports.getDistanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.partnerId) {
      return res.status(404).json({ message: 'No partner linked' });
    }

    // Get all locations for this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const myLocations = await Location.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    const partnerLocations = await Location.find({
      userId: user.partnerId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    // Calculate total distance apart (sample every hour)
    let totalDistanceApart = 0;
    let sampleCount = 0;

    if (myLocations.length === 0 || partnerLocations.length === 0) {
      return res.json({
        totalDistanceApartKm: 0,
        meetingsThisMonth: 0,
        currentDistanceKm: null,
        currentlyTogether: false,
        period: '30 days',
      });
    }

    for (const myLoc of myLocations) {
      const closest = partnerLocations.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.createdAt - myLoc.createdAt);
        const currDiff = Math.abs(curr.createdAt - myLoc.createdAt);
        return currDiff < prevDiff ? curr : prev;
      });

      const dist = calculateDistance(
        myLoc.latitude,
        myLoc.longitude,
        closest.latitude,
        closest.longitude
      );

      totalDistanceApart += dist;
      sampleCount++;
    }

    // Count meetings (when distance < 1km for > 10 minutes)
    const meetings = await countMeetings(myLocations, partnerLocations);
    const latestMine = myLocations[myLocations.length - 1];
    const latestPartner = partnerLocations[partnerLocations.length - 1];
    const currentDistanceKm =
      latestMine && latestPartner
        ? calculateDistance(
            latestMine.latitude,
            latestMine.longitude,
            latestPartner.latitude,
            latestPartner.longitude
          )
        : null;

    res.json({
      totalDistanceApartKm: Math.round(totalDistanceApart),
      meetingsThisMonth: meetings,
      currentDistanceKm,
      currentlyTogether: currentDistanceKm !== null && currentDistanceKm <= MEETING_DISTANCE_KM,
      period: '30 days',
    });
  } catch (error) {
    console.error('Error fetching distance stats:', error);
    res.status(500).json({ message: 'Failed to fetch distance stats' });
  }
};

// Helper functions

function getEmojiForZone(zoneName) {
  const emojiMap = {
    Home: '🏠',
    Office: '💼',
    College: '🎓',
    Gym: '💪',
    Friend: '👫',
    Custom: '📍',
  };
  return emojiMap[zoneName] || '📍';
}

async function countMeetings(myLocations, partnerLocations) {
  if (myLocations.length === 0 || partnerLocations.length === 0) return 0;

  let meetings = 0;
  let inMeeting = false;
  let meetingStartTime = null;
  let lastTogetherTime = null;

  for (const myLoc of myLocations) {
    const closest = partnerLocations.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.createdAt - myLoc.createdAt);
      const currDiff = Math.abs(curr.createdAt - myLoc.createdAt);
      return currDiff < prevDiff ? curr : prev;
    });

    const dist = calculateDistance(
      myLoc.latitude,
      myLoc.longitude,
      closest.latitude,
      closest.longitude
    );

    if (dist <= MEETING_DISTANCE_KM) {
      lastTogetherTime = myLoc.createdAt;
    }

    if (dist <= MEETING_DISTANCE_KM && !inMeeting) {
      inMeeting = true;
      meetingStartTime = myLoc.createdAt;
    } else if (dist > MEETING_DISTANCE_KM && inMeeting) {
      if (lastTogetherTime - meetingStartTime >= MEETING_MIN_DURATION_MS) {
        meetings++;
      }
      inMeeting = false;
      meetingStartTime = null;
      lastTogetherTime = null;
    }
  }

  if (
    inMeeting &&
    lastTogetherTime &&
    meetingStartTime &&
    lastTogetherTime - meetingStartTime >= MEETING_MIN_DURATION_MS
  ) {
    meetings++;
  }

  return meetings;
}

module.exports = exports;

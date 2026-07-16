const Location = require('../models/Location');
const SafeZone = require('../models/SafeZone');
const User = require('../models/User');
const {
  calculateDistance,
  isWithinGeofence,
  isMovingTowardTarget,
} = require('../services/geolocationService');

// POST /api/location/update
// Store user's current location
// Body: { latitude, longitude, accuracy, battery, speed, heading }
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { latitude, longitude, accuracy, battery, speed, heading } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Create or update location document
    const location = await Location.findOneAndUpdate(
      { userId },
      {
        userId,
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON order: [lng, lat]
        },
        latitude,
        longitude,
        accuracy: accuracy || null,
        battery: battery || null,
        speed: speed || null,
        heading: heading || null,
        sharingActive: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Emit to socket.io (handled in server.js)
    // Socket event will be broadcast by the listener
    res.json({
      message: 'Location updated',
      location: {
        id: location._id,
        latitude: location.latitude,
        longitude: location.longitude,
        battery: location.battery,
        speed: location.speed,
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

// GET /api/location/partner
// Get partner's current location (if both are sharing)
exports.getPartnerLocation = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find current user's partner
    const user = await User.findById(userId);
    if (!user || !user.partnerId) {
      return res.status(404).json({ message: 'No partner linked' });
    }

    // Get partner's latest location
    const partnerLocation = await Location.findOne({ userId: user.partnerId })
      .sort({ createdAt: -1 });

    const partnerUser = await User.findById(user.partnerId);

    if (!partnerLocation || !partnerLocation.sharingActive) {
      return res.status(404).json({ message: 'Partner not sharing location' });
    }

    // Calculate distance between us and partner
    const myLocation = await Location.findOne({ userId }).sort({ createdAt: -1 });
    const distance = myLocation
      ? calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude
        )
      : null;

    res.json({
      partnerId: user.partnerId,
      partner: {
        name: partnerUser ? partnerUser.name : 'Partner',
        avatarUrl: partnerUser ? partnerUser.avatarUrl : '',
      },
      location: {
        latitude: partnerLocation.latitude,
        longitude: partnerLocation.longitude,
        accuracy: partnerLocation.accuracy,
        battery: partnerLocation.battery,
        speed: partnerLocation.speed,
        heading: partnerLocation.heading,
        address: partnerLocation.address,
        lastUpdated: partnerLocation.updatedAt,
        sharingActive: partnerLocation.sharingActive,
      },
      distanceKm: distance,
    });
  } catch (error) {
    console.error('Error fetching partner location:', error);
    res.status(500).json({ message: 'Failed to fetch partner location' });
  }
};

// POST /api/location/pause
// Pause location sharing temporarily
exports.pauseLocationSharing = async (req, res) => {
  try {
    const userId = req.user.id;

    const location = await Location.findOneAndUpdate(
      { userId },
      { sharingActive: false, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Location sharing paused', sharingActive: false });
  } catch (error) {
    console.error('Error pausing location:', error);
    res.status(500).json({ message: 'Failed to pause location sharing' });
  }
};

// POST /api/location/resume
// Resume location sharing
exports.resumeLocationSharing = async (req, res) => {
  try {
    const userId = req.user.id;

    const location = await Location.findOneAndUpdate(
      { userId },
      { sharingActive: true, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Location sharing resumed', sharingActive: true });
  } catch (error) {
    console.error('Error resuming location:', error);
    res.status(500).json({ message: 'Failed to resume location sharing' });
  }
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

    res.json({
      totalDistanceApartKm: Math.round(totalDistanceApart),
      meetingsThisMonth: meetings,
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

    if (dist < 1 && !inMeeting) {
      inMeeting = true;
      meetingStartTime = myLoc.createdAt;
    } else if (dist >= 1 && inMeeting) {
      // Check if meeting lasted > 10 minutes
      if (myLoc.createdAt - meetingStartTime > 10 * 60 * 1000) {
        meetings++;
      }
      inMeeting = false;
    }
  }

  return meetings;
}

module.exports = exports;

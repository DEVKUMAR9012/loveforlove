const mongoose = require('mongoose');

const safeZoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    enum: ['Home', 'Office', 'College', 'Gym', 'Friend', 'Custom'],
    required: true,
  },
  // GeoJSON Point for geospatial queries
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  // Radius in meters (default 500m for geofence)
  radiusMeters: {
    type: Number,
    default: 500,
    min: 100,
    max: 5000,
  },
  // Human-readable address
  address: {
    type: String,
    default: null,
  },
  // Enable notifications when partner enters/exits
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  // Color/emoji for UI (🏠 Home, 💼 Office, etc.)
  emoji: {
    type: String,
    default: '📍',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index for geofence proximity queries
safeZoneSchema.index({ 'geometry': '2dsphere' });
safeZoneSchema.index({ userId: 1 });

module.exports = mongoose.model('SafeZone', safeZoneSchema);

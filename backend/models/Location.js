const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // GeoJSON for MongoDB geospatial queries
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — NOTE: GeoJSON order!
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
  // Accuracy in meters (from Geolocation API)
  accuracy: {
    type: Number,
    default: null,
  },
  // Battery percentage (0–100)
  battery: {
    type: Number,
    default: null,
  },
  // Movement speed in m/s (calculated)
  speed: {
    type: Number,
    default: null,
  },
  // Bearing/heading in degrees (0–360)
  heading: {
    type: Number,
    default: null,
  },
  // Reverse geocoded address (e.g., "Sadar Bazaar, Delhi")
  address: {
    type: String,
    default: null,
  },
  // Whether location sharing is currently active
  sharingActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    // Auto-delete location after 48 hours (configurable per user preference)
    expires: 172800, // 48 hours in seconds
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index for geospatial queries (geofencing, distance calcs)
locationSchema.index({ 'geometry': '2dsphere' });
locationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Location', locationSchema);

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    min: -90,
    max: 90,
    default: null,
  },
  lng: {
    type: Number,
    min: -180,
    max: 180,
    default: null,
  },
  accuracy: {
    type: Number,
    min: 0,
    default: null,
  },
  speed: {
    type: Number,
    min: 0,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  isSharing: {
    type: Boolean,
    default: true,
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  // Partner linking — set this to the other person's _id to share memories
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  relationshipStartDate: {
    type: Date,
    default: null,
  },
  // Refresh token store — one hashed token per active device/session.
  // On logout we remove that specific token (not all).
  // On rotation we swap old → new.
  // select: false means it never leaks in API responses.
  location: {
    type: locationSchema,
    default: () => ({}),
  },
  refreshTokens: {
    type: [String],
    default: [],
    select: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

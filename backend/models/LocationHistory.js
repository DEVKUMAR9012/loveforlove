const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 48 * 60 * 60 });
locationHistorySchema.index({ userId: 1, timestamp: 1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);

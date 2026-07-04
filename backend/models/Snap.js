const mongoose = require('mongoose');

const snapSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  openedAt: {
    type: Date,
    default: null,
  },
  emailSentAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

snapSchema.index({ recipientId: 1, openedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Snap', snapSchema);

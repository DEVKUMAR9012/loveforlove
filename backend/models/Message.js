const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: { type: String, trim: true, default: '' },
  imageUrl: { type: String, default: null },
  publicId: { type: String, default: null },
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  emojis: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);

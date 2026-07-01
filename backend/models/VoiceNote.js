const mongoose = require('mongoose');

const voiceNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  audioUrl: { type: String, required: true },
  duration: { type: Number, default: 0 }, // in seconds
  publicId: { type: String }, // cloudinary public_id for deletion
}, { timestamps: true });

module.exports = mongoose.model('VoiceNote', voiceNoteSchema);

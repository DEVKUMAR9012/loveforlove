const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mood: { type: String, required: true }, // e.g. 'in_love', 'happy'
}, { timestamps: true });

module.exports = mongoose.model('Mood', MoodSchema);

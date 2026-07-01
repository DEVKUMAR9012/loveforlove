const mongoose = require('mongoose');

const LetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['open-now', 'open-when', 'surprise', 'special'],
    default: 'open-now',
  },
  isLocked: {
    type: Boolean,
    required: true,
    default: true,
  },
  unlockCondition: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Letter', LetterSchema);

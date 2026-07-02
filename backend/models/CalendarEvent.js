const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['anniversary', 'date-night', 'birthday', 'reminder', 'trip'],
    required: true,
    default: 'reminder',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  recurrence: {
    type: String,
    enum: ['none', 'yearly'],
    default: 'none',
  },
  reminder: {
    type: String,
    enum: ['none', 'same-day', 'one-day-before', 'both'],
    default: 'one-day-before',
  },
  photoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  photoMemoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory',
    default: null,
  },
}, { timestamps: true });

CalendarEventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);

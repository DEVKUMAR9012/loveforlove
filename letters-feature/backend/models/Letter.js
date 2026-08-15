const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    themeId: {
      type: String,
      required: true,
      enum: [
        'kraft-heart',
        'wax-blank',
        'red-lined',
        'hibiscus-bow',
        'navy-floral',
        'cat-lined',
      ],
      default: 'kraft-heart',
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'To my favorite person',
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    signature: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'I love you, always.',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookup for "letters between us" queries
letterSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
letterSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Letter', letterSchema);

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  category: {
    type: String,
    enum: ['bug', 'suggestion', 'content', 'account', 'other'],
    default: 'bug'
  },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['open', 'in-review', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);

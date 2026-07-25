const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const User = require('../models/User');
const Report = require('../models/Report');
const Message = require('../models/Message');
const Memory = require('../models/Memory');
const Snap = require('../models/Snap');
const VoiceNote = require('../models/VoiceNote');
const CalendarEvent = require('../models/CalendarEvent');
const Letter = require('../models/Letter');
const Location = require('../models/Location');
const LocationHistory = require('../models/LocationHistory');
const Mood = require('../models/Mood');
const Notification = require('../models/Notification');
const PartnerInvite = require('../models/PartnerInvite');
const SafeZone = require('../models/SafeZone');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    cb(new Error('Only images are allowed'));
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

router.use(protect);

// POST /api/settings/avatar
router.post('/avatar', uploadLimiter, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'our-universe/avatars',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    });

    await User.findByIdAndUpdate(req.user._id, { avatarUrl: result.secure_url, hasCustomAvatar: true });
    const user = { avatarUrl: result.secure_url };

    res.json({ message: 'Avatar updated successfully', avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/profile — update display name
router.put('/profile', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    const trimmed = name.trim().slice(0, 60);
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name: trimmed },
      { new: true, select: 'name email avatarUrl partnerId role relationshipStartDate' }
    );
    res.json({ message: 'Profile updated', name: updated.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/email — add or update email (and optional password)
router.put('/email', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email cannot be empty' });

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if another user already uses this email
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with that email already exists' });
    }

    const updates = { email: normalizedEmail };
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updates.password = await bcrypt.hash(password.trim(), 12);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, select: 'name email avatarUrl partnerId role relationshipStartDate' }
    );

    res.json({ message: 'Email updated successfully', email: updated.email });
  } catch (err) {
    console.error('Update email error:', err);
    res.status(500).json({ error: err.message || 'Failed to update email' });
  }
});

// GET /api/settings/partner — return linked partner's public info
router.get('/partner', async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('partnerId');
    if (!me?.partnerId) return res.json({ partner: null });
    const partner = await User.findById(me.partnerId).select('name avatarUrl email');
    res.json({ partner: partner || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/relationship-date
router.put('/relationship-date', async (req, res) => {
  try {
    const { date } = req.body;
    
    // Update the current user
    const user = await User.findById(req.user._id);
    user.relationshipStartDate = date;
    await user.save();
    
    // Also update partner if they exist
    if (user.partnerId) {
      const partner = await User.findById(user.partnerId);
      if (partner) {
        partner.relationshipStartDate = date;
        await partner.save();
      }
    }
    
    res.json({ message: 'Relationship date updated successfully', relationshipStartDate: date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/disconnection-status
// Checks if current user has an open disconnection request pending admin approval
router.get('/disconnection-status', async (req, res) => {
  try {
    const pendingReport = await Report.findOne({
      userId: req.user._id,
      category: 'account',
      title: { $regex: /^Partner Disconnection Request/i },
      status: { $in: ['open', 'in-review'] },
    });
    res.json({ isPending: !!pendingReport, report: pendingReport || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/disconnect-partner
// Submits a disconnection request report to website admin for approval
router.post('/disconnect-partner', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.partnerId) {
      return res.status(400).json({ error: 'You are not currently connected to a partner.' });
    }

    // Check if a disconnection request is already pending for this user
    const existingPending = await Report.findOne({
      userId: user._id,
      category: 'account',
      title: { $regex: /^Partner Disconnection Request/i },
      status: { $in: ['open', 'in-review'] },
    });

    if (existingPending) {
      return res.status(400).json({ error: 'Disconnection request is already pending admin approval.' });
    }

    const partnerId = user.partnerId;
    const partner = await User.findById(partnerId);
    const descriptionText = reason && reason.trim() ? reason.trim() : 'No reason specified';

    // 1. Create Pending Disconnection Report for Website Admin Approval
    const report = await Report.create({
      userId: user._id,
      userName: user.name || 'User',
      userEmail: user.email || '',
      category: 'account',
      title: `Partner Disconnection Request: ${user.name} & ${partner?.name || 'Partner'}`,
      description: `Disconnection Request Pending Admin Approval.\nInitiator: ${user.name} (${user.email || user._id})\nPartner: ${partner?.name || 'Partner'} (${partner?.email || partnerId})\nBrief Description / Reason: ${descriptionText}\nPending Action: Disconnect partner link and purge all shared messages, memories, snaps, voice notes, calendar events, letters, mood logs, and location data upon admin approval.`,
      status: 'open'
    });

    res.json({
      message: 'Disconnection request submitted successfully. Connection will be broken and all data purged once website admin approves your request.',
      reportId: report._id,
      status: 'open'
    });
  } catch (err) {
    console.error('Error submitting partner disconnection request:', err);
    res.status(500).json({ error: err.message || 'Failed to submit disconnection request' });
  }
});

// DELETE /api/settings/danger-zone
// Resets all data for the user
router.delete('/danger-zone', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pairUserIds = [user._id];
    if (user.partnerId) pairUserIds.push(user.partnerId);

    // Purge data
    await Promise.all([
      Message.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Memory.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Snap.deleteMany({ $or: [{ senderId: { $in: pairUserIds } }, { recipientId: { $in: pairUserIds } }] }).catch(() => {}),
      VoiceNote.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      CalendarEvent.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Letter.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Location.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      LocationHistory.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Mood.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      Notification.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
      PartnerInvite.deleteMany({ inviterId: { $in: pairUserIds } }).catch(() => {}),
      SafeZone.deleteMany({ userId: { $in: pairUserIds } }).catch(() => {}),
    ]);

    user.relationshipStartDate = null;
    if (user.partnerId) {
      const partner = await User.findById(user.partnerId);
      if (partner) {
        partner.partnerId = null;
        partner.relationshipStartDate = null;
        await partner.save();
      }
      user.partnerId = null;
    }
    await user.save();
    
    res.json({ message: 'Account data reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

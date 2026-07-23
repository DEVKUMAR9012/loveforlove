const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const User = require('../models/User');

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

    await User.findByIdAndUpdate(req.user._id, { avatarUrl: result.secure_url });
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

// DELETE /api/settings/danger-zone
// Resets all data for the user
router.delete('/danger-zone', async (req, res) => {
  try {
    // In a real production app, we would delete Memories, Messages, etc.
    // associated with req.user._id here.
    
    // For this demonstration, we'll clear the relationshipStartDate and partnerId
    const user = await User.findById(req.user._id);
    user.relationshipStartDate = null;
    
    // Disconnect from partner
    if (user.partnerId) {
      const partner = await User.findById(user.partnerId);
      if (partner) {
        partner.partnerId = null;
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

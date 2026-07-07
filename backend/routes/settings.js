const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
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

    const user = await User.findById(req.user._id);
    user.avatarUrl = result.secure_url;
    await user.save();

    res.json({ message: 'Avatar updated successfully', avatarUrl: user.avatarUrl });
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

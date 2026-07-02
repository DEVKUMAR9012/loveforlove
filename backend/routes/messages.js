const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const Message   = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { messageRules, validate } = require('../middleware/validators');

// Memory storage — no disk writes
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
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

// GET all messages (oldest first, capped at 500)
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id }).sort({ createdAt: 1 }).limit(500);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST text message (validated)
router.post('/', protect, messageRules, validate, async (req, res) => {
  try {
    const { text, emojis } = req.body;
    const m = await Message.create({
      userId: req.user._id,
      text:   text.trim(),
      type:   'text',
      emojis: emojis || [],
    });
    res.status(201).json(m);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST image upload — memory storage, streamed to Cloudinary
router.post('/upload', protect, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'our-universe/letters',
    });

    const m = await Message.create({
      userId:   req.user._id,
      text:     req.body.caption?.trim() || '',
      imageUrl: result.secure_url,
      publicId: result.public_id,
      type:     'image',
    });
    res.status(201).json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a message (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const msg = await Message.findOne({ _id: req.params.id, userId: req.user._id });
    if (!msg) return res.status(404).json({ error: 'Not found or not authorized' });

    if (msg.publicId) {
      await cloudinary.uploader.destroy(msg.publicId);
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Message.countDocuments({ userId: req.user._id });
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

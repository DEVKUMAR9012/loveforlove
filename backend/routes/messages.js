const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all messages for this user (oldest first)
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id }).sort({ createdAt: 1 }).limit(500);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST text message
router.post('/', protect, async (req, res) => {
  try {
    const { text, emojis } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

    const m = await Message.create({
      userId: req.user._id,
      text: text.trim(),
      type: 'text',
      emojis: emojis || [],
    });
    res.status(201).json(m);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST image/letter upload
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'our-universe/letters',
    });
    fs.unlinkSync(req.file.path);

    const m = await Message.create({
      userId: req.user._id,
      text: req.body.caption || '',
      imageUrl: result.secure_url,
      publicId: result.public_id,
      type: 'image',
    });
    res.status(201).json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a message (only owner)
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

// GET stats for this user
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Message.countDocuments({ userId: req.user._id });
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

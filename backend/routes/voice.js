const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const VoiceNote = require('../models/VoiceNote');
const { protect } = require('../middleware/authMiddleware');

// ── Memory storage: NO file ever touches disk ──────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: stream a Buffer directly into Cloudinary (no temp file needed)
function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

// @route  POST /api/voice/upload
// @desc   Upload a voice note — stored 100% in Cloudinary, nothing on disk
// @access Private
router.post('/upload', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    // Stream buffer straight to Cloudinary — zero local storage
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      resource_type: 'video',          // Cloudinary uses 'video' type for audio files
      folder:        'our-universe/voice-notes',
      format:        'webm',
    });

    const voiceNote = await VoiceNote.create({
      userId:   req.user._id,
      audioUrl: result.secure_url,
      publicId: result.public_id,
      duration: req.body.duration ? parseFloat(req.body.duration) : 0,
    });

    res.status(201).json(voiceNote);
  } catch (err) {
    console.error('Voice upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// @route  GET /api/voice
// @desc   Get all voice notes for this user (newest first)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const notes = await VoiceNote.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route  DELETE /api/voice/:id
// @desc   Delete a voice note — removes from Cloudinary AND MongoDB
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await VoiceNote.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Not found or not authorized' });

    // Delete from Cloudinary first
    if (note.publicId) {
      await cloudinary.uploader.destroy(note.publicId, { resource_type: 'video' });
    }

    await VoiceNote.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

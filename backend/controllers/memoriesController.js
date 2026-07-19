const Memory     = require('../models/Memory');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: stream a Buffer directly into Cloudinary — zero temp files
function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');

    // Stream buffer straight to Cloudinary — zero local storage
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'our-universe',
      resource_type: 'auto',
    });

    // Save memory record with Cloudinary URL
    const m = new Memory({
      userId:      req.user._id,
      title:       'Gallery Upload',
      date:        new Date(),
      description: 'Uploaded from Media Gallery',
      imageUrl:    result.secure_url,
      mediaType:   isVideo ? 'video' : 'image',
    });
    await m.save();

    res.status(201).json(m);
  } catch (err) {
    if (err.message === 'File too large') {
       return res.status(413).json({ error: 'File exceeds the 50MB limit' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    // Build query — include partner's memories if linked
    const userIds = [req.user._id];
    if (req.user.partnerId) userIds.push(req.user.partnerId);

    const memories = await Memory.find({ userId: { $in: userIds } }).sort({ date: 1 });
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, date, description, imageUrl, tags } = req.body;
    const m = new Memory({ userId: req.user._id, title, date, description, imageUrl, tags });
    await m.save();
    res.status(201).json(m);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!memory) return res.status(404).json({ error: 'Not found' });
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!memory) return res.status(404).json({ error: 'Not found or not authorized' });
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const Snap = require('../models/Snap');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image snaps are allowed'));
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

async function sendSnapEmail({ sender, recipient, snap }) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: 'RESEND_API_KEY missing' };
  }

  const from = process.env.MAIL_FROM || 'loveforlove <onboarding@resend.dev>';
  const subject = `${sender.name || 'Your partner'} sent you a snap`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>You received a snap</h2>
      <p>${sender.name || sender.email} sent you a new snap on loveforlove.</p>
      ${snap.caption ? `<p><strong>Caption:</strong> ${snap.caption}</p>` : ''}
      <p><a href="${snap.imageUrl}">Open snap</a></p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipient.email,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { sent: false, reason: text || `Email provider responded ${response.status}` };
  }

  return { sent: true };
}

function serializeSnap(snap) {
  const obj = snap.toObject();
  const sender = obj.senderId && typeof obj.senderId === 'object' ? obj.senderId : null;

  return {
    ...obj,
    senderId: sender?._id || obj.senderId,
    sender: sender
      ? {
          _id: sender._id,
          name: sender.name,
          email: sender.email,
          avatarUrl: sender.avatarUrl,
        }
      : null,
  };
}

router.post('/', protect, uploadLimiter, upload.single('snap'), async (req, res) => {
  try {
    if (!req.user.partnerId) {
      return res.status(400).json({ error: 'Link your partner before sending snaps.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No snap image provided' });

    const partner = await User.findById(req.user.partnerId);
    if (!partner) return res.status(404).json({ error: 'Linked partner was not found.' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'our-universe/snaps',
      resource_type: 'image',
    });

    const snap = await Snap.create({
      senderId: req.user._id,
      recipientId: partner._id,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      caption: typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 120) : '',
    });

    const email = await sendSnapEmail({ sender: req.user, recipient: partner, snap })
      .catch((err) => ({ sent: false, reason: err.message }));

    if (email.sent) {
      snap.emailSentAt = new Date();
      await snap.save();
    }

    const saved = await Snap.findById(snap._id).populate('senderId', 'name email avatarUrl');
    res.status(201).json({ snap: serializeSnap(saved), email });
  } catch (err) {
    console.error('Snap send error:', err);
    res.status(500).json({ error: err.message || 'Could not send snap' });
  }
});

router.get('/inbox', protect, async (req, res) => {
  try {
    const snaps = await Snap.find({ recipientId: req.user._id })
      .populate('senderId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(snaps.map(serializeSnap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/open', protect, async (req, res) => {
  try {
    const snap = await Snap.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { openedAt: new Date() },
      { new: true }
    ).populate('senderId', 'name email avatarUrl');

    if (!snap) return res.status(404).json({ error: 'Snap not found' });
    res.json(serializeSnap(snap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

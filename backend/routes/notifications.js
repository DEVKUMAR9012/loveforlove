const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiters');
const Notification = require('../models/Notification');

const sseClients = new Map(); // userId -> Set of response objects

router.use(apiLimiter);
router.use(protect);

// ── Helper: seed a "Welcome" notification for brand-new users ──────────────
// Called externally (e.g. from auth routes on register/social login).
async function seedWelcomeNotification(userId) {
  try {
    const exists = await Notification.findOne({ userId, type: 'welcome' });
    if (!exists) {
      await Notification.create({
        userId,
        type: 'welcome',
        title: 'Welcome to LoveForLove! 🎉',
        message: 'We\'re so happy you\'re here. Invite your partner to get started!',
      });
    }
  } catch (err) {
    console.error('[Notifications] seedWelcome error:', err.message);
  }
}

// ── Helper: create a notification for a user (use from other routes) ────────
async function createNotification(userId, { title, message, type = 'general' }) {
  try {
    const notif = await Notification.create({ userId, title, message, type });
    const userClients = sseClients.get(userId.toString());
    if (userClients) {
      for (const client of userClients) {
        client.write(`data: ${JSON.stringify(notif)}\n\n`);
      }
    }
    return notif;
  } catch (err) {
    console.error('[Notifications] createNotification error:', err.message);
    return null;
  }
}

// GET /api/notifications/stream
// Server-Sent Events endpoint for real-time notifications
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE connection

  const userId = req.user._id.toString();
  
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);

  req.on('close', () => {
    const userClients = sseClients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        sseClients.delete(userId);
      }
    }
  });
});

// GET /api/notifications
// Returns the 50 most recent notifications for the current user (newest first).
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/mark-all-read
// Marks every unread notification for the current user as read.
router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
// Marks a single notification as read.
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
// Deletes a single notification (must belong to current user).
router.delete('/:id', async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.seedWelcomeNotification = seedWelcomeNotification;
module.exports.createNotification = createNotification;

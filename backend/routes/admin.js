const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const { apiLimiter } = require('../middleware/rateLimiters');
const User = require('../models/User');
const Memory = require('../models/Memory');
const Message = require('../models/Message');

const Report = require('../models/Report');
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

// All routes require authentication and admin role
router.use(apiLimiter);
router.use(protect);
router.use(adminMiddleware);

// GET /api/admin/stats - Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const memoryCount = await Memory.countDocuments();
    const messageCount = await Message.countDocuments();
    
    // Count couples (users who have a partnerId set)
    const coupledUsers = await User.countDocuments({ partnerId: { $ne: null } });
    const coupleCount = Math.floor(coupledUsers / 2); // rough estimate

    res.json({
      userCount,
      memoryCount,
      messageCount,
      coupleCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshTokens').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id - Update user fields (name, email, role)
router.patch('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Build update object — only include provided fields
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim().slice(0, 60);
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: '-password -refreshTokens' }
    );

    if (!updated) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reports/:id/approve-disconnection
// Admin approves a partner disconnection request: unlinks partners and purges all shared data
router.put('/reports/:id/approve-disconnection', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const user = await User.findById(report.userId);
    if (!user) {
      report.status = 'resolved';
      await report.save();
      return res.status(404).json({ error: 'Initiating user no longer exists.' });
    }

    const pairUserIds = [user._id];
    let partner = null;

    if (user.partnerId) {
      pairUserIds.push(user.partnerId);
      partner = await User.findById(user.partnerId);
    }

    // 1. Purge all shared relationship data created during connected time
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

    // 2. Unlink both users and reset relationship date
    user.partnerId = null;
    user.relationshipStartDate = null;
    await user.save();

    if (partner) {
      partner.partnerId = null;
      partner.relationshipStartDate = null;
      await partner.save();
    }

    // 3. Mark report as resolved
    report.status = 'resolved';
    report.description += `\n\n[ADMIN APPROVED]: Partner connection unlinked and all shared relationship data permanently purged.`;
    await report.save();

    res.json({
      message: 'Disconnection request approved. Connection unlinked and all shared data purged successfully.',
      report,
    });
  } catch (err) {
    console.error('Error approving disconnection request:', err);
    res.status(500).json({ error: err.message || 'Failed to approve disconnection' });
  }
});

module.exports = router;

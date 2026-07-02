const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const { apiLimiter } = require('../middleware/rateLimiters');
const User = require('../models/User');
const Memory = require('../models/Memory');
const Message = require('../models/Message');

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
    
    // (Optional) Here you would also delete their memories/messages to clean up, 
    // but for simplicity we'll just delete the user document for now.
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.use(protect);

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

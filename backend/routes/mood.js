const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { protect } = require('../middleware/authMiddleware');

// GET /api/mood/status — current user's latest mood + partner's latest mood
router.get('/status', protect, async (req, res) => {
  try {
    const myLatest = await Mood.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    let partnerLatest = null;
    if (req.user.partnerId) {
      partnerLatest = await Mood.findOne({ userId: req.user.partnerId }).sort({ createdAt: -1 });
    }

    res.json({
      mine: myLatest ? { mood: myLatest.mood, updatedAt: myLatest.createdAt } : null,
      partner: partnerLatest ? { mood: partnerLatest.mood, updatedAt: partnerLatest.createdAt } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mood/history?days=35 — this user's mood history
router.get('/history', protect, async (req, res) => {
  try {
    const daysNum = parseInt(req.query.days || 35, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const moods = await Mood.find({
      userId: req.user._id,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Group by YYYY-MM-DD (take latest mood per day)
    const daysMap = {};
    for (const m of moods) {
      const dateStr = m.createdAt.toISOString().split('T')[0];
      daysMap[dateStr] = m.mood; // overwrites with latest of that day
    }

    const daysList = Object.keys(daysMap).sort().map(d => ({
      date: d,
      mood: daysMap[d],
    }));

    // Calculate streak (consecutive days with a mood logged)
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedDays = [...daysList].reverse();
    for (const d of sortedDays) {
      if (d.mood) {
        streak++;
      } else {
        if (d.date !== today) break;
      }
    }

    // Prepare detailed timeline (newest first)
    const timeline = [...moods].reverse().map(m => ({
      id: m._id,
      mood: m.mood,
      time: m.createdAt
    }));

    res.json({ days: daysList, streak, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mood — log a mood
router.post('/', protect, async (req, res) => {
  try {
    const { mood } = req.body;
    if (!mood) return res.status(400).json({ error: 'Mood required' });

    const newMood = await Mood.create({
      userId: req.user._id,
      mood,
    });
    res.json(newMood);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

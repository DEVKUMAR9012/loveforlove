const express = require('express');
const router = express.Router();
const { generatePrompt, smartReply } = require('../services/aiService');
const { protect } = require('../middleware/authMiddleware');

// Public endpoint: generate a single daily prompt (cached client-side by frontend)
router.get('/generate-prompt', async (req, res) => {
  try {
    const context = req.query.context || '';
    const prompt = await generatePrompt(context);
    res.json({ prompt });
  } catch (err) {
    console.error('generate-prompt error:', err);
    res.status(500).json({ message: 'AI generation failed' });
  }
});

// Protected endpoint: smart reply for a conversation (requires auth)
router.post('/smart-reply', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    const suggestions = await smartReply(messages || []);
    res.json({ suggestions });
  } catch (err) {
    console.error('smart-reply error:', err);
    res.status(500).json({ message: 'AI smart reply failed' });
  }
});

module.exports = router;

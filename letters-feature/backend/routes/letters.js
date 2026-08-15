const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');
const authMiddleware = require('../middleware/auth'); // adjust path to your existing auth middleware
const User = require('../models/User'); // adjust to your existing User model path

// GET /api/letters - all letters between the logged-in user and their partner
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    if (!currentUser.partnerId) {
      return res.status(400).json({ message: 'No partner linked yet' });
    }

    const letters = await Letter.find({
      $or: [
        { sender: userId, receiver: currentUser.partnerId },
        { sender: currentUser.partnerId, receiver: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .populate('receiver', 'name');

    res.json(letters);
  } catch (err) {
    console.error('Error fetching letters:', err);
    res.status(500).json({ message: 'Server error fetching letters' });
  }
});

// GET /api/letters/:id - single letter (also marks as read if receiver opens it)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id)
      .populate('sender', 'name')
      .populate('receiver', 'name');

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const userId = req.user.id;
    if (
      letter.sender._id.toString() !== userId &&
      letter.receiver._id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Not authorized to view this letter' });
    }

    // Mark as read if the receiver is opening it for the first time
    if (letter.receiver._id.toString() === userId && !letter.isRead) {
      letter.isRead = true;
      letter.readAt = new Date();
      await letter.save();
    }

    res.json(letter);
  } catch (err) {
    console.error('Error fetching letter:', err);
    res.status(500).json({ message: 'Server error fetching letter' });
  }
});

// POST /api/letters - write and send a new letter
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { themeId, title, content, signature } = req.body;
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    if (!currentUser.partnerId) {
      return res.status(400).json({ message: 'No partner linked yet' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Letter content cannot be empty' });
    }

    const letter = new Letter({
      sender: userId,
      receiver: currentUser.partnerId,
      themeId: themeId || 'kraft-heart',
      title: title || undefined,
      content: content.trim(),
      signature: signature || undefined,
    });

    await letter.save();
    await letter.populate('sender', 'name');
    await letter.populate('receiver', 'name');

    // TODO: emit socket.io event here to notify partner in real-time,
    // e.g. io.to(currentUser.partnerId).emit('new_letter', letter)

    res.status(201).json(letter);
  } catch (err) {
    console.error('Error creating letter:', err);
    res.status(500).json({ message: 'Server error creating letter' });
  }
});

// DELETE /api/letters/:id - only sender can delete their own letter
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    if (letter.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the sender can delete this letter' });
    }

    await letter.deleteOne();
    res.json({ message: 'Letter deleted' });
  } catch (err) {
    console.error('Error deleting letter:', err);
    res.status(500).json({ message: 'Server error deleting letter' });
  }
});

module.exports = router;

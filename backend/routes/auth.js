const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_please_change_in_env', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (unlimited)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl,
    partnerId: req.user.partnerId || null,
  });
});

// @desc    Link partner by email (both users share memories after this)
// @route   POST /api/auth/link-partner
// @access  Private
router.post('/link-partner', protect, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    if (!partnerEmail) return res.status(400).json({ message: 'partnerEmail is required' });

    const partner = await User.findOne({ email: partnerEmail.toLowerCase().trim() });
    if (!partner) return res.status(404).json({ message: 'No user found with that email' });
    if (partner._id.equals(req.user._id)) return res.status(400).json({ message: "You can't link to yourself" });

    // Link both ways
    await User.findByIdAndUpdate(req.user._id, { partnerId: partner._id });
    await User.findByIdAndUpdate(partner._id, { partnerId: req.user._id });

    res.json({ message: 'Partner linked successfully', partnerId: partner._id, partnerName: partner.name });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

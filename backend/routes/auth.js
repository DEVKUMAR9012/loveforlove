const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter, refreshLimiter } = require('../middleware/rateLimiters');
const { registerRules, loginRules, linkPartnerRules, validate } = require('../middleware/validators');

// ── Token helpers ─────────────────────────────────────────────────────────

const ACCESS_SECRET  = process.env.JWT_SECRET  || 'CHANGE_ME_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'CHANGE_ME_refresh_secret';

/** Short-lived access token — 15 minutes */
const generateAccessToken = (id) =>
  jwt.sign({ id }, ACCESS_SECRET, { expiresIn: '15m' });

/** Long-lived refresh token — 30 days, opaque random string stored hashed */
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

/** SHA-256 hash of the raw refresh token (what we store in DB) */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ─────────────────────────────────────────────────────────────────────────

// @route  POST /api/auth/register
// @access Public  (rate-limited + validated)
router.post(
  '/register',
  registerLimiter,
  registerRules,
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'An account with that email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ name: name.trim(), email, password: hashedPassword });

      // Issue tokens immediately on register
      const accessToken  = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken();

      // Store hashed refresh token in DB
      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: hashToken(refreshToken) },
      });

      // Send refresh token as HttpOnly cookie (not readable by JS)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        token: accessToken,         // short-lived, 15min
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  POST /api/auth/login
// @access Public  (rate-limited: 5 failed attempts / 15 min)
router.post(
  '/login',
  loginLimiter,
  loginRules,
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+refreshTokens');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const accessToken  = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken();

      // Add new refresh token for this device (up to 5 concurrent sessions)
      const hashed = hashToken(refreshToken);
      const updatedTokens = [...(user.refreshTokens || []), hashed].slice(-5);
      await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        token: accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  POST /api/auth/refresh
// @access Public  (uses HttpOnly cookie)
// Exchanges a valid refresh token for a new access token + rotated refresh token.
router.post('/refresh', refreshLimiter, async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const hashed = hashToken(rawToken);
    const user   = await User.findOne({ refreshTokens: hashed }).select('+refreshTokens');

    if (!user) {
      // Token not found → possible theft, clear all tokens (paranoid mode)
      return res.status(403).json({ message: 'Refresh token invalid or expired' });
    }

    // ROTATION: remove old token, add new one
    const newRefreshToken = generateRefreshToken();
    const newHashed       = hashToken(newRefreshToken);
    const updatedTokens   = user.refreshTokens
      .filter((t) => t !== hashed)
      .concat(newHashed)
      .slice(-5);

    await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: generateAccessToken(user._id) });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(403).json({ message: 'Token refresh failed' });
  }
});

// @route  POST /api/auth/logout
// @access Private
// Removes only this device's refresh token (not all sessions).
router.post('/logout', protect, async (req, res) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    const hashed = hashToken(rawToken);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: hashed },
    });
  }

  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out successfully' });
});

// @route  GET /api/auth/me
// @access Private
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl,
    partnerId: req.user.partnerId || null,
  });
});

// @route  POST /api/auth/link-partner
// @access Private  (validated)
router.post('/link-partner', protect, linkPartnerRules, validate, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const partner = await User.findOne({ email: partnerEmail });

    if (!partner) return res.status(404).json({ message: 'No user found with that email' });
    if (partner._id.equals(req.user._id)) return res.status(400).json({ message: "You can't link to yourself" });

    await User.findByIdAndUpdate(req.user._id, { partnerId: partner._id });
    await User.findByIdAndUpdate(partner._id, { partnerId: req.user._id });

    res.json({ message: 'Partner linked successfully', partnerId: partner._id, partnerName: partner.name });
  } catch (err) {
    console.error('Link partner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

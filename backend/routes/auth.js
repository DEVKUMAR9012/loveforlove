const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const PartnerInvite = require('../models/PartnerInvite');
const { seedWelcomeNotification, createNotification } = require('./notifications');
require('../config/firebase'); // Runs the initialisation
const { getAuth } = require('firebase-admin/auth');
const { getApps } = require('firebase-admin/app');
const { protect } = require('../middleware/authMiddleware');
const {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  invitePreviewLimiter,
  inviteCreateLimiter,
  inviteAcceptLimiter,
} = require('../middleware/rateLimiters');
const {
  registerRules,
  loginRules,
  linkPartnerRules,
  inviteCodeRules,
  inviteCodeParamRules,
  validate,
} = require('../middleware/validators');

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

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const INVITE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');

const generateInviteCode = () => {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_ALPHABET[crypto.randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return code;
};

const generateUniqueInviteCode = async () => {
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const code = generateInviteCode();
    const exists = await PartnerInvite.exists({ code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique invite code');
};

const inviteUnavailableMessage = 'Invite code is invalid, expired, or already used';

const serializeUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  partnerId: user.partnerId || null,
  role: user.role,
  relationshipStartDate: user.relationshipStartDate,
  ...(token && { token }),
});

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

      // Seed welcome notification
      await seedWelcomeNotification(user._id);

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

      res.status(201).json(serializeUser(user, accessToken));
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

      res.json(serializeUser(user, accessToken));
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  POST /api/auth/social
// @access Public (rate-limited)
router.post(
  '/social',
  loginLimiter,
  async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: 'No token provided' });

      if (getApps().length === 0) {
        return res.status(500).json({ message: 'Firebase Admin not initialized on server. Please add serviceAccountKey.json' });
      }

      // Verify the Firebase ID token
      const decodedToken = await getAuth().verifyIdToken(token);
      const { uid, email, name, picture } = decodedToken;

      if (!email) {
        return res.status(400).json({ message: 'Email is required from social provider' });
      }

      // Find user or create if they don't exist
      let user = await User.findOne({ email }).select('+refreshTokens');
      
      if (!user) {
        // Create new user (using a random password since they login via social)
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 12);
        
        user = await User.create({
          name: name || email.split('@')[0],
          email: email,
          password: hashedPassword,
          avatarUrl: picture || ''
        });

        // Seed welcome notification for new social login user
        await seedWelcomeNotification(user._id);
      } else if (!user.avatarUrl && picture) {
         // Optionally update avatar if they didn't have one
         await User.findByIdAndUpdate(user._id, { avatarUrl: picture });
         user.avatarUrl = picture;
      }

      // Generate our custom tokens
      const accessToken  = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken();

      const hashed = hashToken(refreshToken);
      const updatedTokens = [...(user.refreshTokens || []), hashed].slice(-5);
      await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json(serializeUser(user, accessToken));
    } catch (error) {
      console.error('Social login error:', error);
      if (error.code && error.code.startsWith('auth/')) {
        return res.status(401).json({ message: 'Invalid or expired social token' });
      }
      res.status(500).json({ message: 'Server error during social login. Please check backend logs.' });
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
  res.json(serializeUser(req.user));
});

// @route  POST /api/auth/invites
// @access Private
router.post('/invites', protect, inviteCreateLimiter, async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const currentUser = await User.findById(currentUserId).select('partnerId');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.partnerId) {
      return res.status(409).json({ message: 'You are already connected with a partner' });
    }

    const now = new Date();
    await PartnerInvite.updateMany(
      { inviterId: currentUserId, status: 'pending', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    let invite = await PartnerInvite.findOne({
      inviterId: currentUserId,
      status: 'pending',
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    let statusCode = 200;
    if (!invite) {
      invite = await PartnerInvite.create({
        code: await generateUniqueInviteCode(),
        inviterId: currentUserId,
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
      });
      statusCode = 201;
    }

    res.status(statusCode).json({
      code: invite.code,
      expiresAt: invite.expiresAt,
      status: invite.status,
    });
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/auth/invites/:code
// @access Public
router.get('/invites/:code', invitePreviewLimiter, inviteCodeParamRules, validate, async (req, res) => {
  try {
    const code = normalizeInviteCode(req.params.code);
    const invite = await PartnerInvite.findOne({ code })
      .populate('inviterId', 'name partnerId')
      .lean();

    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: inviteUnavailableMessage });
    }

    if (new Date(invite.expiresAt) <= new Date()) {
      await PartnerInvite.updateOne({ _id: invite._id }, { $set: { status: 'expired' } });
      return res.status(410).json({ message: inviteUnavailableMessage });
    }

    if (!invite.inviterId || invite.inviterId.partnerId) {
      return res.status(409).json({ message: 'This invite is no longer available' });
    }

    res.json({
      code: invite.code,
      inviterName: invite.inviterId.name,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.error('Preview invite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/auth/invites/accept
// @access Private
router.post('/invites/accept', protect, inviteAcceptLimiter, inviteCodeRules, validate, async (req, res) => {
  try {
    const code = normalizeInviteCode(req.body.code);
    const now = new Date();
    const invite = await PartnerInvite.findOne({ code })
      .populate('inviterId', 'name email partnerId relationshipStartDate');

    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: inviteUnavailableMessage });
    }

    if (invite.expiresAt <= now) {
      await PartnerInvite.updateOne({ _id: invite._id }, { $set: { status: 'expired' } });
      return res.status(410).json({ message: inviteUnavailableMessage });
    }

    const inviter = invite.inviterId;
    if (!inviter) {
      return res.status(404).json({ message: inviteUnavailableMessage });
    }

    if (inviter._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You can't accept your own invite code" });
    }

    const invitee = await User.findById(req.user._id);
    if (!invitee) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (invitee.partnerId) {
      return res.status(409).json({ message: 'You are already connected with a partner' });
    }

    const inviterFresh = await User.findById(inviter._id);
    if (!inviterFresh || inviterFresh.partnerId) {
      return res.status(409).json({ message: 'This invite is no longer available' });
    }

    const claimedInvite = await PartnerInvite.findOneAndUpdate(
      { _id: invite._id, status: 'pending', acceptedBy: null, expiresAt: { $gt: now } },
      { $set: { status: 'accepted', acceptedBy: invitee._id, acceptedAt: now } },
      { new: true }
    );

    if (!claimedInvite) {
      return res.status(409).json({ message: inviteUnavailableMessage });
    }

    const sharedStartDate = invitee.relationshipStartDate || inviterFresh.relationshipStartDate || null;
    const inviteeUpdate = { partnerId: inviterFresh._id };
    const inviterUpdate = { partnerId: invitee._id };
    if (sharedStartDate) {
      inviteeUpdate.relationshipStartDate = sharedStartDate;
      inviterUpdate.relationshipStartDate = sharedStartDate;
    }

    const updatedInvitee = await User.findOneAndUpdate(
      { _id: invitee._id, partnerId: null },
      { $set: inviteeUpdate },
      { new: true }
    );

    if (!updatedInvitee) {
      await PartnerInvite.findByIdAndUpdate(claimedInvite._id, {
        $set: { status: 'pending' },
        $unset: { acceptedBy: '', acceptedAt: '' },
      });
      return res.status(409).json({ message: 'You are already connected with a partner' });
    }

    const updatedInviter = await User.findOneAndUpdate(
      { _id: inviterFresh._id, partnerId: null },
      { $set: inviterUpdate },
      { new: true }
    );

    if (!updatedInviter) {
      await User.findOneAndUpdate(
        { _id: invitee._id, partnerId: inviterFresh._id },
        { $set: { partnerId: null } }
      );
      await PartnerInvite.findByIdAndUpdate(claimedInvite._id, {
        $set: { status: 'revoked', revokedAt: new Date() },
      });
      return res.status(409).json({ message: 'This invite is no longer available' });
    }

    await PartnerInvite.updateMany(
      {
        _id: { $ne: claimedInvite._id },
        inviterId: { $in: [invitee._id, inviterFresh._id] },
        status: 'pending',
      },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );

    // Create notifications for both partners
    await Promise.all([
      createNotification(updatedInvitee._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${inviterFresh.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      }),
      createNotification(updatedInviter._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${updatedInvitee.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      })
    ]);

    res.json({
      message: 'Partner linked successfully',
      partnerId: updatedInviter._id,
      partnerName: updatedInviter.name,
      user: serializeUser(updatedInvitee),
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/auth/link-partner
// @access Private  (validated)
router.post('/link-partner', protect, linkPartnerRules, validate, async (req, res) => {
  try {
    const { partnerEmail } = req.body;
    const partner = await User.findOne({ email: partnerEmail });

    if (!partner) return res.status(404).json({ message: 'No user found with that email' });
    if (partner._id.equals(req.user._id)) return res.status(400).json({ message: "You can't link to yourself" });
    if (req.user.partnerId) return res.status(409).json({ message: 'You are already connected with a partner' });
    if (partner.partnerId) return res.status(409).json({ message: 'That user is already connected with a partner' });

    await User.findByIdAndUpdate(req.user._id, { partnerId: partner._id });
    await User.findByIdAndUpdate(partner._id, { partnerId: req.user._id });

    // Create notifications for both partners
    await Promise.all([
      createNotification(req.user._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${partner.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      }),
      createNotification(partner._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${req.user.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      })
    ]);

    res.json({ message: 'Partner linked successfully', partnerId: partner._id, partnerName: partner.name });
  } catch (err) {
    console.error('Link partner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/auth/login-with-code
// @access Public
router.post('/login-with-code', loginLimiter, async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Partner invite code is required' });
    }

    const normalizedCode = normalizeInviteCode(code);
    const now = new Date();
    const invite = await PartnerInvite.findOne({ code: normalizedCode })
      .populate('inviterId', 'name email partnerId relationshipStartDate');

    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: inviteUnavailableMessage });
    }

    if (invite.expiresAt <= now) {
      await PartnerInvite.updateOne({ _id: invite._id }, { $set: { status: 'expired' } });
      return res.status(410).json({ message: inviteUnavailableMessage });
    }

    const inviter = invite.inviterId;
    if (!inviter || inviter.partnerId) {
      return res.status(409).json({ message: 'This invite is no longer available' });
    }

    // Create new partner user without email
    const partnerName = (name && name.trim()) ? name.trim() : 'Partner';
    const newUser = await User.create({
      name: partnerName,
      email: null,
      partnerId: inviter._id,
      relationshipStartDate: inviter.relationshipStartDate || null,
    });

    // Mark invite as accepted
    await PartnerInvite.updateOne(
      { _id: invite._id },
      { $set: { status: 'accepted', acceptedBy: newUser._id, acceptedAt: now } }
    );

    // Link inviter to new user
    await User.findByIdAndUpdate(inviter._id, {
      partnerId: newUser._id,
      ...(inviter.relationshipStartDate ? {} : { relationshipStartDate: newUser.relationshipStartDate }),
    });

    // Seed welcome notification
    await seedWelcomeNotification(newUser._id);

    // Send partner_linked notifications to both
    await Promise.all([
      createNotification(newUser._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${inviter.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      }),
      createNotification(inviter._id, {
        title: 'Partner connected! 💑',
        message: `You are now linked with ${newUser.name || 'your partner'}. You can now share memories and messages!`,
        type: 'partner_linked'
      })
    ]);

    // Generate tokens
    const accessToken  = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken();

    const hashed = hashToken(refreshToken);
    await User.findByIdAndUpdate(newUser._id, {
      refreshTokens: [hashed]
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json(serializeUser(newUser, accessToken));
  } catch (err) {
    console.error('Login with code error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;

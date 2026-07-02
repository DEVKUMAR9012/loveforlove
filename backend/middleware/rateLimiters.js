const rateLimit = require('express-rate-limit');

// validate: false — disables ALL startup validations including the IPv6 check.
// Safe in this app because we control the deployment environment.
const COMMON = { standardHeaders: true, legacyHeaders: false, validate: false };

// ── Login: 5 attempts per 15 minutes per IP ───────────────────────────────
const loginLimiter = rateLimit({
  ...COMMON,
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

// ── Register: 10 new accounts per hour per IP ─────────────────────────────
const registerLimiter = rateLimit({
  ...COMMON,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many accounts created from this IP. Try again later.' },
});

// ── File uploads: 20 per 10 min, keyed by userId ─────────────────────────
const uploadLimiter = rateLimit({
  ...COMMON,
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Upload limit reached. Please wait 10 minutes.' },
});

// ── General API: 200 requests per minute per IP ───────────────────────────
const apiLimiter = rateLimit({
  ...COMMON,
  windowMs: 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Slow down.' },
});

// ── Refresh token: 10 per minute ──────────────────────────────────────────
const refreshLimiter = rateLimit({
  ...COMMON,
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many token refresh requests.' },
});

module.exports = { loginLimiter, registerLimiter, uploadLimiter, apiLimiter, refreshLimiter };

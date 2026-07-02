const { body, validationResult } = require('express-validator');

// ── Helper: sends 422 with all validation errors if any exist ─────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const linkPartnerRules = [
  body('partnerEmail')
    .trim()
    .notEmpty().withMessage('Partner email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
];

// ── Memory / caption validators ────────────────────────────────────────────
const captionRules = [
  body('caption')
    .optional()
    .isString().withMessage('Caption must be a string')
    .isLength({ max: 500 }).withMessage('Caption must be 500 characters or less')
    .trim(),
];

// ── Message validators ─────────────────────────────────────────────────────
const messageRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required')
    .isLength({ max: 2000 }).withMessage('Message must be 2000 characters or less'),
];

// ── Mood validators ────────────────────────────────────────────────────────
const moodRules = [
  body('mood')
    .trim()
    .notEmpty().withMessage('Mood is required')
    .isIn(['happy', 'sad', 'excited', 'anxious', 'loved', 'tired', 'angry', 'calm', 'miss you'])
    .withMessage('Invalid mood value'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  linkPartnerRules,
  captionRules,
  messageRules,
  moodRules,
};

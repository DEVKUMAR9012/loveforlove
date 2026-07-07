const { body, param, validationResult } = require('express-validator');

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

const normalizeInviteCode = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');

const inviteCodeRules = [
  body('code')
    .customSanitizer(normalizeInviteCode)
    .notEmpty().withMessage('Invite code is required')
    .matches(/^[A-Z2-9]{8}$/).withMessage('Invite code must be 8 characters'),
];

const inviteCodeParamRules = [
  param('code')
    .customSanitizer(normalizeInviteCode)
    .notEmpty().withMessage('Invite code is required')
    .matches(/^[A-Z2-9]{8}$/).withMessage('Invite code must be 8 characters'),
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

const calendarEventRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 80 }).withMessage('Title must be 80 characters or less'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO date'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['anniversary', 'date-night', 'birthday', 'reminder', 'trip'])
    .withMessage('Invalid category'),
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 500 }).withMessage('Notes must be 500 characters or less')
    .trim(),
  body('recurrence')
    .optional()
    .isIn(['none', 'yearly']).withMessage('Invalid recurrence'),
  body('reminder')
    .optional()
    .isIn(['none', 'same-day', 'one-day-before', 'both']).withMessage('Invalid reminder'),
  body('photoUrl')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Photo URL must be a valid http(s) URL')
    .trim(),
  body('photoMemoryId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Photo memory must be a valid memory id'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  linkPartnerRules,
  inviteCodeRules,
  inviteCodeParamRules,
  captionRules,
  messageRules,
  moodRules,
  calendarEventRules,
};

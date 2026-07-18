const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  updateLocation,
  getPartnerLocation,
  setLocationSharing,
  getOwnLocationHistory,
  pauseLocationSharing,
  resumeLocationSharing,
  createSafeZone,
  getSafeZones,
  deleteSafeZone,
  getDistanceStats,
} = require('../controllers/locationController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/location/update
// Update current user's location
router.post(
  '/update',
  updateLocation
);

// GET /api/location/partner
// Get partner's current location
router.get('/partner', getPartnerLocation);

// POST /api/location/sharing
// Toggle current user's location sharing flag
router.post('/sharing', setLocationSharing);

// GET /api/location/history?hours=24
// Get current user's own location trail
router.get('/history', getOwnLocationHistory);

// POST /api/location/pause
// Pause location sharing
router.post('/pause', pauseLocationSharing);

// POST /api/location/resume
// Resume location sharing
router.post('/resume', resumeLocationSharing);

// POST /api/location/safe-zone
// Create a new safe zone
router.post(
  '/safe-zone',
  body('name').isIn(['Home', 'Office', 'College', 'Gym', 'Friend', 'Custom']),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('radiusMeters').optional().isInt({ min: 100, max: 5000 }),
  body('address').optional().isString(),
  handleValidationErrors,
  createSafeZone
);

// GET /api/location/safe-zones
// Get all safe zones
router.get('/safe-zones', getSafeZones);

// DELETE /api/location/safe-zone/:zoneId
// Delete a safe zone
router.delete('/safe-zone/:zoneId', deleteSafeZone);

// GET /api/location/distance-stats
// Get distance/meeting statistics
router.get('/distance-stats', getDistanceStats);

module.exports = router;

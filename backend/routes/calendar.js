const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');
const { calendarEventRules, validate } = require('../middleware/validators');

router.get('/', protect, calendarController.list);
router.post('/', protect, calendarEventRules, validate, calendarController.create);
router.put('/:id', protect, calendarEventRules, validate, calendarController.update);
router.delete('/:id', protect, calendarController.delete);

module.exports = router;

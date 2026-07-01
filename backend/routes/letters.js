const express = require('express');
const router = express.Router();
const lettersController = require('../controllers/lettersController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, lettersController.list);
router.post('/', protect, lettersController.create);
router.get('/:id', protect, lettersController.get);
router.post('/:id/unlock', protect, lettersController.unlock);
router.put('/:id', protect, lettersController.update);
router.delete('/:id', protect, lettersController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const memoriesController = require('../controllers/memoriesController');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { captionRules, validate } = require('../middleware/validators');
const multer = require('multer');

// Memory storage — files never touch disk, only held in RAM buffer
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, memoriesController.list);
router.post('/', protect, memoriesController.create);
router.post('/upload', protect, uploadLimiter, upload.single('file'), memoriesController.uploadImage);
router.get('/:id', protect, memoriesController.get);
router.delete('/:id', protect, memoriesController.delete);

// Update caption on the back of a photo (owner only)
router.patch('/:id/caption', protect, captionRules, validate, async (req, res) => {
  try {
    const Memory = require('../models/Memory');
    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { caption: req.body.caption?.trim() || '' },
      { new: true }
    );
    if (!memory) return res.status(404).json({ error: 'Not found or not authorized' });
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

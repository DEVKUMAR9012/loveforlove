const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const Report = require('../models/Report');
const { sendReportEmail } = require('../services/emailService');

// POST /api/reports — any logged-in user can submit a report
router.post('/', protect, async (req, res) => {
  try {
    const { category, title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const report = await Report.create({
      userId: req.user._id,
      userName: req.user.name || '',
      userEmail: req.user.email || '',
      category: category || 'bug',
      title: title.trim(),
      description: description.trim(),
    });

    // Send email notification to admin (fire-and-forget, don't block the response)
    sendReportEmail(report).catch((err) =>
      console.error('[Email] Failed to send report notification:', err.message)
    );

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports — admin only: view all reports
router.get('/', protect, adminMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/status — admin only: update report status
router.patch('/:id/status', protect, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reports/:id — admin only: permanently delete a report
router.delete('/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

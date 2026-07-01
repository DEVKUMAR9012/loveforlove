const Letter = require('../models/Letter');

exports.list = async (req, res) => {
  try {
    const letters = await Letter.find({ userId: req.user._id }).sort({ title: 1 });
    res.json(letters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, type, isLocked, unlockCondition } = req.body;
    const l = new Letter({ userId: req.user._id, title, content, type, isLocked, unlockCondition });
    await l.save();
    res.status(201).json(l);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id });
    if (!letter) return res.status(404).json({ error: 'Not found' });
    res.json(letter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unlock = async (req, res) => {
  try {
    const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id });
    if (!letter) return res.status(404).json({ error: 'Not found' });

    const { forceUnlock } = req.body;
    if (forceUnlock) {
      letter.isLocked = false;
      await letter.save();
      return res.json(letter);
    }

    res.status(403).json({ error: 'Unlock condition not satisfied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const letter = await Letter.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!letter) return res.status(404).json({ error: 'Not found or not authorized' });
    res.json(letter);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id });
    if (!letter) return res.status(404).json({ error: 'Not found or not authorized' });
    await Letter.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

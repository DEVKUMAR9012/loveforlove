const Message = require('../models/Message');

exports.list = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(1000);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { sender, text, emojis, timestamp } = req.body;
    const m = new Message({ sender, text, emojis: emojis || [], timestamp: timestamp || Date.now() });
    await m.save();
    res.status(201).json(m);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const total = await Message.countDocuments();
    const topSenders = await Message.aggregate([
      { $group: { _id: '$sender', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const emojis = await Message.aggregate([
      { $unwind: '$emojis' },
      { $group: { _id: '$emojis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ total, topSenders, topEmojis: emojis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

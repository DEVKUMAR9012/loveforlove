const CalendarEvent = require('../models/CalendarEvent');

const YEARLY_CATEGORIES = new Set(['anniversary', 'birthday']);

const getSharedUserIds = (user) => {
  const ids = [user._id];
  if (user.partnerId) ids.push(user.partnerId);
  return ids;
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeEventPayload = (body) => {
  const category = body.category || 'reminder';
  const recurrence = YEARLY_CATEGORIES.has(category) ? 'yearly' : (body.recurrence || 'none');

  return {
    title: cleanString(body.title),
    date: new Date(body.date),
    category,
    notes: cleanString(body.notes),
    recurrence,
    reminder: body.reminder || 'one-day-before',
    photoUrl: cleanString(body.photoUrl),
    photoMemoryId: body.photoMemoryId || null,
  };
};

const serializeEvent = (event) => {
  const obj = event.toObject();
  const creator = obj.userId && typeof obj.userId === 'object' ? obj.userId : null;

  return {
    ...obj,
    userId: creator?._id || obj.userId,
    createdBy: creator
      ? {
          _id: creator._id,
          name: creator.name,
          email: creator.email,
          avatarUrl: creator.avatarUrl,
        }
      : null,
  };
};

exports.list = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId: { $in: getSharedUserIds(req.user) } })
      .populate('userId', 'name email avatarUrl')
      .sort({ date: 1, createdAt: 1 });

    res.json(events.map(serializeEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const event = await CalendarEvent.create({
      ...normalizeEventPayload(req.body),
      userId: req.user._id,
    });

    const saved = await CalendarEvent.findById(event._id).populate('userId', 'name email avatarUrl');
    res.status(201).json(serializeEvent(saved));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: getSharedUserIds(req.user) } },
      normalizeEventPayload(req.body),
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatarUrl');

    if (!event) return res.status(404).json({ error: 'Not found or not authorized' });
    res.json(serializeEvent(event));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      userId: { $in: getSharedUserIds(req.user) },
    });

    if (!event) return res.status(404).json({ error: 'Not found or not authorized' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

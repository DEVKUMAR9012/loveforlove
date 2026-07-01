const initFirebaseAdmin = require('../config/firebaseAdmin');
const admin = initFirebaseAdmin();

// middleware that tries to verify Firebase token; if no admin initialized behaves as optional pass-through
module.exports = {
  required: async (req, res, next) => {
    if (!admin || !admin.auth) return res.status(500).json({ error: 'Firebase admin not configured' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },
  optional: async (req, res, next) => {
    if (!admin || !admin.auth) return next();
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
    } catch (err) {
      // ignore invalid tokens for optional middleware
    }
    next();
  },
};

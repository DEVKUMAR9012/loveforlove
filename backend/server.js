require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiters');

// routes
const authRoutes     = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const memoriesRoutes = require('./routes/memories');
const lettersRoutes  = require('./routes/letters');
const voiceRoutes    = require('./routes/voice');
const moodRoutes     = require('./routes/mood');
const adminRoutes    = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const calendarRoutes = require('./routes/calendar');
const snapsRoutes    = require('./routes/snaps');
const aiRoutes       = require('./routes/ai');
const reportsRoutes       = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser()); // needed to read HttpOnly refresh-token cookie

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  'https://loveforlove.vercel.app'
];

if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed origins list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // In development/hobby mode, you might want to just allow it or log it
    console.log("Blocked CORS request from origin:", origin);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true, // required for cookies to be sent cross-origin
}));

// ── Database ──────────────────────────────────────────────────────────────
connectDB();

// ── Trust proxy (set false in dev, 1 in production behind a load balancer) ──
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// ── Global rate limiter (200 req/min per IP) ──────────────────────────────
app.use('/api', apiLimiter);


// ── Health ────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/letters',  lettersRoutes);
app.use('/api/voice',    voiceRoutes);
app.use('/api/mood',     moodRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/snaps',    snapsRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/reports',        reportsRoutes);
app.use('/api/notifications',  notificationsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────
// Catches any error thrown in a route/middleware that called next(err).
// Prevents unhandled errors from crashing the server.
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Unhandled rejection guard ─────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Don't crash in production — just log it
});

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiters');
const { Server } = require('socket.io');

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
const locationRoutes = require('./routes/location');

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
app.use('/api/notifications',  notificationsRoutes);app.use('/api/location',       locationRoutes);
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
// ── Socket.io setup ───────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication failed'));
  }

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your_secret');
    socket.userId = decoded.id;
    socket.partnerId = decoded.partnerId; // Store partnerId for broadcasting
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected (socket: ${socket.id})`);

  // Join a room named after the relationship (assuming couple uses same room key)
  // Convention: room name = sorted([user1Id, user2Id]).join('-')
  if (socket.partnerId) {
    const roomKey = [socket.userId, socket.partnerId].sort().join('-');
    socket.join(roomKey);
    console.log(`User ${socket.userId} joined room: ${roomKey}`);

    // Notify partner that user is online
    io.to(roomKey).emit('location:user-online', {
      userId: socket.userId,
      socketId: socket.id,
    });
  }

  // Handle location updates
  socket.on('location:update', (data) => {
    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');

      // Broadcast updated location to partner
      io.to(roomKey).emit('location:update', {
        userId: socket.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        battery: data.battery,
        speed: data.speed,
        heading: data.heading,
        timestamp: new Date(),
      });
    }
  });

  // Handle "send a hug" event
  socket.on('hug:send', (data) => {
    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');

      // Broadcast hug to partner
      io.to(roomKey).emit('hug:received', {
        fromUserId: socket.userId,
        timestamp: new Date(),
      });
    }
  });

  // Handle arrival celebration
  socket.on('arrival:celebrate', (data) => {
    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');

      // Broadcast arrival to both (partner will see celebration)
      io.to(roomKey).emit('arrival:celebrate', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    }
  });

  // Handle geofence event (entered/exited zone)
  socket.on('geofence:event', (data) => {
    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');

      // Broadcast geofence event to partner
      io.to(roomKey).emit('geofence:event', {
        userId: socket.userId,
        zoneId: data.zoneId,
        zoneName: data.zoneName,
        eventType: data.eventType, // 'enter' or 'exit'
        timestamp: new Date(),
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected (socket: ${socket.id})`);

    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');
      io.to(roomKey).emit('location:user-offline', {
        userId: socket.userId,
      });
    }
  });

  // Handle error
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
});

// Attach io to app for use in controllers/middleware
app.io = io;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});

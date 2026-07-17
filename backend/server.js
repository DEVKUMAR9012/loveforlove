require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiters');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

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

function isPrivateNetworkDevOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:') return false;

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return isPrivateNetworkDevOrigin(origin);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (isAllowedOrigin(origin)) return callback(null, true);
    
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
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication failed'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CHANGE_ME_access_secret');
    const user = await User.findById(decoded.id).select('partnerId');

    if (!user) {
      return next(new Error('Invalid user'));
    }

    socket.userId = user._id.toString();
    socket.partnerId = user.partnerId ? user.partnerId.toString() : null;
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
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

  // Keep pause/resume visible to both partners. The HTTP endpoint persists the
  // state; this socket event makes the UI transparent in real time.
  socket.on('location:sharing-state', (data) => {
    if (socket.partnerId) {
      const roomKey = [socket.userId, socket.partnerId].sort().join('-');

      io.to(roomKey).emit('location:sharing-state', {
        userId: socket.userId,
        sharingActive: data?.sharingActive === true,
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

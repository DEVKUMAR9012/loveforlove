require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiters');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const {
  getCoupleRoomName,
  saveUserLocation,
  setUserLocationSharing,
} = require('./services/locationService');

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

function getSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers?.authorization;
  if (header?.startsWith('Bearer ')) return header.split(' ')[1];

  return socket.handshake.query?.token || null;
}

function emitLocationSocketError(socket, message) {
  socket.emit('location:error', { message });
}

function partnerRoom(socket) {
  if (!socket.coupleRoom) return null;
  return socket.to(socket.coupleRoom).except(socket.userRoom);
}

async function handleSharingToggle(socket, data, ack) {
  try {
    const isSharing = data?.isSharing;
    const result = await setUserLocationSharing(socket.userId, isSharing);

    partnerRoom(socket)?.emit('partner:sharingChanged', {
      userId: socket.userId,
      isSharing: result.isSharing,
      updatedAt: new Date(),
    });

    if (typeof ack === 'function') {
      ack({ ok: true, isSharing: result.isSharing });
    }
  } catch (error) {
    const message = error.statusCode && error.statusCode < 500
      ? error.message
      : 'Failed to update location sharing';

    console.error('Socket sharing toggle error:', error);
    emitLocationSocketError(socket, message);
    if (typeof ack === 'function') ack({ ok: false, message });
  }
}

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = getSocketToken(socket);
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
    socket.userRoom = `user:${socket.userId}`;
    socket.coupleRoom = getCoupleRoomName(socket.userId, socket.partnerId);
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Invalid token'));
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected (socket: ${socket.id})`);
  socket.join(socket.userRoom);

  if (socket.coupleRoom) {
    socket.join(socket.coupleRoom);
    console.log(`User ${socket.userId} joined room: ${socket.coupleRoom}`);
  } else {
    console.log(`User ${socket.userId} connected without a linked partner`);
  }

  socket.on('location:update', async (data, ack) => {
    try {
      if (!socket.coupleRoom) {
        if (typeof ack === 'function') ack({ ok: false, message: 'No partner found' });
        return;
      }

      const result = await saveUserLocation(socket.userId, data, { requireSharing: true });
      if (result.ignored) {
        if (typeof ack === 'function') ack({ ok: true, ignored: true, reason: result.reason });
        return;
      }

      partnerRoom(socket)?.emit('partner:location', {
        userId: socket.userId,
        ...result.location,
      });

      if (typeof ack === 'function') ack({ ok: true, location: result.location });
    } catch (error) {
      const message = error.statusCode && error.statusCode < 500
        ? error.message
        : 'Failed to update location';

      console.error('Socket location update error:', error);
      emitLocationSocketError(socket, message);
      if (typeof ack === 'function') ack({ ok: false, message });
    }
  });

  socket.on('sharing:toggle', (data, ack) => {
    handleSharingToggle(socket, data, ack);
  });

  // Backward-compatible alias for older clients.
  socket.on('location:sharing-state', (data, ack) => {
    handleSharingToggle(socket, { isSharing: data?.sharingActive === true }, ack);
  });

  socket.on('hug:send', () => {
    partnerRoom(socket)?.emit('hug:received', {
      fromUserId: socket.userId,
      timestamp: new Date(),
    });
  });

  socket.on('arrival:celebrate', () => {
    partnerRoom(socket)?.emit('arrival:celebrate', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });

  socket.on('geofence:event', (data = {}) => {
    partnerRoom(socket)?.emit('geofence:event', {
      userId: socket.userId,
      zoneId: data.zoneId,
      zoneName: data.zoneName,
      eventType: data.eventType,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.userId} disconnected (socket: ${socket.id}, reason: ${reason})`);
  });

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

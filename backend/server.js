require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// routes
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const memoriesRoutes = require('./routes/memories');
const lettersRoutes = require('./routes/letters');
const voiceRoutes = require('./routes/voice');
const moodRoutes = require('./routes/mood');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Production-safe CORS — set ALLOWED_ORIGIN in your deployment env vars
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// connect to MongoDB
connectDB();

// health
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// api
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/mood', moodRoutes);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop any other backend instance or change PORT.`);
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});

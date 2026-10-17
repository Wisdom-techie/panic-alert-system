require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const alertRoutes = require('./routes/alertRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const { initWebSocket } = require('./websocket/wsManager');

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet());

// Cookie parser (needed for HttpOnly JWT cookie)
app.use(cookieParser());

// CORS — locked to production frontend only
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://panic-alert-system.vercel.app';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Body parsing
app.use(express.json());

// Sanitize MongoDB queries against injection ($where, $gt tricks, etc.)
app.use(mongoSanitize());

// Global rate limit — 200 requests per 15 minutes per IP (covers all routes not already limited)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// Routes
app.use('/api', alertRoutes);
app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Panic Alert System - Server Running' });
});

initWebSocket(server);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
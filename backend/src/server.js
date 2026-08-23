require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

const alertRoutes = require('./routes/alertRoutes');
const { initWebSocket } = require('./websocket/wsManager');



const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use('/api', alertRoutes);
const { router: authRoutes } = require('./routes/authRoutes');
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
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


const JWT_SECRET = process.env.JWT_SECRET || 'rsu-panic-alert-secret-change-this';

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, full_name: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, full_name: user.full_name, role: user.role },
    });
  } catch (error) {
    console.error('[POST /auth/login]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Middleware to require master role
function requireMaster(req, res, next) {
  if (req.user.role !== 'master') {
    return res.status(403).json({ success: false, message: 'Master account required' });
  }
  next();
}

// GET /api/auth/me
router.get('/auth/me', verifyToken, (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

// GET /api/auth/users (master only)
router.get('/auth/users', verifyToken, requireMaster, async (req, res) => {
  try {
    const users = await User.find({}, '-password_hash').sort({ created_at: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/users (master only) - create staff account
router.post('/auth/users', verifyToken, requireMaster, async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim().toLowerCase(),
      password_hash,
      full_name,
      role: role === 'master' ? 'master' : 'staff',
    });

    return res.status(200).json({
      success: true,
      user: { id: newUser._id, username: newUser.username, full_name: newUser.full_name, role: newUser.role },
    });
  } catch (error) {
    console.error('[POST /auth/users]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/auth/users/:id/toggle (master only) - activate/deactivate
router.patch('/auth/users/:id/toggle', verifyToken, requireMaster, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.active = !user.active;
    await user.save();

    return res.status(200).json({ success: true, user: { id: user._id, active: user.active } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/auth/users/:id (master only)
router.delete('/auth/users/:id', verifyToken, requireMaster, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'master') {
      return res.status(400).json({ success: false, message: 'Cannot delete a master account' });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = { router, verifyToken, requireMaster };
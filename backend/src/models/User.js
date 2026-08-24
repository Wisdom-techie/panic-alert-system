const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { type: String, enum: ['staff', 'master'], default: 'staff' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: null },
});

module.exports = mongoose.model('User', UserSchema);
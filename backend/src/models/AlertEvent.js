const mongoose = require('mongoose');

const AlertEventSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  event_type: {
    type: String,
    required: true,
    enum: ['PANIC'],
    default: 'PANIC',
  },
  alert_type: {
    type: String,
    required: true,
    enum: ['Robbery', 'Assault', 'Medical', 'Accident', 'Fire', 'Suspicious'],
  },
  location_label: { type: String, required: true },
  timestamp_ms: { type: Number, required: true },
  server_received_at: { type: Date, default: Date.now },
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
  },
  acknowledged: { type: Boolean, default: false },
  acknowledged_at: { type: Date, default: null },

  resolution_status: {
  type: String,
  enum: ['Pending', 'Resolved', 'False Alarm', 'Escalated'],
  default: 'Pending',
},
resolution_notes: { type: String, default: '' },
resolved_by: { type: String, default: '' },
resolved_at: { type: Date, default: null },
});

module.exports = mongoose.model('AlertEvent', AlertEventSchema);
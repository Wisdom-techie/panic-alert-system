const mongoose = require('mongoose');

const WitnessReportSchema = new mongoose.Schema({
  incident_type: {
    type: String,
    required: true,
    enum: ['Robbery', 'Assault', 'Medical', 'Accident', 'Fire', 'Suspicious', 'Other'],
  },
  location_label: { type: String, required: true },
  description: { type: String, required: true },
  file_url: { type: String, default: null },
  anonymous: { type: Boolean, default: false },
  reporter_contact: { type: String, default: null },
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
  },
  submitted_at: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false },
  reviewed_at: { type: Date, default: null },
});

module.exports = mongoose.model('WitnessReport', WitnessReportSchema);
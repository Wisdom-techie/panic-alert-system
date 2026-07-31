const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AlertEvent = require('../models/AlertEvent');
const { broadcast } = require('../websocket/wsManager');

router.post('/alert', async (req, res) => {
  try {
    const { device_id, location_label, timestamp_ms, coordinates } = req.body;

    if (!device_id || !location_label || !timestamp_ms) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newAlert = await AlertEvent.create({
      device_id,
      event_type: 'PANIC',
      location_label,
      timestamp_ms,
      server_received_at: new Date(),
      coordinates: coordinates || { latitude: null, longitude: null, accuracy: null },
    });

    broadcast({ type: 'NEW_ALERT', alert: newAlert });
    console.log(`[ALERT] ${device_id} — ${location_label}`);

    return res.status(200).json({ success: true, alert: newAlert });
  } catch (error) {
    console.error('[POST /alert]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { device_id, from, to, limit = 100 } = req.query;
    const query = {};

    if (device_id) query.device_id = device_id;
    if (from || to) {
      query.server_received_at = {};
      if (from) query.server_received_at.$gte = new Date(from);
      if (to) query.server_received_at.$lte = new Date(to);
    }

    const alerts = await AlertEvent.find(query)
      .sort({ server_received_at: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error('[GET /alerts]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Using POST instead of PATCH to avoid CORS preflight issues
router.post('/alert/:id/acknowledge', async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    console.log('[ACKNOWLEDGE] ID received:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('[ACKNOWLEDGE] Invalid ObjectId:', id);
      return res.status(400).json({ success: false, message: 'Invalid alert ID' });
    }

    const alert = await AlertEvent.findByIdAndUpdate(
      id,
      { acknowledged: true, acknowledged_at: new Date() },
      { new: true }
    );

    if (!alert) {
      console.error('[ACKNOWLEDGE] Alert not found:', id);
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    broadcast({
      type: 'ALERT_ACKNOWLEDGED',
      alertId: id,
      acknowledged_at: alert.acknowledged_at,
    });

    console.log('[ACKNOWLEDGE] Success:', id);
    return res.status(200).json({ success: true, alert });
  } catch (error) {
    console.error('[ACKNOWLEDGE] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
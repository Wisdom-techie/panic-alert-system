const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AlertEvent = require('../models/AlertEvent');
const WitnessReport = require('../models/WitnessReport');
const { broadcast } = require('../websocket/wsManager');
const { upload } = require('../config/cloudinary');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('../config/webpush');

const VALID_ALERT_TYPES = ['Robbery', 'Assault', 'Medical', 'Accident', 'Fire', 'Suspicious'];

// POST /api/alert
router.post('/alert', async (req, res) => {
  try {
    const { device_id, location_label, timestamp_ms, coordinates, alert_type } = req.body;

    if (!device_id || !location_label || !timestamp_ms || !alert_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!VALID_ALERT_TYPES.includes(alert_type)) {
      return res.status(400).json({ success: false, message: 'Invalid alert type' });
    }

    const newAlert = await AlertEvent.create({
      device_id,
      event_type: 'PANIC',
      alert_type,
      location_label,
      timestamp_ms,
      server_received_at: new Date(),
      coordinates: coordinates || { latitude: null, longitude: null, accuracy: null },
    });

    broadcast({ type: 'NEW_ALERT', alert: newAlert });
    sendPushToAllOperators(
  `${alert_type.toUpperCase()} ALERT`,
  `${device_id} — ${location_label}`,
  '/dashboard'
);
    console.log(`[ALERT] ${alert_type} - ${device_id} - ${location_label}`);
  
    return res.status(200).json({ success: true, alert: newAlert });
  } catch (error) {
    console.error('[POST /alert]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/alerts
router.get('/alerts', async (req, res) => {
  try {
    const { device_id, alert_type, from, to, limit = 100 } = req.query;
    const query = {};

    if (device_id) query.device_id = device_id;
    if (alert_type) query.alert_type = alert_type;
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

// POST /api/alert/:id/acknowledge
router.post('/alert/:id/acknowledge', async (req, res) => {
  try {
    const id = String(req.params.id).trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID' });
    }

    const alert = await AlertEvent.findByIdAndUpdate(
      id,
      { acknowledged: true, acknowledged_at: new Date() },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    broadcast({
      type: 'ALERT_ACKNOWLEDGED',
      alertId: id,
      acknowledged_at: alert.acknowledged_at,
    });

    return res.status(200).json({ success: true, alert });
  } catch (error) {
    console.error('[ACKNOWLEDGE]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/push/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[POST /push/subscribe]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/witness-report (with optional file upload)
router.post('/witness-report', upload.single('file'), async (req, res) => {
  try {
    const {
      incident_type,
      location_label,
      description,
      anonymous,
      reporter_contact,
      coordinates,
    } = req.body;

    if (!incident_type || !location_label || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let parsedCoords = { latitude: null, longitude: null, accuracy: null };
    if (coordinates) {
      try {
        parsedCoords = JSON.parse(coordinates);
      } catch (e) { /* ignore parse failure, keep default */ }
    }

    const newReport = await WitnessReport.create({
      incident_type,
      location_label,
      description,
      file_url: req.file ? req.file.path : null,
      anonymous: anonymous === 'true' || anonymous === true,
      reporter_contact: reporter_contact || null,
      coordinates: parsedCoords,
      submitted_at: new Date(),
    });

    broadcast({ type: 'NEW_WITNESS_REPORT', report: newReport });
    sendPushToAllOperators(
  'New Witness Report',
  `${incident_type} — ${location_label}`,
  '/dashboard'
);
    console.log(`[WITNESS REPORT] ${incident_type} - ${location_label}`);

    return res.status(200).json({ success: true, report: newReport });
  } catch (error) {
    console.error('[POST /witness-report]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/witness-reports
router.get('/witness-reports', async (req, res) => {
  try {
    const { incident_type, limit = 100 } = req.query;
    const query = {};
    if (incident_type) query.incident_type = incident_type;

    const reports = await WitnessReport.find(query)
      .sort({ submitted_at: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('[GET /witness-reports]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH-style review marker for witness reports (using POST to avoid CORS issues)
router.post('/witness-report/:id/review', async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await WitnessReport.findByIdAndUpdate(
      id,
      { reviewed: true, reviewed_at: new Date() },
      { returnDocument: 'after' }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    broadcast({ type: 'WITNESS_REPORT_REVIEWED', reportId: id, reviewed_at: report.reviewed_at });

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('[REVIEW REPORT]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [alertsByLocation, alertsByType, reportsByType, allAlerts, allReports] = await Promise.all([
      AlertEvent.aggregate([
        { $group: { _id: '$location_label', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AlertEvent.aggregate([
        { $group: { _id: '$alert_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      WitnessReport.aggregate([
        { $group: { _id: '$incident_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AlertEvent.find({}, 'server_received_at'),
      WitnessReport.find({}, 'submitted_at'),
    ]);

    // Build hourly distribution (0-23)
    const hourlyCounts = new Array(24).fill(0);
    allAlerts.forEach((a) => {
      const hour = new Date(a.server_received_at).getHours();
      hourlyCounts[hour]++;
    });
    allReports.forEach((r) => {
      const hour = new Date(r.submitted_at).getHours();
      hourlyCounts[hour]++;
    });

    const byHour = hourlyCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

    return res.status(200).json({
      success: true,
      totalAlerts: allAlerts.length,
      totalReports: allReports.length,
      alertsByLocation,
      alertsByType,
      reportsByType,
      byHour,
    });
  } catch (error) {
    console.error('[GET /analytics]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
async function sendPushToAllOperators(title, body, url) {
  try {
    const subscriptions = await PushSubscription.find();
    const payload = JSON.stringify({ title, body, url: url || '/dashboard' });

    await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        ).catch(async (err) => {
          // Remove dead subscriptions (expired or unsubscribed)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          }
        })
      )
    );
  } catch (err) {
    console.error('[PUSH] Error sending notifications:', err.message);
  }
}
router.patch('/alert/:id/location', async (req, res) => {
  try {
    const { coordinates } = req.body;
    const updated = await AlertEvent.findByIdAndUpdate(
      req.params.id,
      { coordinates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    broadcast({ type: 'ALERT_LOCATION_UPDATED', alertId: updated._id, coordinates });

    return res.status(200).json({ success: true, alert: updated });
  } catch (error) {
    console.error('[PATCH /alert/:id/location]', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
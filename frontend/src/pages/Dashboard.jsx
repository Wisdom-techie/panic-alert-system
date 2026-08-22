import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import { getStoredTheme, toggleTheme } from '../utils/theme';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ALERT_TYPES = ['All', 'Robbery', 'Assault', 'Medical', 'Accident', 'Fire', 'Suspicious'];
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

const TYPE_COLORS = {
  Robbery: 'red',
  Assault: 'orange',
  Medical: 'blue',
  Accident: 'purple',
  Fire: 'amber',
  Suspicious: 'dark',
  Other: 'dark',
};

function playAlertSound(audioCtxRef, isReport) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const freqs = isReport ? [523, 659] : [880, 660, 880];
    freqs.forEach((f, i) => {
      const t = i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch (e) {}
}
function MapsLink({ coords }) {
  if (!coords || !coords.latitude) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No GPS</span>;
  }
  const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="db-maps-link">
      📍 {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
    </a>
  );
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || 'dark';
  return <span className={`db-type-badge db-type-${color}`}>{type}</span>;
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeBanner, setActiveBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alerts');
  const [theme, setTheme] = useState(getStoredTheme());
  const [filterType, setFilterType] = useState('All');
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const audioCtxRef = useRef(null);
  const seenAlertIds = useRef(new Set());
  const seenReportIds = useRef(new Set());

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => !a.acknowledged).length,
    acked: alerts.filter((a) => a.acknowledged).length,
    reports: reports.length,
    unreviewed: reports.filter((r) => !r.reviewed).length,
  };

  function handleWsMessage(data) {
    if (data.type === 'NEW_ALERT') {
      const incoming = data.alert;
      if (seenAlertIds.current.has(incoming._id)) return;
      seenAlertIds.current.add(incoming._id);
      setAlerts((prev) => [incoming, ...prev]);
      setActiveBanner({ kind: 'alert', data: incoming });
      playAlertSound(audioCtxRef, false);
    }
    if (data.type === 'ALERT_ACKNOWLEDGED') {
      setAlerts((prev) =>
        prev.map((a) => a._id === data.alertId ? { ...a, acknowledged: true, acknowledged_at: data.acknowledged_at } : a)
      );
    }
    if (data.type === 'NEW_WITNESS_REPORT') {
      const incoming = data.report;
      if (seenReportIds.current.has(incoming._id)) return;
      seenReportIds.current.add(incoming._id);
      setReports((prev) => [incoming, ...prev]);
      setActiveBanner({ kind: 'report', data: incoming });
      playAlertSound(audioCtxRef, true);
    }
    if (data.type === 'WITNESS_REPORT_REVIEWED') {
      setReports((prev) =>
        prev.map((r) => r._id === data.reportId ? { ...r, reviewed: true, reviewed_at: data.reviewed_at } : r)
      );
    }
  }

  const { connected } = useWebSocket(handleWsMessage);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/alerts`, { headers: HEADERS }).then((r) => r.json()),
      fetch(`${API_URL}/api/witness-reports`, { headers: HEADERS }).then((r) => r.json()),
    ]).then(([alertData, reportData]) => {
      if (alertData.success) {
        setAlerts(alertData.alerts);
        alertData.alerts.forEach((a) => seenAlertIds.current.add(a._id));
      }
      if (reportData.success) {
        setReports(reportData.reports);
        reportData.reports.forEach((r) => seenReportIds.current.add(r._id));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const sirenIntervalRef = useRef(null);

  useEffect(() => {
    if (pushPermission === 'granted') {
      subscribeToPushNotifications();
    }
  }, [pushPermission]);

  useEffect(() => {
    const hasActiveAlert = alerts.some((a) => !a.acknowledged);

    if (hasActiveAlert) {
      if (!sirenIntervalRef.current) {
        sirenIntervalRef.current = setInterval(() => {
          playAlertSound(audioCtxRef, false);
        }, 3000);
      }
    } else {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    }

    return () => {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    };
  }, [alerts]);

  async function handleEnableNotifications() {
    const success = await subscribeToPushNotifications();
    if (success) {
      setPushPermission('granted');
    } else {
      setPushPermission(Notification.permission);
    }
  }

  function handleThemeToggle() {
    const next = toggleTheme();
    setTheme(next);
  }

  async function handleAcknowledge(id) {
    try {
      const res = await fetch(`${API_URL}/api/alert/${id}/acknowledge`, { method: 'POST', headers: HEADERS });
      const d = await res.json();
      if (d.success) {
        setAlerts((prev) =>
          prev.map((a) => a._id === id ? { ...a, acknowledged: true, acknowledged_at: d.alert.acknowledged_at } : a)
        );
      }
    } catch (e) { console.error(e); }
  }

  async function handleReview(id) {
    try {
      const res = await fetch(`${API_URL}/api/witness-report/${id}/review`, { method: 'POST', headers: HEADERS });
      const d = await res.json();
      if (d.success) {
        setReports((prev) =>
          prev.map((r) => r._id === id ? { ...r, reviewed: true, reviewed_at: d.report.reviewed_at } : r)
        );
      }
    } catch (e) { console.error(e); }
  }

  const filteredAlerts = alerts.filter((a) => filterType === 'All' || a.alert_type === filterType);

  return (
    <div className="dashboard-page">

      <header className="db-header">
        <div className="db-logo">
          <div className="db-logo-icon">🛡</div>
          <div>
            <h1>Security Monitoring Dashboard</h1>
            <p>Rivers State University — Real-Time Alert Management</p>
          </div>
        </div>
        <div className="db-header-right">
          <div className={`db-ws-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="db-ws-dot"></span>
            {connected ? 'Live Feed Active' : 'Reconnecting...'}
          </div>
          <Link to="/dashboard/analytics" className="db-node-link">Analytics →</Link>
          <Link to="/" className="db-node-link">← Panic Node</Link>
          <button className="db-theme-btn" onClick={handleThemeToggle}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            className="db-logout-btn"
            onClick={() => { sessionStorage.removeItem('rsu_security_auth'); window.location.href = '/login'; }}
          >
            Logout
          </button>
        </div>
      </header>

      {pushPermission !== 'granted' && (
        <div className="db-push-banner">
          <span>🔔 Enable push notifications to receive alerts even when this tab is closed or your screen is off.</span>
          <button onClick={handleEnableNotifications}>Enable Notifications</button>
        </div>
      )}

      {activeBanner && activeBanner.kind === 'alert' && (
        <div className="db-alert-banner">
          <div className="db-banner-inner">
            <span className="db-banner-siren">🚨</span>
            <div>
              <div className="db-banner-title">
                {activeBanner.data.alert_type?.toUpperCase()} ALERT RECEIVED
              </div>
              <div className="db-banner-meta">
                <span className="db-banner-chip">{activeBanner.data.device_id}</span>
                📍 {activeBanner.data.location_label}
                &nbsp;·&nbsp;
                {new Date(activeBanner.data.server_received_at).toLocaleTimeString()}
                {activeBanner.data.coordinates?.latitude && (
                  <a href={`https://www.google.com/maps?q=${activeBanner.data.coordinates.latitude},${activeBanner.data.coordinates.longitude}`} target="_blank" rel="noopener noreferrer" className="db-banner-maps">
                    🗺 Open in Maps
                  </a>
                )}
              </div>
            </div>
          </div>
          <button className="db-banner-dismiss" onClick={() => setActiveBanner(null)}>✕</button>
        </div>
      )}

      {activeBanner && activeBanner.kind === 'report' && (
        <div className="db-report-banner">
          <div className="db-banner-inner">
            <span className="db-banner-siren">📋</span>
            <div>
              <div className="db-banner-title">NEW WITNESS REPORT — {activeBanner.data.incident_type?.toUpperCase()}</div>
              <div className="db-banner-meta">
                📍 {activeBanner.data.location_label}
                &nbsp;·&nbsp;
                {new Date(activeBanner.data.submitted_at).toLocaleTimeString()}
                {activeBanner.data.anonymous && <span className="db-banner-chip">Anonymous</span>}
              </div>
            </div>
          </div>
          <button className="db-banner-dismiss" onClick={() => setActiveBanner(null)}>✕</button>
        </div>
      )}

      <div className="db-stats">
        <div className="db-stat total">
          <span className="db-stat-icon">📊</span>
          <div className="db-stat-number">{stats.total}</div>
          <div className="db-stat-label">Total Alerts</div>
        </div>
        <div className="db-stat active">
          <span className="db-stat-icon">⚠️</span>
          <div className="db-stat-number">{stats.active}</div>
          <div className="db-stat-label">Active</div>
        </div>
        <div className="db-stat acked">
          <span className="db-stat-icon">✅</span>
          <div className="db-stat-number">{stats.acked}</div>
          <div className="db-stat-label">Acknowledged</div>
        </div>
        <div className="db-stat reports">
          <span className="db-stat-icon">📋</span>
          <div className="db-stat-number">{stats.reports}</div>
          <div className="db-stat-label">Witness Reports</div>
        </div>
      </div>

      <div className="db-tabs">
        <button className={`db-tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>
          Emergency Alerts ({alerts.length})
        </button>
        <button className={`db-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          Witness Reports ({reports.length}) {stats.unreviewed > 0 && <span className="db-tab-badge">{stats.unreviewed}</span>}
        </button>
      </div>

      {tab === 'alerts' && (
        <div className="db-section">
          <div className="db-section-header">
            <div className="db-section-title">Alert Event Log</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="db-filter-select"
              >
                {ALERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="db-count-badge">{filteredAlerts.length} events</span>
            </div>
          </div>

          {loading ? (
            <div className="db-loading">Loading alert history...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="db-empty">
              {filterType === 'All'
                ? '🟢 No alerts recorded. System is actively monitoring all nodes.'
                : `No alerts of type "${filterType}" recorded.`}
            </div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Device ID</th>
                    <th>Location</th>
                    <th>GPS</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, i) => (
                    <tr key={alert._id} className={alert.acknowledged ? 'row-acked' : 'row-active'}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>{i + 1}</td>
                      <td><TypeBadge type={alert.alert_type} /></td>
                      <td><span className="db-device-tag">{alert.device_id}</span></td>
                      <td style={{ maxWidth: '200px' }}>{alert.location_label}</td>
                      <td><MapsLink coords={alert.coordinates} /></td>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                        {new Date(alert.server_received_at).toLocaleString()}
                      </td>
                      <td>
                        {alert.acknowledged
                          ? <span className="db-status-acked">✓ Acknowledged</span>
                          : <span className="db-status-active">⚠ Active</span>}
                      </td>
                      <td>
                        {alert.acknowledged
                          ? <span className="db-ack-time">{new Date(alert.acknowledged_at).toLocaleTimeString()}</span>
                          : <button className="db-ack-btn" onClick={() => handleAcknowledge(alert._id)}>Acknowledge</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="db-section">
          <div className="db-section-header">
            <div className="db-section-title">Witness Reports</div>
            <span className="db-count-badge">{reports.length} reports</span>
          </div>

          {loading ? (
            <div className="db-loading">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="db-empty">🟢 No witness reports submitted yet.</div>
          ) : (
            <div className="db-reports-list">
              {reports.map((r) => (
                <div key={r._id} className={`db-report-card ${r.reviewed ? 'reviewed' : ''}`}>
                  <div className="db-report-header">
                    <TypeBadge type={r.incident_type} />
                    <span className="db-report-location">📍 {r.location_label}</span>
                    <span className="db-report-time">{new Date(r.submitted_at).toLocaleString()}</span>
                  </div>
                  <p className="db-report-desc">{r.description}</p>
                  <div className="db-report-footer">
                    <div className="db-report-meta">
                      {r.anonymous ? (
                        <span className="db-report-tag">Anonymous</span>
                      ) : r.reporter_contact ? (
                        <span className="db-report-tag">Contact: {r.reporter_contact}</span>
                      ) : null}
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="db-report-file">
                          📎 View Evidence
                        </a>
                      )}
                      <MapsLink coords={r.coordinates} />
                    </div>
                    {r.reviewed ? (
                      <span className="db-status-acked">✓ Reviewed</span>
                    ) : (
                      <button className="db-ack-btn" onClick={() => handleReview(r._id)}>Mark Reviewed</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="db-footer">
        Smart Panic Alert System — By wisdom Stephen Chimzibudu, A Computer Engineering Final Year Student · Rivers State University · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
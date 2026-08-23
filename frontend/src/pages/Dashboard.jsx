import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import { getStoredTheme, toggleTheme } from '../utils/theme';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ALERT_TYPES = ['All', 'Robbery', 'Assault', 'Medical', 'Accident', 'Fire', 'Suspicious'];
const RESOLUTION_STATUSES = ['Resolved', 'False Alarm', 'Escalated'];
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

const Icon = {
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
    </svg>
  ),
  Siren: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1z" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  Clipboard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  CheckSmall: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Pin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Map: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  Paperclip: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

function playAlertSound(audioCtxRef, isReport) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (isReport) {
      const freqs = [523, 659];
      freqs.forEach((f, i) => {
        const t = i * 0.25;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + t);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.3);
      });
      return;
    }

    const duration = 1.6;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);

    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + duration * 0.25);
    osc.frequency.exponentialRampToValueAtTime(500, now + duration * 0.5);
    osc.frequency.exponentialRampToValueAtTime(1100, now + duration * 0.75);
    osc.frequency.exponentialRampToValueAtTime(500, now + duration);

    gain.gain.setValueAtTime(0.35, now + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {}
}

function MapsLink({ coords }) {
  if (!coords || !coords.latitude) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No GPS</span>;
  }
  const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="db-maps-link">
      <Icon.Pin /> {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
    </a>
  );
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || 'dark';
  return <span className={`db-type-badge db-type-${color}`}>{type}</span>;
}

function ResolutionBadge({ status }) {
  if (!status || status === 'Pending') return null;
  const cls = status === 'Resolved' ? 'db-res-resolved' : status === 'False Alarm' ? 'db-res-false' : 'db-res-escalated';
  return <span className={`db-res-badge ${cls}`}>{status}</span>;
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
  const [reportPanelAlert, setReportPanelAlert] = useState(null); // the alert being reported on
  const [resStatus, setResStatus] = useState(RESOLUTION_STATUSES[0]);
  const [resNotes, setResNotes] = useState('');
  const [resSubmitting, setResSubmitting] = useState(false);

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
    if (data.type === 'ALERT_LOCATION_UPDATED') {
      setAlerts((prev) =>
        prev.map((a) => a._id === data.alertId ? { ...a, coordinates: data.coordinates } : a)
      );
    }
    if (data.type === 'ALERT_RESOLVED') {
      setAlerts((prev) =>
        prev.map((a) => a._id === data.alertId ? { ...a, ...data.alert } : a)
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
    // Siren now stays active until an alert is BOTH acknowledged AND has a filed report
    const hasUnresolvedAlert = alerts.some((a) => !a.acknowledged || !a.resolution_status || a.resolution_status === 'Pending');

    if (hasUnresolvedAlert) {
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

  function openReportPanel(alert) {
    setReportPanelAlert(alert);
    setResStatus(RESOLUTION_STATUSES[0]);
    setResNotes('');
  }

  function closeReportPanel() {
    if (resSubmitting) return;
    setReportPanelAlert(null);
  }

  async function handleSubmitResolution(e) {
    e.preventDefault();
    if (!resNotes.trim() || !reportPanelAlert) return;
    setResSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/alert/${reportPanelAlert._id}/resolve`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          resolution_status: resStatus,
          resolution_notes: resNotes.trim(),
          resolved_by: 'RSU Security Operator',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setAlerts((prev) =>
          prev.map((a) => a._id === reportPanelAlert._id ? { ...a, ...d.alert } : a)
        );
        setReportPanelAlert(null);
      }
    } catch (e) { console.error(e); }
    setResSubmitting(false);
  }

  const filteredAlerts = alerts.filter((a) => filterType === 'All' || a.alert_type === filterType);

  return (
    <div className="dashboard-page">

      <header className="db-header">
        <div className="db-logo">
          <div className="db-logo-icon"><Icon.Shield /></div>
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
            {theme === 'dark' ? <><Icon.Sun /> Light</> : <><Icon.Moon /> Dark</>}
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
          <span><Icon.Bell /> Enable push notifications to receive alerts even when this tab is closed or your screen is off.</span>
          <button onClick={handleEnableNotifications}>Enable Notifications</button>
        </div>
      )}

      {activeBanner && activeBanner.kind === 'alert' && (
        <div className="db-alert-banner">
          <div className="db-banner-inner">
            <span className="db-banner-siren"><Icon.Siren /></span>
            <div>
              <div className="db-banner-title">
                {activeBanner.data.alert_type?.toUpperCase()} ALERT RECEIVED
              </div>
              <div className="db-banner-meta">
                <span className="db-banner-chip">{activeBanner.data.device_id}</span>
                <Icon.Pin /> {activeBanner.data.location_label}
                &nbsp;·&nbsp;
                {new Date(activeBanner.data.server_received_at).toLocaleTimeString()}
                {activeBanner.data.coordinates?.latitude && (
                  <a href={`https://www.google.com/maps?q=${activeBanner.data.coordinates.latitude},${activeBanner.data.coordinates.longitude}`} target="_blank" rel="noopener noreferrer" className="db-banner-maps">
                    <Icon.Map /> Open in Maps
                  </a>
                )}
              </div>
            </div>
          </div>
          <button className="db-banner-dismiss" onClick={() => setActiveBanner(null)}><Icon.X /></button>
        </div>
      )}

      {activeBanner && activeBanner.kind === 'report' && (
        <div className="db-report-banner">
          <div className="db-banner-inner">
            <span className="db-banner-siren"><Icon.Clipboard /></span>
            <div>
              <div className="db-banner-title">NEW WITNESS REPORT — {activeBanner.data.incident_type?.toUpperCase()}</div>
              <div className="db-banner-meta">
                <Icon.Pin /> {activeBanner.data.location_label}
                &nbsp;·&nbsp;
                {new Date(activeBanner.data.submitted_at).toLocaleTimeString()}
                {activeBanner.data.anonymous && <span className="db-banner-chip">Anonymous</span>}
              </div>
            </div>
          </div>
          <button className="db-banner-dismiss" onClick={() => setActiveBanner(null)}><Icon.X /></button>
        </div>
      )}

      <div className="db-stats">
        <div className="db-stat total">
          <span className="db-stat-icon"><Icon.BarChart /></span>
          <div className="db-stat-number">{stats.total}</div>
          <div className="db-stat-label">Total Alerts</div>
        </div>
        <div className="db-stat active">
          <span className="db-stat-icon"><Icon.Alert /></span>
          <div className="db-stat-number">{stats.active}</div>
          <div className="db-stat-label">Active</div>
        </div>
        <div className="db-stat acked">
          <span className="db-stat-icon"><Icon.Check /></span>
          <div className="db-stat-number">{stats.acked}</div>
          <div className="db-stat-label">Acknowledged</div>
        </div>
        <div className="db-stat reports">
          <span className="db-stat-icon"><Icon.Clipboard /></span>
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
                ? 'No alerts recorded. System is actively monitoring all nodes.'
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
                    <th>Resolution</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, i) => {
                    const needsReport = alert.acknowledged && (!alert.resolution_status || alert.resolution_status === 'Pending');
                    return (
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
                            ? <span className="db-status-acked"><Icon.CheckSmall /> Acknowledged</span>
                            : <span className="db-status-active"><Icon.Alert /> Active</span>}
                        </td>
                        <td><ResolutionBadge status={alert.resolution_status} /></td>
                        <td>
                          {!alert.acknowledged ? (
                            <button className="db-ack-btn" onClick={() => handleAcknowledge(alert._id)}>Acknowledge</button>
                          ) : needsReport ? (
                            <button className="db-report-btn" onClick={() => openReportPanel(alert)}>
                              <Icon.FileText /> File Report
                            </button>
                          ) : (
                            <button className="db-report-view-btn" onClick={() => openReportPanel(alert)}>
                              View Report
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
            <div className="db-empty">No witness reports submitted yet.</div>
          ) : (
            <div className="db-reports-list">
              {reports.map((r) => (
                <div key={r._id} className={`db-report-card ${r.reviewed ? 'reviewed' : ''}`}>
                  <div className="db-report-header">
                    <TypeBadge type={r.incident_type} />
                    <span className="db-report-location"><Icon.Pin /> {r.location_label}</span>
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
                          <Icon.Paperclip /> View Evidence
                        </a>
                      )}
                      <MapsLink coords={r.coordinates} />
                    </div>
                    {r.reviewed ? (
                      <span className="db-status-acked"><Icon.CheckSmall /> Reviewed</span>
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
        Smart Panic Alert System — Computer Engineering Final Year Project · Rivers State University · {new Date().getFullYear()}
      </footer>

      {/* SLIDE-IN INCIDENT REPORT PANEL */}
      {reportPanelAlert && (
        <>
          <div className="db-panel-overlay" onClick={closeReportPanel}></div>
          <div className="db-report-panel">
            <div className="db-panel-header">
              <div>
                <div className="db-panel-title">Incident Report</div>
                <div className="db-panel-sub">
                  <TypeBadge type={reportPanelAlert.alert_type} /> · {reportPanelAlert.device_id}
                </div>
              </div>
              <button className="db-panel-close" onClick={closeReportPanel}><Icon.X /></button>
            </div>

            <div className="db-panel-body">
              <div className="db-panel-field-static">
                <span className="db-panel-label">Location</span>
                <span>{reportPanelAlert.location_label}</span>
              </div>
              <div className="db-panel-field-static">
                <span className="db-panel-label">Alert Time</span>
                <span>{new Date(reportPanelAlert.server_received_at).toLocaleString()}</span>
              </div>

              {reportPanelAlert.resolution_status && reportPanelAlert.resolution_status !== 'Pending' ? (
                <div className="db-panel-filed">
                  <div className="db-panel-field-static">
                    <span className="db-panel-label">Status</span>
                    <ResolutionBadge status={reportPanelAlert.resolution_status} />
                  </div>
                  <div className="db-panel-field-static">
                    <span className="db-panel-label">Filed By</span>
                    <span>{reportPanelAlert.resolved_by}</span>
                  </div>
                  <div className="db-panel-field-static">
                    <span className="db-panel-label">Filed At</span>
                    <span>{new Date(reportPanelAlert.resolved_at).toLocaleString()}</span>
                  </div>
                  <div className="db-panel-notes-view">
                    <span className="db-panel-label">Notes</span>
                    <p>{reportPanelAlert.resolution_notes}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitResolution} className="db-panel-form">
                  <label className="db-panel-label">Resolution Status</label>
                  <select value={resStatus} onChange={(e) => setResStatus(e.target.value)} className="db-panel-select">
                    {RESOLUTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <label className="db-panel-label" style={{ marginTop: '14px' }}>Incident Notes</label>
                  <textarea
                    rows="6"
                    placeholder="Describe what happened, actions taken, and outcome..."
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    className="db-panel-textarea"
                    required
                  />

                  <button type="submit" className="db-panel-submit" disabled={resSubmitting}>
                    {resSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
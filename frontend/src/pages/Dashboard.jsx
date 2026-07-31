import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function playAlertSound(audioCtxRef) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    [0, 0.3, 0.6].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(t === 0.3 ? 660 : 880, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
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

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [activeBanner, setActiveBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const audioCtxRef = useRef(null);
  const seenIds = useRef(new Set());

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => !a.acknowledged).length,
    acked: alerts.filter((a) => a.acknowledged).length,
  };

  function handleWsMessage(data) {
    if (data.type === 'NEW_ALERT') {
      const incoming = data.alert;
      if (seenIds.current.has(incoming._id)) return;
      seenIds.current.add(incoming._id);
      setAlerts((prev) => [incoming, ...prev]);
      setActiveBanner(incoming);
      playAlertSound(audioCtxRef);
    }
    if (data.type === 'ALERT_ACKNOWLEDGED') {
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === data.alertId
            ? { ...a, acknowledged: true, acknowledged_at: data.acknowledged_at }
            : a
        )
      );
    }
  }

  const { connected } = useWebSocket(handleWsMessage);

  useEffect(() => {
    fetch(`${API_URL}/api/alerts`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAlerts(d.alerts);
          d.alerts.forEach((a) => seenIds.current.add(a._id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAcknowledge(id) {
    try {
      console.log('[ACK] Sending for ID:', id);
      const res = await fetch(`${API_URL}/api/alert/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const d = await res.json();
      console.log('[ACK] Response:', d);
      if (d.success) {
        setAlerts((prev) =>
          prev.map((a) =>
            a._id === id
              ? { ...a, acknowledged: true, acknowledged_at: d.alert.acknowledged_at }
              : a
          )
        );
      }
    } catch (e) {
      console.error('[ACK] Error:', e);
    }
  }

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
  <Link to="/" className="db-node-link">← Panic Node</Link>
  <button
    className="db-logout-btn"
    onClick={() => {
      sessionStorage.removeItem('rsu_security_auth');
      window.location.href = '/login';
    }}
  >
    Logout
  </button>
</div>
      </header>

      {activeBanner && (
        <div className="db-alert-banner">
          <div className="db-banner-inner">
            <span className="db-banner-siren">🚨</span>
            <div>
              <div className="db-banner-title">PANIC ALERT RECEIVED</div>
              <div className="db-banner-meta">
                <span className="db-banner-chip">{activeBanner.device_id}</span>
                📍 {activeBanner.location_label}
                &nbsp;·&nbsp;
                {new Date(activeBanner.server_received_at).toLocaleTimeString()}
                {activeBanner.coordinates?.latitude && (
                  <a href={`https://www.google.com/maps?q=${activeBanner.coordinates.latitude},${activeBanner.coordinates.longitude}`} target="_blank" rel="noopener noreferrer" className="db-banner-maps">
                    🗺 Open in Maps
                  </a>
                )}
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
      </div>

      <div className="db-section">
        <div className="db-section-header">
          <div className="db-section-title">Alert Event Log</div>
          <span className="db-count-badge">{alerts.length} events</span>
        </div>

        {loading ? (
          <div className="db-loading">Loading alert history...</div>
        ) : alerts.length === 0 ? (
          <div className="db-empty">🟢 No alerts recorded. System is actively monitoring all nodes.</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Device ID</th>
                  <th>Location</th>
                  <th>GPS Coordinates</th>
                  <th>Time Received</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, i) => (
                  <tr key={alert._id} className={alert.acknowledged ? 'row-acked' : 'row-active'}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>{i + 1}</td>
                    <td><span className="db-device-tag">{alert.device_id}</span></td>
                    <td style={{ maxWidth: '220px' }}>{alert.location_label}</td>
                    <td><MapsLink coords={alert.coordinates} /></td>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      {new Date(alert.server_received_at).toLocaleString()}
                    </td>
                    <td>
                      {alert.acknowledged
                        ? <span className="db-status-acked">✓ Acknowledged</span>
                        : <span className="db-status-active">⚠ Active</span>
                      }
                    </td>
                    <td>
                      {alert.acknowledged
                        ? <span className="db-ack-time">{new Date(alert.acknowledged_at).toLocaleTimeString()}</span>
                        : <button className="db-ack-btn" onClick={() => handleAcknowledge(alert._id)}>Acknowledge</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="db-footer">
        Smart Panic Alert System — Computer Engineering Final Year Project · Rivers State University · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
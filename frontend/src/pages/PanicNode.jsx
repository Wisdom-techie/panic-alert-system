import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './PanicNode.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEVICE_CATEGORIES = [
  {
    category: 'Hostels',
    devices: [
      { id: 'NODE-H01', label: 'Hostel A (New Hostel) — Main Entrance' },
      { id: 'NODE-H02', label: 'Hostel B — Ground Floor Corridor' },
      { id: 'NODE-H03', label: 'Hostel C — Stairwell Area' },
      { id: 'NODE-H04', label: 'Hostel D — Common Room' },
      { id: 'NODE-H05', label: 'Hostel E — Reception Lobby' },
      { id: 'NODE-H06', label: 'Hostel F — Main Block Corridor' },
      { id: 'NODE-H07', label: 'Hostel F Extension — Annex Block' },
      { id: 'NODE-H08', label: 'Hostel G — Ground Floor Hallway' },
      { id: 'NODE-H09', label: 'Hostel H — Block Entrance' },
      { id: 'NODE-H10', label: 'NDDC Hostel — Main Corridor' },
      { id: 'NODE-H11', label: 'FCMB Luxury Hostel — Reception Area' },
      { id: 'NODE-H12', label: 'Scholar Bay Hostel — Lobby' },
      { id: 'NODE-H13', label: 'Postgraduate Hostel — Obio-Akpor Block' },
      { id: 'NODE-H14', label: 'Postgraduate Female Medical Hostel — Entrance' },
      { id: 'NODE-H15', label: 'Hallow Chamber Hostel — Ground Floor' },
    ],
  },
  {
    category: 'Faculty of Engineering',
    devices: [
      { id: 'NODE-E01', label: "Faculty of Engineering — Dean's Office Corridor" },
      { id: 'NODE-E02', label: 'Faculty of Engineering — Computer Engineering Laboratory' },
      { id: 'NODE-E03', label: 'Faculty of Engineering — Electrical Engineering Laboratory' },
      { id: 'NODE-E04', label: 'Faculty of Engineering — Mechanical Engineering Workshop' },
      { id: 'NODE-E05', label: 'Faculty of Engineering — Chemical/Petrochemical Lab' },
      { id: 'NODE-E06', label: 'Faculty of Engineering — Lecture Hall 1' },
      { id: 'NODE-E07', label: 'Faculty of Engineering — Lecture Hall 2' },
      { id: 'NODE-E08', label: 'Faculty of Engineering — Marine Engineering Centre' },
    ],
  },
  {
    category: 'Academic Faculties',
    devices: [
      { id: 'NODE-A01', label: 'Faculty of Science — Main Lobby' },
      { id: 'NODE-A02', label: 'Faculty of Science — Physics Laboratory' },
      { id: 'NODE-A03', label: 'Faculty of Management Sciences — Ground Floor Corridor' },
      { id: 'NODE-A04', label: 'Faculty of Law — Moot Court Area' },
      { id: 'NODE-A05', label: 'Faculty of Law — Main Corridor' },
      { id: 'NODE-A06', label: 'Faculty of Environmental Sciences — Ground Floor' },
      { id: 'NODE-A07', label: 'Faculty of Agriculture — Main Block' },
      { id: 'NODE-A08', label: 'Faculty of Education — Lecture Wing' },
      { id: 'NODE-A09', label: 'Faculty of Humanities — Reading Room' },
      { id: 'NODE-A10', label: 'Faculty of Social Sciences — Main Lobby' },
      { id: 'NODE-A11', label: 'Faculty of Basic Medical Sciences — Laboratory Wing' },
      { id: 'NODE-A12', label: 'Faculty of Communication — Studio Corridor' },
    ],
  },
  {
    category: 'Administrative & Support',
    devices: [
      { id: 'NODE-S01', label: 'Administrative Block — Main Reception' },
      { id: 'NODE-S02', label: 'Administrative Block — Registrar Office Corridor' },
      { id: 'NODE-S03', label: 'Senate Building — Main Corridor' },
      { id: 'NODE-S04', label: 'Senate Building — Council Chambers Entrance' },
      { id: 'NODE-S05', label: "Vice Chancellor's Office — Waiting Area" },
      { id: 'NODE-S06', label: 'ICT Centre — Main Hall' },
      { id: 'NODE-S07', label: 'ICT Centre — Server Room Corridor' },
      { id: 'NODE-S08', label: 'Directorate of Student Affairs — Main Office' },
      { id: 'NODE-S09', label: 'University Library — Reading Hall' },
      { id: 'NODE-S10', label: 'University Library — Entrance Lobby' },
    ],
  },
  {
    category: 'Campus Facilities',
    devices: [
      { id: 'NODE-F01', label: 'RSU Main Gate — Security Post' },
      { id: 'NODE-F02', label: 'RSU Back Gate — Security Post' },
      { id: 'NODE-F03', label: 'Medical Centre — University Clinic Reception' },
      { id: 'NODE-F04', label: 'Medical Centre — Emergency Ward Entrance' },
      { id: 'NODE-F05', label: 'Students Union Government (SUG) Building' },
      { id: 'NODE-F06', label: 'Convocation Arena — Main Entrance' },
      { id: 'NODE-F07', label: 'University Sports Complex — Main Pitch Area' },
      { id: 'NODE-F08', label: "Students' Cafeteria — Dining Hall Entrance" },
      { id: 'NODE-F09', label: 'Campus Chapel — Entrance Corridor' },
      { id: 'NODE-F10', label: 'Postgraduate School — Admin Block' },
    ],
  },
];

const ALL_DEVICES = DEVICE_CATEGORIES.flatMap((c) => c.devices);

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
    );
  });
}

export default function PanicNode() {
  const [selectedDevice, setSelectedDevice] = useState(ALL_DEVICES[0]);
  const [status, setStatus] = useState('idle');
  const [lastSent, setLastSent] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [geoStatus, setGeoStatus] = useState('idle');
  const fetchedOnce = useRef(false);

  // Fetch recent alerts once on mount only
  if (!fetchedOnce.current) {
    fetchedOnce.current = true;
    fetch(`${API_URL}/api/alerts?limit=4`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setRecentAlerts(d.alerts); })
      .catch(() => {});
  }

  async function handlePanic() {
    if (status === 'sending') return;
    setStatus('sending');
    setGeoStatus('acquiring');

    const coords = await getLocation();
    setGeoStatus(coords ? 'acquired' : 'denied');

    try {
      const res = await fetch(`${API_URL}/api/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice.id,
          location_label: selectedDevice.label,
          timestamp_ms: Date.now(),
          coordinates: coords,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setLastSent(new Date().toLocaleTimeString());
        // refresh recent alerts after successful send
        fetch(`${API_URL}/api/alerts?limit=4`)
          .then((r) => r.json())
          .then((d) => { if (d.success) setRecentAlerts(d.alerts); })
          .catch(() => {});
        setTimeout(() => { setStatus('idle'); setGeoStatus('idle'); }, 3000);
      } else {
        setStatus('error');
        setTimeout(() => { setStatus('idle'); setGeoStatus('idle'); }, 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setGeoStatus('idle'); }, 3000);
    }
  }

  const btnMeta = {
    idle:    { icon: '🚨', label: 'PANIC',   sub: 'Press to trigger alert' },
    sending: { icon: '⏳', label: 'SENDING', sub: 'Acquiring location...' },
    success: { icon: '✅', label: 'SENT',    sub: 'Alert dispatched' },
    error:   { icon: '❌', label: 'FAILED',  sub: 'Tap to retry' },
  };

  return (
    <div className="pn-page">
      <header className="pn-header">
        <div className="pn-logo">
          <div className="pn-logo-icon">🛡</div>
          <div className="pn-logo-text">
            <h1>RSU Panic Alert System</h1>
            <p>Rivers State University — Campus Security Network</p>
          </div>
        </div>
        <div className="pn-header-right">
          <div className="pn-system-status">
            <span className="pn-status-dot"></span>
            System Online
          </div>
          <Link to="/dashboard" className="pn-dash-link">Security Dashboard →</Link>
        </div>
      </header>

      <main className="pn-main">
        <div className="pn-left">

          <div className="pn-card">
            <div className="pn-card-header">
              <div className="pn-card-title">Select Node Location</div>
              <div className="pn-card-sub">Choose the campus location this panic node represents</div>
            </div>

            <select
              className="pn-select"
              value={selectedDevice.id}
              onChange={(e) => {
                const d = ALL_DEVICES.find((x) => x.id === e.target.value);
                setSelectedDevice(d);
              }}
            >
              {DEVICE_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.devices.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="pn-info-grid">
              <div className="pn-info-item">
                <div className="pn-info-label">Device ID</div>
                <div className="pn-info-value mono">{selectedDevice.id}</div>
              </div>
              <div className="pn-info-item">
                <div className="pn-info-label">Network</div>
                <div className="pn-info-value online">
                  <span className="pn-online-dot"></span>RSU Wi-Fi
                </div>
              </div>
              <div className="pn-info-item" style={{ gridColumn: '1 / -1' }}>
                <div className="pn-info-label">Location Label</div>
                <div className="pn-info-value">{selectedDevice.label}</div>
              </div>
              <div className="pn-info-item">
                <div className="pn-info-label">GPS</div>
                <div className="pn-info-value">
                  {geoStatus === 'idle' && '— Standby'}
                  {geoStatus === 'acquiring' && '⏳ Acquiring...'}
                  {geoStatus === 'acquired' && <span className="online"><span className="pn-online-dot"></span>Acquired</span>}
                  {geoStatus === 'denied' && '⚠ Permission denied'}
                </div>
              </div>
              <div className="pn-info-item">
                <div className="pn-info-label">Status</div>
                <div className="pn-info-value online">
                  <span className="pn-online-dot"></span>Ready
                </div>
              </div>
            </div>

            {geoStatus === 'denied' && (
              <div className="pn-geo-warning">
                ⚠ Location access denied. Alert will be sent without GPS coordinates. Enable location in your browser settings for full tracking.
              </div>
            )}
          </div>

          <div className="pn-recent-card">
            <div className="pn-recent-title">Recent Alerts</div>
            {recentAlerts.length === 0 ? (
              <div className="pn-recent-empty">No alerts dispatched yet</div>
            ) : (
              recentAlerts.map((a) => (
                <div key={a._id} className="pn-recent-item">
                  <span className="pn-recent-dot"></span>
                  <div className="pn-recent-info">
                    <div className="pn-recent-id">{a.device_id}</div>
                    <div className="pn-recent-loc">{a.location_label}</div>
                    {a.coordinates && a.coordinates.latitude && (
                      <div className="pn-recent-coords">
                        📍 {a.coordinates.latitude.toFixed(5)}, {a.coordinates.longitude.toFixed(5)}
                      </div>
                    )}
                  </div>
                  <div className="pn-recent-time">
                    {new Date(a.server_received_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pn-how-card">
            <div className="pn-how-title">System Overview</div>
            <p className="pn-how-text">
              This interface simulates the physical ESP32 panic button hardware node deployed
              across RSU campus locations. When activated, the system acquires the device's
              GPS coordinates via the browser Geolocation API, then transmits a structured
              JSON payload containing the device ID, location label, GPS coordinates, and
              timestamp via HTTP POST to the Node.js backend. The server persists the event
              to MongoDB Atlas and pushes a real-time WebSocket notification to all connected
              security dashboard clients — achieving sub-2-second end-to-end alert delivery.
            </p>
          </div>

        </div>

        <div className="pn-right">
          <div className="pn-button-panel">
            <div className="pn-btn-status-text">
              {status === 'idle' && 'System armed — ready to transmit'}
              {status === 'sending' && 'Acquiring location and transmitting...'}
              {status === 'success' && 'Alert successfully dispatched'}
              {status === 'error' && 'Transmission failed — check connection'}
            </div>

            <button
              className={`pn-panic-btn ${status}`}
              onClick={handlePanic}
              disabled={status === 'sending'}
            >
              <span className="pn-btn-icon">{btnMeta[status].icon}</span>
              <span className="pn-btn-label">{btnMeta[status].label}</span>
              <span className="pn-btn-sub">{btnMeta[status].sub}</span>
            </button>

            {lastSent ? (
              <div className="pn-last-sent">✓ Last dispatched at {lastSent}</div>
            ) : (
              <div className="pn-last-sent-empty">No alerts sent this session</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
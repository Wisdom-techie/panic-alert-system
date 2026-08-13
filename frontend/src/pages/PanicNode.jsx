import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './PanicNode.css';


const Icon = {
  Robbery: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  ),
  Assault: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  Medical: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.5-1.5 3-3.5 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 10.5 3.5 12.5 5 14l7 7 7-7z" />
      <path d="M12 8v6M9 11h6" />
    </svg>
  ),
  Accident: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h1a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h1" />
      <path d="M3 17V9l3-5h9l4 5h2v8" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  Fire: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c2 2 3 4 3 6a5 5 0 0 1-10 0c0-3 2-5 2-8 0-2-1-3-1-3s2-1 4-2z" />
    </svg>
  ),
  Suspicious: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Check: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Loading: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" className="pn-spin" />
    </svg>
  ),
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

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

const EMERGENCY_TYPES = [
  { type: 'Robbery', Icon: Icon.Robbery, color: 'red', label: 'Robbery / Theft' },
  { type: 'Assault', Icon: Icon.Assault, color: 'orange', label: 'Physical Assault' },
  { type: 'Medical', Icon: Icon.Medical, color: 'blue', label: 'Medical Emergency' },
  { type: 'Accident', Icon: Icon.Accident, color: 'purple', label: 'Accident' },
  { type: 'Fire', Icon: Icon.Fire, color: 'amber', label: 'Fire Outbreak' },
  { type: 'Suspicious', Icon: Icon.Suspicious, color: 'dark', label: 'Suspicious Activity' },
];
const WITNESS_TYPES = [...EMERGENCY_TYPES.map(e => e.type), 'Other'];

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
  const [activeType, setActiveType] = useState(null); // which button is currently sending
  const [sentType, setSentType] = useState(null); // which button just succeeded
  const [errorType, setErrorType] = useState(null);
  const [lastSent, setLastSent] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [recentAlerts, setRecentAlerts] = useState([]);
  const fetchedOnce = useRef(false);

  // Witness report state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState(WITNESS_TYPES[0]);
  const [reportLocation, setReportLocation] = useState(ALL_DEVICES[0].label);
  const [reportDescription, setReportDescription] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [reportAnonymous, setReportAnonymous] = useState(false);
  const [reportContact, setReportContact] = useState('');
  const [reportStatus, setReportStatus] = useState('idle'); // idle | sending | success | error

  if (!fetchedOnce.current) {
    fetchedOnce.current = true;
    fetch(`${API_URL}/api/alerts?limit=4`, { headers: HEADERS })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRecentAlerts(d.alerts); })
      .catch(() => {});
  }

  async function handleEmergency(alertType) {
    if (activeType) return; // already sending something
    setActiveType(alertType);
    setErrorType(null);
    setGeoStatus('acquiring');

    const coords = await getLocation();
    setGeoStatus(coords ? 'acquired' : 'denied');

    try {
      const res = await fetch(`${API_URL}/api/alert`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          device_id: selectedDevice.id,
          location_label: selectedDevice.label,
          timestamp_ms: Date.now(),
          coordinates: coords,
          alert_type: alertType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentType(alertType);
        setLastSent(new Date().toLocaleTimeString());
        fetch(`${API_URL}/api/alerts?limit=4`, { headers: HEADERS })
          .then((r) => r.json())
          .then((d) => { if (d.success) setRecentAlerts(d.alerts); })
          .catch(() => {});
        setTimeout(() => { setActiveType(null); setSentType(null); setGeoStatus('idle'); }, 3000);
      } else {
        setErrorType(alertType);
        setTimeout(() => { setActiveType(null); setErrorType(null); setGeoStatus('idle'); }, 3000);
      }
    } catch {
      setErrorType(alertType);
      setTimeout(() => { setActiveType(null); setErrorType(null); setGeoStatus('idle'); }, 3000);
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setReportStatus('sending');

    const coords = await getLocation();

    try {
      const formData = new FormData();
      formData.append('incident_type', reportType);
      formData.append('location_label', reportLocation);
      formData.append('description', reportDescription);
      formData.append('anonymous', reportAnonymous);
      if (!reportAnonymous && reportContact.trim()) {
        formData.append('reporter_contact', reportContact.trim());
      }
      formData.append('coordinates', JSON.stringify(coords || {}));
      if (reportFile) formData.append('file', reportFile);

      const res = await fetch(`${API_URL}/api/witness-report`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReportStatus('success');
        setReportDescription('');
        setReportFile(null);
        setReportContact('');
        setReportAnonymous(false);
        setTimeout(() => {
          setReportStatus('idle');
          setShowReportForm(false);
        }, 2500);
      } else {
        setReportStatus('error');
        setTimeout(() => setReportStatus('idle'), 3000);
      }
    } catch {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  }

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
          <Link to="/login" className="pn-dash-link">Security Dashboard →</Link>
        </div>
      </header>

      <main className="pn-main-v2">

        {/* DEVICE SELECTOR */}
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
              <div className="pn-info-label">GPS</div>
              <div className="pn-info-value">
                {geoStatus === 'idle' && '— Standby'}
                {geoStatus === 'acquiring' && '⏳ Acquiring...'}
                {geoStatus === 'acquired' && <span className="online"><span className="pn-online-dot"></span>Acquired</span>}
                {geoStatus === 'denied' && '⚠ Permission denied'}
              </div>
            </div>
          </div>
        </div>

        {/* EMERGENCY BUTTON GRID */}
        <div className="pn-card">
          <div className="pn-card-header">
            <div className="pn-card-title">Select Emergency Type</div>
            <div className="pn-card-sub">Press the button matching the emergency you are experiencing</div>
          </div>

          <div className="pn-emergency-grid">
            {EMERGENCY_TYPES.map((e) => {
              const isActive = activeType === e.type;
              const isSent = sentType === e.type;
              const isError = errorType === e.type;
              const isDisabled = activeType && activeType !== e.type;

              let stateClass = '';
              if (isSent) stateClass = 'sent';
              else if (isError) stateClass = 'error';
              else if (isActive) stateClass = 'sending';

              return (
                <button
                  key={e.type}
                  className={`pn-emg-btn pn-emg-${e.color} ${stateClass} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleEmergency(e.type)}
                  disabled={!!activeType}
                >
                  <span className="pn-emg-icon">
  {isSent ? <Icon.Check /> : isError ? <Icon.X /> : isActive ? <Icon.Loading /> : <e.Icon />}
</span>
                  <span className="pn-emg-label">
                    {isSent ? 'SENT' : isError ? 'FAILED' : isActive ? 'SENDING' : e.label}
                  </span>
                </button>
              );
            })}
          </div>

          {lastSent ? (
            <div className="pn-last-sent">✓ Last alert dispatched at {lastSent}</div>
          ) : (
            <div className="pn-last-sent-empty">No alerts sent this session</div>
          )}
        </div>

        {/* RECENT ALERTS */}
        <div className="pn-recent-card">
          <div className="pn-recent-title">Recent Alerts</div>
          {recentAlerts.length === 0 ? (
            <div className="pn-recent-empty">No alerts dispatched yet</div>
          ) : (
            recentAlerts.map((a) => (
              <div key={a._id} className="pn-recent-item">
                <span className={`pn-recent-dot pn-dot-${(EMERGENCY_TYPES.find(e => e.type === a.alert_type) || {}).color || 'red'}`}></span>
                <div className="pn-recent-info">
                  <div className="pn-recent-id">{a.alert_type} — {a.device_id}</div>
                  <div className="pn-recent-loc">{a.location_label}</div>
                </div>
                <div className="pn-recent-time">
                  {new Date(a.server_received_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* WITNESS REPORT TOGGLE */}
        <div className="pn-witness-toggle-card">
          <div className="pn-witness-toggle-info">
            <div className="pn-card-title">Witness Report</div>
            <div className="pn-card-sub">Saw something concerning but it's not an active emergency? File a report here.</div>
          </div>
          <button className="pn-witness-toggle-btn" onClick={() => setShowReportForm(!showReportForm)}>
            {showReportForm ? 'Close Form' : 'Report Incident'}
          </button>
        </div>

        {showReportForm && (
          <div className="pn-card pn-report-form">
            <form onSubmit={handleReportSubmit}>
              <div className="pn-form-row">
                <div className="pn-form-field">
                  <label>Incident Type</label>
                  <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    {WITNESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="pn-form-field">
                  <label>Location</label>
                  <select value={reportLocation} onChange={(e) => setReportLocation(e.target.value)}>
                    {DEVICE_CATEGORIES.map((cat) => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.devices.map((d) => (
                          <option key={d.id} value={d.label}>{d.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pn-form-field">
                <label>Description</label>
                <textarea
                  rows="4"
                  placeholder="Describe what you witnessed..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  required
                />
              </div>

              <div className="pn-form-field">
                <label>Upload Evidence (photo or video, optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setReportFile(e.target.files[0])}
                />
              </div>

              <div className="pn-form-row">
                <div className="pn-form-checkbox">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={reportAnonymous}
                    onChange={(e) => setReportAnonymous(e.target.checked)}
                  />
                  <label htmlFor="anon">Submit anonymously</label>
                </div>
                {!reportAnonymous && (
                  <div className="pn-form-field" style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Your contact (optional)"
                      value={reportContact}
                      onChange={(e) => setReportContact(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="pn-report-submit" disabled={reportStatus === 'sending'}>
                {reportStatus === 'idle' && 'Submit Report'}
                {reportStatus === 'sending' && 'Submitting...'}
                {reportStatus === 'success' && '✓ Report Submitted'}
                {reportStatus === 'error' && 'Failed — Try Again'}
              </button>
            </form>
          </div>
        )}

        <div className="pn-how-card">
          <div className="pn-how-title">System Overview</div>
          <p className="pn-how-text">
            This interface simulates physical panic button hardware nodes deployed across RSU
            campus locations. Each colored button represents a distinct emergency category and
            transmits a structured alert with GPS coordinates via HTTP POST to the backend,
            which broadcasts a real-time WebSocket notification to the security dashboard.
            The witness report section allows non-urgent incident reporting with optional
            photo or video evidence upload via Cloudinary.
          </p>
        </div>

      </main>
    </div>
  );
}
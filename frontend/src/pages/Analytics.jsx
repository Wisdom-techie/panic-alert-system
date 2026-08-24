import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './Analytics.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const HEADERS = { 'ngrok-skip-browser-warning': 'true' };

const TYPE_COLORS = {
  Robbery: '#ef5350',
  Assault: '#ff9800',
  Medical: '#29b6f6',
  Accident: '#ab47bc',
  Fire: '#ffca28',
  Suspicious: '#78909c',
  Other: '#546e7a',
};

function formatSeconds(s) {
  if (s == null) return '—';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/analytics`, { headers: HEADERS })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="an-page">
        <div className="an-loading">Loading analytics...</div>
      </div>
    );
  }

  if (!data || (data.totalAlerts === 0 && data.totalReports === 0)) {
    return (
      <div className="an-page">
        <header className="an-header">
          <div className="an-logo">
            <div className="an-logo-icon">📊</div>
            <div>
              <h1>Insecurity Survey & Analytics</h1>
              <p>Rivers State University — Campus Security Intelligence</p>
            </div>
          </div>
          <Link to="/dashboard" className="an-back-link">← Back to Dashboard</Link>
        </header>
        <div className="an-empty">
          No data yet. Analytics will populate once alerts or witness reports are recorded.
        </div>
      </div>
    );
  }

  const locationData = data.alertsByLocation.map((d) => ({
    name: d._id.length > 22 ? d._id.slice(0, 22) + '...' : d._id,
    fullName: d._id,
    count: d.count,
  }));

  const typeData = data.alertsByType.map((d) => ({
    name: d._id,
    value: d.count,
  }));

  const reportTypeData = data.reportsByType.map((d) => ({
    name: d._id,
    value: d.count,
  }));

  const hourData = data.byHour;

  const topZones = [...data.alertsByLocation].slice(0, 5);

  const responseByTypeData = (data.avgResponseByType || []).map((d) => ({
    name: d.type,
    seconds: d.avgSeconds,
  }));

  return (
    <div className="an-page">
      <header className="an-header">
        <div className="an-logo">
          <div className="an-logo-icon">📊</div>
          <div>
            <h1>Insecurity Survey & Analytics</h1>
            <p>Rivers State University — Campus Security Intelligence</p>
          </div>
        </div>
        <Link to="/dashboard" className="an-back-link">← Back to Dashboard</Link>
      </header>

      <div className="an-summary-row">
        <div className="an-summary-card">
          <div className="an-summary-number">{data.totalAlerts}</div>
          <div className="an-summary-label">Total Emergency Alerts</div>
        </div>
        <div className="an-summary-card">
          <div className="an-summary-number">{data.totalReports}</div>
          <div className="an-summary-label">Total Witness Reports</div>
        </div>
        <div className="an-summary-card">
          <div className="an-summary-number">{data.alertsByLocation.length}</div>
          <div className="an-summary-label">Locations With Incidents</div>
        </div>
        <div className="an-summary-card">
          <div className="an-summary-number">{formatSeconds(data.avgResponseSeconds)}</div>
          <div className="an-summary-label">Avg. Response Time</div>
        </div>
      </div>

      <div className="an-grid">

        {/* Incidents by Location */}
        <div className="an-card an-card-wide">
          <div className="an-card-title">Incidents by Location (Top 10)</div>
          <div className="an-card-sub">Which campus locations generate the most emergency alerts</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={150} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111620', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#f0f6ff' }}
                formatter={(value, name, props) => [value, 'Incidents']}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Type */}
        <div className="an-card">
          <div className="an-card-title">Emergency Alerts by Type</div>
          <div className="an-card-sub">Distribution of alert categories</div>
          {typeData.length === 0 ? (
            <div className="an-no-data">No alert data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                  fontSize={11}
                >
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.name] || '#546e7a'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111620', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Witness Reports by Type */}
        <div className="an-card">
          <div className="an-card-title">Witness Reports by Type</div>
          <div className="an-card-sub">Distribution of reported incident categories</div>
          {reportTypeData.length === 0 ? (
            <div className="an-no-data">No report data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={reportTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                  fontSize={11}
                >
                  {reportTypeData.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.name] || '#546e7a'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111620', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Response Time by Alert Type */}
        <div className="an-card an-card-wide">
          <div className="an-card-title">Average Response Time by Alert Type</div>
          <div className="an-card-sub">Time between alert dispatch and operator acknowledgement</div>
          {responseByTypeData.length === 0 ? (
            <div className="an-no-data">No acknowledged alerts yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={responseByTypeData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  allowDecimals={false}
                  label={{ value: 'seconds', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111620', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [formatSeconds(value), 'Avg. Response']}
                />
                <Bar dataKey="seconds" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Incidents by Hour */}
        <div className="an-card an-card-wide">
          <div className="an-card-title">Incidents by Hour of Day</div>
          <div className="an-card-sub">Combined alerts and witness reports across a 24-hour cycle</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={1} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111620', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#ef5350" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 High-Risk Zones */}
        <div className="an-card an-card-wide">
          <div className="an-card-title">Top 5 High-Risk Zones</div>
          <div className="an-card-sub">Ranked by total number of emergency alerts recorded</div>
          {topZones.length === 0 ? (
            <div className="an-no-data">No zone data yet</div>
          ) : (
            <div className="an-zone-list">
              {topZones.map((z, i) => (
                <div key={z._id} className="an-zone-item">
                  <span className="an-zone-rank">#{i + 1}</span>
                  <span className="an-zone-name">{z._id}</span>
                  <div className="an-zone-bar-wrap">
                    <div
                      className="an-zone-bar"
                      style={{ width: `${(z.count / topZones[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="an-zone-count">{z.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <footer className="an-footer">
        Data reflects all recorded alerts and witness reports · Refreshes on page load
      </footer>
    </div>
  );
}
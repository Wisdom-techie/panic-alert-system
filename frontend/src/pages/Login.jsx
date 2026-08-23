import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveAuth } from '../utils/auth';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        saveAuth(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🛡</div>
          <div>
            <h1>Security Dashboard</h1>
            <p>Authorized Personnel Only</p>
          </div>
        </div>

        <div className="login-divider"></div>

        <div className="login-alert-info">
          🔒 This dashboard is restricted to licensed RSU security operators.
          Unauthorized access is prohibited.
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">⚠ {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Access Dashboard'}
          </button>
        </form>

        <Link to="/" className="login-panic-node-btn">
          ← Back to Panic Node
        </Link>

        <div className="login-footer">
          Smart Panic Alert System · Rivers State University · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
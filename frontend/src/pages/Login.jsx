import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const CREDENTIALS = {
  username: 'rsu-security',
  password: 'rsu@panic2026',
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (
        username.trim() === CREDENTIALS.username &&
        password === CREDENTIALS.password
      ) {
        sessionStorage.setItem('rsu_security_auth', 'true');
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Access denied.');
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🛡</span>
          <div>
            <h1>RSU Security Portal</h1>
            <p>Authorized Personnel Only</p>
          </div>
        </div>

        <div className="login-divider"></div>

        <div className="login-alert-info">
          <span>🔒</span>
          <span>This dashboard is restricted to licensed RSU security operators. Unauthorized access is prohibited.</span>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="login-footer">
          Smart Panic Alert System · Rivers State University · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}  
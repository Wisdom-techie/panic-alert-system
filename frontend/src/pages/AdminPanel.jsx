import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authHeaders, isMaster, getUser, clearAuth } from '../utils/auth';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users`, {
        headers: { ...authHeaders(), 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          full_name: newFullName.trim(),
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setNewRole('staff');
        setShowForm(false);
        fetchUsers();
      } else {
        setFormError(data.message || 'Failed to create account');
      }
    } catch (e) {
      setFormError('Connection error');
    }
    setSubmitting(false);
  }

  async function handleToggleActive(id) {
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id, username) {
    if (!window.confirm(`Delete account "${username}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else alert(data.message);
    } catch (e) { console.error(e); }
  }

  if (!isMaster()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Staff Account Management</h1>
          <p>Master Account — {currentUser?.full_name}</p>
        </div>
        <div className="admin-header-right">
          <Link to="/dashboard" className="admin-back-link">← Back to Dashboard</Link>
          <button
            className="admin-logout-btn"
            onClick={() => { clearAuth(); window.location.href = '/login'; }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-toolbar">
          <div className="admin-count">{users.length} accounts</div>
          <button className="admin-add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Staff Account'}
          </button>
        </div>

        {showForm && (
          <form className="admin-form" onSubmit={handleCreateUser}>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label>Full Name</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} required />
              </div>
              <div className="admin-form-field">
                <label>Username</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label>Password</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="admin-form-field">
                <label>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="master">Master</option>
                </select>
              </div>
            </div>
            {formError && <div className="admin-form-error">{formError}</div>}
            <button type="submit" className="admin-form-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="admin-loading">Loading accounts...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Seen</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.full_name}</td>
                    <td className="admin-mono">{u.username}</td>
                    <td>
                      <span className={`admin-role-badge ${u.role === 'master' ? 'master' : 'staff'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${u.active ? 'active' : 'inactive'}`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="admin-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="admin-mono">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="admin-actions">
                      <button className="admin-toggle-btn" onClick={() => handleToggleActive(u._id)}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.role !== 'master' && (
                        <button className="admin-delete-btn" onClick={() => handleDelete(u._id, u.username)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
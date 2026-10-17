const USER_KEY = 'rsu_auth_user';

// Token is now in an HttpOnly cookie set by the server — not accessible from JS.
// We only store the user object in sessionStorage for UI display purposes.

export function saveAuth(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  sessionStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  // We infer login state from whether we have a stored user object.
  // The real auth check is on the server via the HttpOnly cookie.
  return !!getUser();
}

export function isMaster() {
  const user = getUser();
  return user?.role === 'master';
}

// authHeaders is no longer needed — the browser sends the HttpOnly cookie automatically.
// Kept as a no-op export so existing imports don't break.
export function authHeaders() {
  return {};
}
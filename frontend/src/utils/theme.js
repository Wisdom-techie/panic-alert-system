export function getStoredTheme() {
  return localStorage.getItem('rsu_theme') || 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('rsu_theme', theme);
}

export function toggleTheme() {
  const current = getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
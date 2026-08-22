import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PanicNode from './pages/PanicNode'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './theme.css';
import './index.css'
import { getStoredTheme, applyTheme } from './utils/theme';
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PanicNode />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('Service Worker registered:', reg.scope),
      (err) => console.log('Service Worker registration failed:', err)
    );
  });
}
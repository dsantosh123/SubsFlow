import { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ApiLog from './components/ApiLog';
import ToastNotification from './components/ToastNotification';
import { getStoredTenant, clearStoredAuth } from './api';
import './App.css';

export default function App() {
  const [tenant, setTenant] = useState(() => getStoredTenant());
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addLog = useCallback((entry) => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        ...entry,
      },
      ...prev,
    ].slice(0, 100)); // keep last 100
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setTenant(null);
    setLogs([]);
    showToast('info', 'Signed Out', 'Session cleared successfully.');
  };

  return (
    <div className="app">
      {/* Toast Notification Layer */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="app-header glass-panel">
        <div className="app-header-left">
          <div className="logo-badge">
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="url(#header-logo-grad)" />
              <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              <circle cx="16" cy="22" r="2" fill="white" />
              <defs>
                <linearGradient id="header-logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#4f46e5" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="title-row">
              <h1 className="app-title">SubsFlow</h1>
              <span className="app-version-pill">v1.0-PRO</span>
              <span className="jwt-badge">JWT SECURED</span>
            </div>
            <p className="app-subtitle">Transactional Outbox & Multi-Tenant SaaS Billing Engine</p>
          </div>
        </div>

        {tenant && (
          <div className="app-header-right">
            <div className="tenant-status-pill">
              <span className="tenant-status-dot" />
              <span className="tenant-name-text">{tenant.name}</span>
              <span className="tenant-api-hint code-font">{tenant.apiKey}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main App Content */}
      <main className="app-main">
        {!tenant ? (
          <LoginScreen
            onLogin={(t) => {
              setTenant(t);
              showToast('success', 'Authentication Successful', `JWT Token issued for ${t.name}!`);
            }}
            addLog={addLog}
          />
        ) : (
          <>
            <Dashboard
              tenant={tenant}
              addLog={addLog}
              onTriggerToast={showToast}
            />
            <ApiLog
              logs={logs}
              onClear={() => {
                setLogs([]);
                showToast('info', 'Logs Cleared', 'Telemetry log reset.');
              }}
              onTriggerToast={showToast}
            />
          </>
        )}
      </main>
    </div>
  );
}

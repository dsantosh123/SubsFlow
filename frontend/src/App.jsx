import { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ApiLog from './components/ApiLog';
import './App.css';

export default function App() {
  const [tenant, setTenant] = useState(null);
  const [logs, setLogs] = useState([]);

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

  const handleLogout = () => {
    setTenant(null);
    setLogs([]);
  };

  return (
    <div className="app">
      {/* Ambient glow orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />
      <div className="ambient-orb orb-3" />

      <header className="app-header">
        <div className="app-header-left">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <circle cx="16" cy="22" r="2" fill="white" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="app-title">SubsFlow</h1>
            <p className="app-subtitle">Subscription Management Dashboard</p>
          </div>
        </div>
        {tenant && (
          <div className="app-header-right">
            <div className="tenant-badge">
              <span className="tenant-dot" />
              <span>{tenant.name}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {!tenant ? (
          <LoginScreen onLogin={setTenant} addLog={addLog} />
        ) : (
          <>
            <Dashboard tenant={tenant} addLog={addLog} />
            <ApiLog logs={logs} onClear={() => setLogs([])} />
          </>
        )}
      </main>
    </div>
  );
}

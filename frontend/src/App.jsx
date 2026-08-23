import { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ApiLog from './components/ApiLog';
import ToastNotification from './components/ToastNotification';
import PortalLayout from './components/layout/PortalLayout';
import SpatialCanvas3D from './components/3d/SpatialCanvas3D';
import AdminLoginScreen from './components/admin/AdminLoginScreen';
import { usePortal } from './context/PortalContext';
import { getStoredTenant, clearStoredAuth } from './api';
import { clearStoredAdminAuth } from './adminApi';
import './App.css';

export default function App() {
  const [tenant, setTenant] = useState(() => getStoredTenant());
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const { setTenantSession, clearSession, activePortal, adminSession, setAdminSession, clearAdminSession } = usePortal();

  // Sync tenant state with portal context
  useEffect(() => {
    if (tenant) {
      setTenantSession({
        tenantId: tenant.id,
        name: tenant.name,
        apiKey: tenant.apiKey,
        token: tenant.token,
      });
    }
  }, [tenant, setTenantSession]);

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
    if (activePortal === 'SUPER_ADMIN') {
      clearStoredAdminAuth();
      clearAdminSession();
      showToast('info', 'Signed Out', 'Ops session terminated.');
    } else {
      clearStoredAuth();
      clearSession();
      setTenant(null);
      setLogs([]);
      showToast('info', 'Signed Out', 'Session cleared successfully.');
    }
  };

  const showAdminLogin = activePortal === 'SUPER_ADMIN' && !adminSession;
  const showTenantLogin = activePortal !== 'SUPER_ADMIN' && !tenant;

  return (
    <div className="app">
      {/* Toast Notification Layer */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {showAdminLogin ? (
        /* ── Unauthenticated Admin: Login with 3D Background ── */
        <div className="relative min-h-screen">
          <SpatialCanvas3D />
          <main className="relative z-10 app-main">
            <AdminLoginScreen
              onLogin={(adminData) => {
                setAdminSession(adminData);
                showToast('success', 'Operations Authentication Success', 'Access granted to Ops console.');
              }}
              addLog={addLog}
            />
          </main>
        </div>
      ) : showTenantLogin ? (
        /* ── Unauthenticated Tenant: Login with 3D Background ── */
        <div className="relative min-h-screen">
          <SpatialCanvas3D />
          <main className="relative z-10 app-main">
            <LoginScreen
              onLogin={(t) => {
                setTenant(t);
                showToast('success', 'Authentication Successful', `JWT Token issued for ${t.name}!`);
              }}
              addLog={addLog}
            />
          </main>
        </div>
      ) : (
        /* ── Authenticated: Full Portal Layout ── */
        <PortalLayout
          tenant={tenant}
          onLogout={handleLogout}
          addLog={addLog}
          showToast={showToast}
        >
          {/* Merchant portal content: existing Dashboard + ApiLog */}
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
        </PortalLayout>
      )}
    </div>
  );
}

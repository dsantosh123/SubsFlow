import React, { useState, useCallback, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import TenantLoginScreen from './components/tenant/TenantLoginScreen';
import TenantRegisterScreen from './components/tenant/TenantRegisterScreen';
import AdminLoginScreen from './components/admin/AdminLoginScreen';
import AdminLayout from './components/admin/AdminLayout';
import ToastNotification from './components/ToastNotification';
import { getStoredUser, clearStoredUserAuth } from './tenantAuthApi';
import { getStoredAdmin, clearStoredAdminAuth } from './adminApi';
import { Zap, Shield, ArrowLeft, LogOut } from 'lucide-react';
import './App.css';

export default function App() {
  const getViewFromPath = () => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/app' || path === '/dashboard') return 'dashboard';
    if (path === '/login') return 'auth_login';
    if (path === '/register') return 'auth_register';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState(getViewFromPath);
  const [toasts, setToasts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tenantUser, setTenantUser] = useState(() => getStoredUser());
  const [adminSession, setAdminSession] = useState(() => getStoredAdmin());

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view, path = '/') => {
    setCurrentView(view);
    window.history.pushState(null, '', path);
  };

  const showToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addLog = useCallback((entry) => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        ...entry,
      },
      ...prev,
    ].slice(0, 100));
  }, []);

  const handleAuthSuccess = (userData) => {
    setTenantUser(userData);
    showToast('success', 'Welcome!', `Signed in as ${userData.name} (${userData.role})`);
    navigateTo('dashboard', '/app');
  };

  const handleAdminLoginSuccess = (adminData) => {
    setAdminSession(adminData);
    showToast('success', 'Platform Ops Access Granted', `Welcome ${adminData.name || 'System Admin'}!`);
  };

  const handleAdminLogout = () => {
    clearStoredAdminAuth();
    setAdminSession(null);
    showToast('info', 'Admin Signed Out', 'Platform Ops session terminated.');
    navigateTo('admin', '/admin');
  };

  const handleTenantLogout = () => {
    clearStoredUserAuth();
    setTenantUser(null);
    showToast('info', 'Signed Out', 'You have been signed out.');
    navigateTo('landing', '/');
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Toast Layer */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* ── LANDING VIEW ── */}
      {currentView === 'landing' && (
        <LandingPage
          onNavigateToApp={() => navigateTo('dashboard', '/app')}
          onNavigateToAuth={(mode) => navigateTo(mode === 'register' ? 'auth_register' : 'auth_login', mode === 'register' ? '/register' : '/login')}
          onNavigateToAdmin={() => navigateTo('admin', '/admin')}
        />
      )}

      {/* ── MULTI-TENANT WORKSPACE DASHBOARD VIEW ── */}
      {currentView === 'dashboard' && (
        <DashboardLayout
          onBackToLanding={() => navigateTo('landing', '/')}
          onOpenPricing={() => navigateTo('landing', '/')}
          onTriggerToast={showToast}
        />
      )}

      {/* ── TENANT AUTH LOGIN ── */}
      {currentView === 'auth_login' && (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 relative">
          <button
            onClick={() => navigateTo('landing', '/')}
            className="absolute top-6 left-6 text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Home
          </button>
          <TenantLoginScreen
            onLogin={handleAuthSuccess}
            onSwitchToRegister={() => navigateTo('auth_register', '/register')}
            addLog={addLog}
          />
        </div>
      )}

      {/* ── TENANT AUTH REGISTER ── */}
      {currentView === 'auth_register' && (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 relative">
          <button
            onClick={() => navigateTo('landing', '/')}
            className="absolute top-6 left-6 text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Home
          </button>
          <TenantRegisterScreen
            onRegisterSuccess={handleAuthSuccess}
            onSwitchToLogin={() => navigateTo('auth_login', '/login')}
            addLog={addLog}
          />
        </div>
      )}

      {/* ── ADMIN PLATFORM OPS CONSOLE (/admin) ── */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          {/* Admin Header HUD */}
          <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow-xs">
                <Shield size={16} />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight">SubsFlow Platform Ops</span>
                <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  ROOT ADMIN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('landing', '/')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Exit to Landing</span>
              </button>

              {adminSession && (
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer font-semibold"
                >
                  <LogOut size={13} />
                  <span>Logout Admin</span>
                </button>
              )}
            </div>
          </header>

          {/* Admin Content */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {!adminSession ? (
              <AdminLoginScreen
                onLogin={handleAdminLoginSuccess}
                addLog={addLog}
              />
            ) : (
              <AdminLayout
                admin={adminSession}
                onLogout={handleAdminLogout}
                addLog={addLog}
                onTriggerToast={showToast}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

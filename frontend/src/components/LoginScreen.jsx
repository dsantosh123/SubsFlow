import { useState } from 'react';
import { onboardTenant, loginTenant } from '../api';
import './LoginScreen.css';

export default function LoginScreen({ onLogin, addLog }) {
  const [mode, setMode] = useState('login'); // 'login' | 'onboard'
  const [apiKey, setApiKey] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');

    const res = await loginTenant(apiKey.trim());
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      onLogin(res.data);
    } else {
      setError(res.data?.error || 'Login failed. Please verify API key.');
    }
    setLoading(false);
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!tenantName.trim()) return;
    setLoading(true);
    setError('');

    const res = await onboardTenant(tenantName.trim());
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      setApiKey(res.data.apiKey);
      onLogin(res.data);
    } else {
      setError(res.data?.error || 'Onboarding failed.');
    }
    setLoading(false);
  };

  const selectQuickKey = (key) => {
    setApiKey(key);
    setError('');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel">
        <div className="login-logo-badge">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#logo-grad-login)" />
            <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <circle cx="16" cy="22" r="2" fill="white" />
            <defs>
              <linearGradient id="logo-grad-login" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#4f46e5" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="login-title">SubsFlow SaaS Billing</h2>
        <p className="login-desc">Enterprise Multi-Tenant Subscription & Transactional Outbox Platform</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In with API Key
          </button>
          <button
            className={`login-tab ${mode === 'onboard' ? 'active' : ''}`}
            onClick={() => { setMode('onboard'); setError(''); }}
          >
            Create New Tenant
          </button>
        </div>

        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="api-key">Tenant API Key</label>
              <input
                id="api-key"
                className="input-field code-font"
                type="text"
                placeholder="sk_test_1"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
              />
            </div>

            <div className="quick-tenants-box">
              <span className="quick-title">Quick Demo Tenants:</span>
              <div className="quick-chips">
                <button
                  type="button"
                  className={`chip ${apiKey === 'sk_test_1' ? 'chip-active' : ''}`}
                  onClick={() => selectQuickKey('sk_test_1')}
                >
                  🏢 Acme Corp (sk_test_1)
                </button>
                <button
                  type="button"
                  className={`chip ${apiKey === 'sk_test_2' ? 'chip-active' : ''}`}
                  onClick={() => selectQuickKey('sk_test_2')}
                >
                  🌐 Globex Inc (sk_test_2)
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="btn btn-primary btn-full" type="submit" disabled={loading || !apiKey.trim()}>
              {loading ? 'Authenticating…' : 'Access Tenant Dashboard'}
            </button>
          </form>
        )}

        {mode === 'onboard' && (
          <form className="login-form" onSubmit={handleOnboard}>
            <div className="input-group">
              <label htmlFor="tenant-name">Organization / Company Name</label>
              <input
                id="tenant-name"
                className="input-field"
                type="text"
                placeholder="e.g. Apex Dynamics Ltd"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading || !tenantName.trim()}>
              {loading ? 'Provisioning Tenant…' : 'Provision & Generate Keys'}
            </button>
          </form>
        )}

        <div className="login-features-list">
          <div className="feature-item">✓ Optimistic Locking (@Version)</div>
          <div className="feature-item">✓ SKIP LOCKED Outbox Relay</div>
          <div className="feature-item">✓ Resilience4j Circuit Breaker</div>
        </div>
      </div>
    </div>
  );
}

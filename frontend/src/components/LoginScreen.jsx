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
    e.preventDefault();
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
      setError(res.data?.error || 'Login failed');
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
      // Show the API key before logging them in
      setMode('onboarded');
      setApiKey(res.data.apiKey);
      onLogin(res.data);
    } else {
      setError(res.data?.error || 'Onboarding failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-container animate-in">
      <div className="login-card glass">
        <div className="login-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#login-grad)" />
            <path d="M16 24C16 19.5817 19.5817 16 24 16C28.4183 16 32 19.5817 32 24" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M16 30C16 25.5817 19.5817 22 24 22C28.4183 22 32 25.5817 32 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            <circle cx="24" cy="33" r="2.5" fill="white" />
            <defs>
              <linearGradient id="login-grad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="login-title">Welcome to SubsFlow</h2>
        <p className="login-desc">Sign in with your API key or create a new tenant account.</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${mode === 'onboard' ? 'active' : ''}`}
            onClick={() => { setMode('onboard'); setError(''); }}
          >
            Create Tenant
          </button>
        </div>

        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="api-key">API Key</label>
              <input
                id="api-key"
                className="input-field"
                type="text"
                placeholder="sk_test_1 or your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading || !apiKey.trim()}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'onboard' && (
          <form className="login-form" onSubmit={handleOnboard}>
            <div className="input-group">
              <label htmlFor="tenant-name">Tenant Name</label>
              <input
                id="tenant-name"
                className="input-field"
                type="text"
                placeholder="e.g. Acme Corp"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading || !tenantName.trim()}>
              {loading ? 'Creating…' : 'Create Tenant'}
            </button>
          </form>
        )}

        <div className="login-hint">
          <p>Test credentials: <code>sk_test_1</code> (Acme Corp) · <code>sk_test_2</code> (Globex Inc)</p>
        </div>
      </div>
    </div>
  );
}

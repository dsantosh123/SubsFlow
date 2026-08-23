import { useState } from 'react';
import { adminLogin } from '../../adminApi';
import './AdminLoginScreen.css';

export default function AdminLoginScreen({ onLogin, addLog }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    const res = await adminLogin(email.trim(), password);
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
      setError(res.data?.error || 'Login failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const selectQuickAdmin = () => {
    setEmail('admin@subsflow.com');
    setPassword('SubsFlow_Dev_2026!');
    setError('');
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card glass-panel">
        <div className="admin-login-logo-badge">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#logo-grad-admin)" />
            <path d="M9 16C9 12.134 12.134 9 16 9C19.866 9 23 12.134 23 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 13L16 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="2.5" fill="white" />
            <defs>
              <linearGradient id="logo-grad-admin" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#f43f5e" />
                <stop offset="1" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="admin-login-title">Platform Ops Console</h2>
        <p className="admin-login-desc">Internal SubsFlow Administrator Dashboard</p>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              className="input-field"
              type="email"
              placeholder="admin@subsflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="admin-quick-box">
            <span className="admin-quick-title">Quick Demo Admin:</span>
            <div className="admin-quick-chips">
              <button
                type="button"
                className={`admin-chip ${email === 'admin@subsflow.com' ? 'admin-chip-active' : ''}`}
                onClick={selectQuickAdmin}
              >
                🛡️ System Admin (Dev Seed)
              </button>
            </div>
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <button className="btn btn-rose btn-full" type="submit" disabled={loading || !email.trim() || !password.trim()}>
            {loading ? 'Authenticating…' : 'Access Control Room'}
          </button>
        </form>

        <div className="admin-login-features-list">
          <div className="admin-feature-item">✓ Platform Wide Audit</div>
          <div className="admin-feature-item">✓ Multi-Tenant Isolation</div>
        </div>
      </div>
    </div>
  );
}

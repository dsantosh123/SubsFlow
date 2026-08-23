import { useState } from 'react';
import { loginTenantUser } from '../../tenantAuthApi';
import '../LoginScreen.css';

export default function TenantLoginScreen({ onLogin, onSwitchToRegister, addLog }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    const res = await loginTenantUser(email.trim(), password);
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
      setError(res.data?.error || 'Login failed. Please verify email and password.');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel">
        <div className="login-logo-badge">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#logo-grad-tenant)" />
            <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <circle cx="16" cy="22" r="2" fill="white" />
            <defs>
              <linearGradient id="logo-grad-tenant" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="login-title">SubsFlow Tenant Portal</h2>
        <p className="login-desc">Sign in to your team workspace with your credentials</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="tenant-email">Email Address</label>
            <input
              id="tenant-email"
              className="input-field"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="tenant-password">Password</label>
            <input
              id="tenant-password"
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px' }}>
            New to SubsFlow?
          </p>
          <button
            onClick={onSwitchToRegister}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#60a5fa',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            }}
          >
            Create Tenant Account →
          </button>
        </div>

        <div className="login-features-list">
          <div className="feature-item">✓ Email + Password Auth</div>
          <div className="feature-item">✓ Team Management</div>
          <div className="feature-item">✓ Role-Based Access</div>
        </div>
      </div>
    </div>
  );
}

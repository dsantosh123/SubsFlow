import { useState } from 'react';
import { registerTenantUser } from '../../tenantAuthApi';
import '../LoginScreen.css';

export default function TenantRegisterScreen({ onRegisterSuccess, onSwitchToLogin, addLog }) {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    const res = await registerTenantUser(companyName.trim(), ownerName.trim(), email.trim(), password);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      onRegisterSuccess(res.data);
    } else {
      setError(res.data?.error || 'Registration failed. Please check inputs.');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel" style={{ maxWidth: '520px' }}>
        <div className="login-logo-badge">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#logo-grad-register)" />
            <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <circle cx="16" cy="22" r="2" fill="white" />
            <defs>
              <linearGradient id="logo-grad-register" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#10b981" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="login-title">Create Tenant Account</h2>
        <p className="login-desc">Provision a new workspace for your SaaS company and create an Owner account</p>

        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="reg-company">Company / Organization Name</label>
            <input
              id="reg-company"
              className="input-field"
              type="text"
              placeholder="e.g. Apex Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-owner">Owner Full Name</label>
            <input
              id="reg-owner"
              className="input-field"
              type="text"
              placeholder="e.g. Jane Doe"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              className="input-field"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input-field"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Initializing Workspace…' : 'Register & Create Workspace'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Already have a workspace?{' '}
            <button
              onClick={onSwitchToLogin}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.82rem',
                textDecoration: 'underline',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

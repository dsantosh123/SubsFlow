import './SubscriptionsPanel.css';

function statusBadge(status) {
  const map = {
    ACTIVE: 'badge-active',
    TRIALING: 'badge-trial',
    PAST_DUE: 'badge-past-due',
    SUSPENDED: 'badge-suspended',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function SubscriptionsPanel({ subscriptions, loading, onRefresh, onCancel }) {
  return (
    <div className="panel glass-panel animate-fade-in">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">💳</div>
          <div>
            <h2 className="section-title">Active Subscriptions</h2>
            <p className="panel-subtitle">Current subscription contracts with optimistic lock versioning.</p>
          </div>
        </div>
        <button className="btn-refresh" onClick={onRefresh} title="Refresh subscriptions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : subscriptions.length === 0 ? (
        <div className="panel-empty">
          <span className="empty-emoji">📄</span>
          <p>No active subscriptions found for this tenant.</p>
          <span className="empty-hint">Select a plan on the left to subscribe.</span>
        </div>
      ) : (
        <div className="subs-list">
          {subscriptions.map((sub) => {
            const plan = sub.plan || {};
            const isCancelled = sub.status === 'CANCELLED';

            return (
              <div key={sub.id} className="sub-card">
                <div className="sub-card-top">
                  <div>
                    <div className="sub-header-line">
                      <h3 className="sub-plan-name">{plan.name || 'Custom Plan'}</h3>
                      <span className={`badge ${statusBadge(sub.status)}`}>{sub.status}</span>
                    </div>
                    <span className="sub-id code-font">ID: {sub.id}</span>
                  </div>
                  <div className="sub-price">
                    <span className="sub-amount">${parseFloat(plan.price || 0).toLocaleString()}</span>
                    <span className="sub-interval">/{plan.billingPeriod === 'YEARLY' ? 'yr' : 'mo'}</span>
                  </div>
                </div>

                <div className="sub-dates-grid">
                  <div className="date-block">
                    <span className="date-label">Period Start</span>
                    <span className="date-value">{formatDate(sub.currentPeriodStart)}</span>
                  </div>
                  <div className="date-block">
                    <span className="date-label">Renewal / End</span>
                    <span className="date-value">{formatDate(sub.currentPeriodEnd)}</span>
                  </div>
                  <div className="date-block">
                    <span className="date-label">Lock Version</span>
                    <span className="date-value code-font">v{sub.version ?? 0}</span>
                  </div>
                </div>

                {!isCancelled && onCancel && (
                  <div className="sub-card-actions">
                    <button
                      className="btn btn-sm btn-danger-outline"
                      onClick={() => onCancel(sub.id)}
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

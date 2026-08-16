import './SubscriptionsPanel.css';

function statusBadgeClass(status) {
  const map = {
    ACTIVE: 'badge-active',
    TRIAL: 'badge-trial',
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
    <div className="panel glass">
      <div className="section-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
          Subscriptions
        </h2>
        <button className="btn-refresh" onClick={onRefresh}>
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
          <p>No subscriptions found for this tenant</p>
        </div>
      ) : (
        <div className="subs-list">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="sub-card">
              <div className="sub-card-top">
                <div>
                  <h3 className="sub-plan-name">{sub.planName || 'Unknown Plan'}</h3>
                  <span className="sub-id">ID: {sub.id}</span>
                </div>
                <div className="sub-card-actions">
                  <span className={`badge ${statusBadgeClass(sub.status)}`}>{sub.status}</span>
                  {sub.status !== 'CANCELLED' && onCancel && (
                    <button className="btn-logout btn-cancel-sub" onClick={() => onCancel(sub.id)} title="Cancel Subscription">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <div className="sub-period">
                <div className="sub-period-item">
                  <span className="sub-period-label">Period Start</span>
                  <span className="sub-period-value">{formatDate(sub.currentPeriodStart)}</span>
                </div>
                <div className="sub-period-divider" />
                <div className="sub-period-item">
                  <span className="sub-period-label">Period End</span>
                  <span className="sub-period-value">{formatDate(sub.currentPeriodEnd)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

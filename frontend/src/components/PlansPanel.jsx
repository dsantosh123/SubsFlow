import './PlansPanel.css';

function typeBadge(billingType) {
  const map = {
    FIXED: 'badge-fixed',
    USAGE_BASED: 'badge-usage',
    TIERED: 'badge-tiered',
  };
  return map[billingType] || '';
}

function periodBadge(period) {
  return period === 'YEARLY' ? 'badge-yearly' : 'badge-monthly';
}

export default function PlansPanel({ plans, loading, onRefresh }) {
  return (
    <div className="panel glass">
      <div className="section-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          Billing Plans
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
      ) : plans.length === 0 ? (
        <div className="panel-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
          <p>No billing plans found</p>
        </div>
      ) : (
        <div className="plans-list">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-card-top">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-badges">
                  <span className={`badge ${typeBadge(plan.billingType)}`}>{plan.billingType.replace('_', ' ')}</span>
                  <span className={`badge ${periodBadge(plan.billingPeriod)}`}>{plan.billingPeriod}</span>
                </div>
              </div>
              <div className="plan-price">
                <span className="plan-currency">$</span>
                <span className="plan-amount">{parseFloat(plan.price).toLocaleString()}</span>
                <span className="plan-interval">/{plan.billingPeriod === 'YEARLY' ? 'yr' : 'mo'}</span>
              </div>
              <div className="plan-card-bottom">
                <span className="plan-id">ID: {plan.id}</span>
                {onSubscribe && (
                  <button className="btn btn-sm btn-primary" onClick={() => onSubscribe(plan.id)}>
                    + Subscribe
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

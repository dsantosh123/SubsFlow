import { useState } from 'react';
import './PlansPanel.css';

function typeBadge(billingType) {
  const map = {
    FIXED: 'badge-fixed',
    USAGE_BASED: 'badge-usage',
    TIERED: 'badge-tiered',
  };
  return map[billingType] || '';
}

export default function PlansPanel({ plans, loading, onRefresh, onSubscribe }) {
  const [periodFilter, setPeriodFilter] = useState('ALL'); // 'ALL' | 'MONTHLY' | 'YEARLY'

  const filteredPlans = plans.filter((plan) => {
    if (periodFilter === 'ALL') return true;
    return plan.billingPeriod === periodFilter;
  });

  return (
    <div className="panel glass-panel animate-fade-in">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">🏷️</div>
          <div>
            <h2 className="section-title">Available Subscription Plans</h2>
            <p className="panel-subtitle">Multi-tier catalog supporting fixed, metered usage, and yearly contracts.</p>
          </div>
        </div>

        <div className="plans-header-actions">
          <div className="period-toggle-group">
            <button
              className={`toggle-btn ${periodFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('ALL')}
            >
              All
            </button>
            <button
              className={`toggle-btn ${periodFilter === 'MONTHLY' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('MONTHLY')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${periodFilter === 'YEARLY' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('YEARLY')}
            >
              Yearly <span className="discount-tag">Save 20%</span>
            </button>
          </div>

          <button className="btn-refresh" onClick={onRefresh} title="Refresh plans">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : filteredPlans.length === 0 ? (
        <div className="panel-empty">
          <span className="empty-emoji">📦</span>
          <p>No billing plans found matching selected filter.</p>
        </div>
      ) : (
        <div className="plans-grid">
          {filteredPlans.map((plan) => {
            const isYearly = plan.billingPeriod === 'YEARLY';
            const isUsage = plan.billingType === 'USAGE_BASED';

            return (
              <div key={plan.id} className={`plan-card ${isYearly ? 'plan-card-featured' : ''}`}>
                {isYearly && <div className="featured-banner">Annual Value</div>}

                <div className="plan-card-header">
                  <div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-badges">
                      <span className={`badge ${typeBadge(plan.billingType)}`}>
                        {plan.billingType.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-${plan.billingPeriod.toLowerCase()}`}>
                        {plan.billingPeriod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plan-price-container">
                  <span className="plan-currency">$</span>
                  <span className="plan-amount">{parseFloat(plan.price).toLocaleString()}</span>
                  <span className="plan-interval">/{isYearly ? 'year' : 'month'}</span>
                </div>

                <div className="plan-features">
                  <div className="plan-feature-item">✓ Multi-tenant data segregation</div>
                  <div className="plan-feature-item">✓ Instant prorated plan upgrades</div>
                  {isUsage ? (
                    <div className="plan-feature-item">✓ Dynamic Metered Usage Ingestion</div>
                  ) : (
                    <div className="plan-feature-item">✓ High-speed Redis Idempotency</div>
                  )}
                </div>

                <div className="plan-card-footer">
                  <span className="plan-code-id code-font">{plan.id}</span>
                  {onSubscribe && (
                    <button className="btn btn-sm btn-primary" onClick={() => onSubscribe(plan.id)}>
                      + Subscribe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

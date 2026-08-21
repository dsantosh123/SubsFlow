import { useState } from 'react';
import {
  Zap,
  Timer,
  Clock,
  Calendar,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { createPlan } from '../api';
import './PlansPanel.css';

function typeBadge(billingType) {
  const map = {
    FIXED: 'badge-fixed',
    USAGE_BASED: 'badge-usage',
    TIERED: 'badge-tiered',
  };
  return map[billingType] || '';
}

function getPeriodInterval(period) {
  switch (period) {
    case 'MINUTE':
      return 'min';
    case 'HOURLY':
      return 'hr';
    case 'DAILY':
      return 'day';
    case 'YEARLY':
      return 'year';
    case 'MONTHLY':
    default:
      return 'mo';
  }
}

export default function PlansPanel({ apiKey, plans, loading, onRefresh, onSubscribe, addLog, onTriggerToast }) {
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    billingType: 'FIXED',
    billingPeriod: 'MINUTE',
    price: '9.99',
  });

  const filteredPlans = plans.filter((plan) => {
    if (periodFilter === 'ALL') return true;
    return plan.billingPeriod === periodFilter;
  });

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      setFormError('Plan name and price are required.');
      return;
    }

    setIsCreating(true);
    setFormError('');

    const res = await createPlan(apiKey, formData);
    if (addLog && res.meta) {
      addLog({
        method: res.meta.method,
        url: res.meta.url,
        status: res.status,
        elapsed: res.meta.elapsed,
        body: res.data,
      });
    }

    if (res.ok) {
      onTriggerToast?.('success', 'Plan Created', `Billing plan "${formData.name}" created successfully.`);
      setShowCreateModal(false);
      setFormData({
        name: '',
        billingType: 'FIXED',
        billingPeriod: 'MINUTE',
        price: '9.99',
      });
      onRefresh?.();
    } else {
      setFormError(res.data?.error || 'Failed to create billing plan.');
      onTriggerToast?.('error', 'Creation Failed', res.data?.error || 'Failed to create plan.');
    }
    setIsCreating(false);
  };

  return (
    <div className="panel glass-panel animate-fade-in plans-panel-root">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="section-title">Available Subscription Plans</h2>
            <p className="panel-subtitle">Multi-tier catalog supporting minute-level demo, hourly, daily, and annual contracts.</p>
          </div>
        </div>

        <div className="plans-header-actions">
          {apiKey && (
            <button
              className="btn btn-sm btn-accent btn-create-plan"
              onClick={() => setShowCreateModal(true)}
              title="Create new billing plan"
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              New Plan
            </button>
          )}

          <button className="btn-refresh" onClick={onRefresh} title="Refresh plans">
            <RefreshCw className={`w-4 h-4 mr-1 inline ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="plans-filter-bar">
        <div className="period-toggle-group">
          <button
            className={`toggle-btn ${periodFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('ALL')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            All ({plans.length})
          </button>
          <button
            className={`toggle-btn toggle-minute ${periodFilter === 'MINUTE' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('MINUTE')}
          >
            <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Minute (Demo Mode)
          </button>
          <button
            className={`toggle-btn ${periodFilter === 'HOURLY' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('HOURLY')}
          >
            <Timer className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Hourly
          </button>
          <button
            className={`toggle-btn ${periodFilter === 'DAILY' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('DAILY')}
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            Daily
          </button>
          <button
            className={`toggle-btn ${periodFilter === 'MONTHLY' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('MONTHLY')}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Monthly
          </button>
          <button
            className={`toggle-btn ${periodFilter === 'YEARLY' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('YEARLY')}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
            Yearly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : filteredPlans.length === 0 ? (
        <div className="panel-empty">
          <Layers className="w-10 h-10 text-slate-500 mb-2" />
          <p>No billing plans found matching the "{periodFilter}" filter.</p>
          {apiKey && (
            <button className="btn btn-sm btn-primary mt-3" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1 inline" />
              Create a {periodFilter !== 'ALL' ? periodFilter : ''} Plan
            </button>
          )}
        </div>
      ) : (
        <div className="plans-grid">
          {filteredPlans.map((plan) => {
            const isMinute = plan.billingPeriod === 'MINUTE';
            const isHourly = plan.billingPeriod === 'HOURLY';
            const isDaily = plan.billingPeriod === 'DAILY';
            const isYearly = plan.billingPeriod === 'YEARLY';
            const isUsage = plan.billingType === 'USAGE_BASED';

            return (
              <div
                key={plan.id}
                className={`plan-card ${isMinute ? 'plan-card-minute' : ''} ${isHourly ? 'plan-card-hourly' : ''} ${isYearly ? 'plan-card-featured' : ''}`}
              >
                {isMinute && (
                  <div className="featured-banner banner-minute">
                    <Zap className="w-3 h-3 inline mr-1" />
                    60s High-Speed Demo
                  </div>
                )}
                {isHourly && (
                  <div className="featured-banner banner-hourly">
                    <Timer className="w-3 h-3 inline mr-1" />
                    High Frequency
                  </div>
                )}
                {isYearly && (
                  <div className="featured-banner">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Annual Value
                  </div>
                )}

                <div className="plan-card-header">
                  <div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-badges">
                      <span className={`badge ${typeBadge(plan.billingType)}`}>
                        {plan.billingType.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-${plan.billingPeriod.toLowerCase()}`}>
                        {isMinute && <Zap className="w-3 h-3 mr-1 inline" />}
                        {isHourly && <Timer className="w-3 h-3 mr-1 inline" />}
                        {isDaily && <Clock className="w-3 h-3 mr-1 inline" />}
                        {plan.billingPeriod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plan-price-container">
                  <span className="plan-currency">$</span>
                  <span className="plan-amount">{parseFloat(plan.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  <span className="plan-interval">/{getPeriodInterval(plan.billingPeriod)}</span>
                </div>

                <div className="plan-features">
                  {isMinute && (
                    <div className="plan-feature-item font-semibold text-amber-300">
                      <Zap className="w-3.5 h-3.5 mr-1 inline text-amber-400" />
                      Automatic 10s cycle maturity check
                    </div>
                  )}
                  {isHourly && (
                    <div className="plan-feature-item font-semibold text-cyan-300">
                      <Timer className="w-3.5 h-3.5 mr-1 inline text-cyan-400" />
                      Automated hourly invoice rollups
                    </div>
                  )}
                  <div className="plan-feature-item">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline text-emerald-400" />
                    Multi-tenant data segregation
                  </div>
                  <div className="plan-feature-item">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline text-emerald-400" />
                    Instant prorated plan switching
                  </div>
                  {isUsage ? (
                    <div className="plan-feature-item">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline text-cyan-400" />
                      Dynamic Metered Usage Ingestion
                    </div>
                  ) : (
                    <div className="plan-feature-item">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline text-indigo-400" />
                      High-speed Redis Idempotency
                    </div>
                  )}
                </div>

                <div className="plan-card-footer">
                  <span className="plan-code-id code-font">{plan.id}</span>
                  {onSubscribe && (
                    <button
                      className={`btn btn-sm ${isMinute ? 'btn-amber' : isHourly ? 'btn-cyan' : 'btn-primary'}`}
                      onClick={() => onSubscribe(plan.id)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 inline" />
                      Subscribe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Plan */}
      {showCreateModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="modal-title">Create New Billing Plan</h3>
                  <p className="modal-subtitle">Deploy a custom high-frequency or standard subscription plan.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="modal-form">
              <div className="input-group">
                <label htmlFor="plan-name">Plan Name</label>
                <input
                  id="plan-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Flash 60s Real-time Tier"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label htmlFor="billing-period">Billing Period</label>
                  <select
                    id="billing-period"
                    className="input-field font-mono text-sm"
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                  >
                    <option value="MINUTE">⚡ Minute (Demo Mode: 60s)</option>
                    <option value="HOURLY">⏱️ Hourly (60m Cycle)</option>
                    <option value="DAILY">📅 Daily (24h Cycle)</option>
                    <option value="MONTHLY">🗓️ Monthly (Standard 30d)</option>
                    <option value="YEARLY">✨ Yearly (Annual Contract)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="billing-type">Billing Type</label>
                  <select
                    id="billing-type"
                    className="input-field font-mono text-sm"
                    value={formData.billingType}
                    onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                  >
                    <option value="FIXED">FIXED (Flat Rate)</option>
                    <option value="USAGE_BASED">USAGE_BASED (Metered)</option>
                    <option value="TIERED">TIERED (Tiered Volume)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="plan-price">Base Price ($ USD)</label>
                <input
                  id="plan-price"
                  type="number"
                  step="0.0001"
                  min="0"
                  className="input-field font-mono"
                  placeholder="9.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Deploying Plan…' : 'Deploy Billing Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

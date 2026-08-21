import { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Zap,
  Timer,
  Clock,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
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
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function SubscriptionCycleProgress({ sub, onMatured }) {
  const [now, setNow] = useState(Date.now());
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const plan = sub.plan || {};
  const period = plan.billingPeriod || 'MONTHLY';
  const isHighFreq = period === 'MINUTE' || period === 'HOURLY' || period === 'DAILY';

  const startTime = sub.currentPeriodStart ? new Date(sub.currentPeriodStart).getTime() : 0;
  const endTime = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0;

  const total = Math.max(1, endTime - startTime);
  const elapsed = Math.max(0, now - startTime);
  const remainingMs = Math.max(0, endTime - now);
  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

  // If cycle is matured (remaining <= 0) and subscription is ACTIVE, trigger refresh once per 8s
  useEffect(() => {
    if (sub.status === 'ACTIVE' && remainingMs <= 0) {
      const nowTime = Date.now();
      if (nowTime - lastTriggerRef.current > 8000) {
        lastTriggerRef.current = nowTime;
        onMatured?.();
      }
    }
  }, [remainingMs, sub.status, onMatured]);

  const formatRemaining = (ms) => {
    if (ms <= 0) return 'Matured · Processing Invoice';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hours = Math.floor(mins / 60);

    if (hours > 0) {
      return `${hours}h ${mins % 60}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  const isMatured = remainingMs <= 0 && sub.status === 'ACTIVE';
  const isUrgent = remainingMs > 0 && remainingMs <= 10000 && period === 'MINUTE';

  return (
    <div className={`cycle-progress-container ${isMinutePlan(period) ? 'cycle-minute' : ''}`}>
      <div className="cycle-header">
        <div className="cycle-title-wrap">
          {period === 'MINUTE' ? (
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : period === 'HOURLY' ? (
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="cycle-title">
            {period === 'MINUTE' ? 'Demo Realtime Cycle' : `${period} Billing Window`}
          </span>
        </div>

        <div className={`cycle-countdown ${isMatured ? 'countdown-matured' : isUrgent ? 'countdown-urgent' : ''}`}>
          {isMatured && <Activity className="w-3.5 h-3.5 animate-spin inline mr-1" />}
          <span>{formatRemaining(remainingMs)}</span>
        </div>
      </div>

      <div className="cycle-progress-track">
        <div
          className={`cycle-progress-fill ${isMinutePlan(period) ? 'fill-minute' : isHourlyPlan(period) ? 'fill-hourly' : ''} ${isMatured ? 'fill-matured' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="cycle-footer">
        <span className="cycle-footer-time">{formatDate(sub.currentPeriodStart)}</span>
        <span className="cycle-percent">{percent.toFixed(0)}% elapsed</span>
        <span className="cycle-footer-time">{formatDate(sub.currentPeriodEnd)}</span>
      </div>
    </div>
  );
}

function isMinutePlan(period) {
  return period === 'MINUTE';
}

function isHourlyPlan(period) {
  return period === 'HOURLY';
}

export default function SubscriptionsPanel({ subscriptions, loading, onRefresh, onCancel, onMatured }) {
  return (
    <div className="panel glass-panel animate-fade-in subscriptions-panel-root">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">
            <CreditCard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="section-title">Active Subscriptions</h2>
            <p className="panel-subtitle">Contracts with real-time countdowns & optimistic lock versioning.</p>
          </div>
        </div>

        <button className="btn-refresh" onClick={onRefresh} title="Refresh subscriptions">
          <RefreshCw className={`w-4 h-4 mr-1 inline ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : subscriptions.length === 0 ? (
        <div className="panel-empty">
          <Layers className="w-10 h-10 text-slate-500 mb-2" />
          <p>No active subscriptions found for this tenant.</p>
          <span className="empty-hint">Select a plan on the left to subscribe and begin automated cycles.</span>
        </div>
      ) : (
        <div className="subs-list">
          {subscriptions.map((sub) => {
            const plan = sub.plan || {};
            const isCancelled = sub.status === 'CANCELLED';
            const period = plan.billingPeriod || 'MONTHLY';
            const isMinute = period === 'MINUTE';
            const isHourly = period === 'HOURLY';

            return (
              <div
                key={sub.id}
                className={`sub-card ${isMinute ? 'sub-card-minute' : isHourly ? 'sub-card-hourly' : ''} ${isCancelled ? 'sub-card-cancelled' : ''}`}
              >
                <div className="sub-card-top">
                  <div>
                    <div className="sub-header-line">
                      <h3 className="sub-plan-name">{plan.name || 'Custom Plan'}</h3>
                      <span className={`badge ${statusBadge(sub.status)}`}>
                        {sub.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                        {sub.status === 'PAST_DUE' && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                        {sub.status === 'CANCELLED' && <XCircle className="w-3 h-3 mr-1 inline" />}
                        {sub.status}
                      </span>
                    </div>
                    <div className="sub-meta-row">
                      <span className="sub-id code-font">{sub.id}</span>
                      <span className={`badge badge-sm badge-${period.toLowerCase()}`}>
                        {isMinute && <Zap className="w-2.5 h-2.5 mr-0.5 inline" />}
                        {isHourly && <Timer className="w-2.5 h-2.5 mr-0.5 inline" />}
                        {period}
                      </span>
                    </div>
                  </div>

                  <div className="sub-price">
                    <span className="sub-amount">${parseFloat(plan.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="sub-interval">
                      /{period === 'MINUTE' ? 'min' : period === 'HOURLY' ? 'hr' : period === 'DAILY' ? 'day' : period === 'YEARLY' ? 'yr' : 'mo'}
                    </span>
                  </div>
                </div>

                {/* Real-time Cycle Progress Bar */}
                {!isCancelled && (
                  <SubscriptionCycleProgress sub={sub} onMatured={onMatured} />
                )}

                <div className="sub-dates-grid">
                  <div className="date-block">
                    <span className="date-label">Period Start</span>
                    <span className="date-value">{formatDate(sub.currentPeriodStart)}</span>
                  </div>
                  <div className="date-block">
                    <span className="date-label">Renewal / Maturity</span>
                    <span className="date-value text-cyan-300">{formatDate(sub.currentPeriodEnd)}</span>
                  </div>
                  <div className="date-block">
                    <span className="date-label">Lock Version</span>
                    <span className="date-value code-font">
                      <Shield className="w-3 h-3 mr-1 inline text-slate-400" />
                      v{sub.version ?? 0}
                    </span>
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

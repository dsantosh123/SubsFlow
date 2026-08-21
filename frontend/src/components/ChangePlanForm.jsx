import { useState, useMemo } from 'react';
import { changePlan } from '../api';

export default function ChangePlanForm({ apiKey, subscriptions, plans, addLog, onSuccess, onTriggerToast }) {
  const [subId, setSubId] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('pm_card_visa');
  const [idempotencyKey, setIdempotencyKey] = useState(`idem_${Math.random().toString(36).substring(2, 9)}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Selected subscription & plan objects for live proration calculation
  const selectedSub = subscriptions.find((s) => s.id === subId) || subscriptions[0];
  const currentPlan = selectedSub?.plan;
  const targetPlan = plans.find((p) => p.id === (newPlanId || (plans[0]?.id !== currentPlan?.id ? plans[0]?.id : plans[1]?.id)));

  // Estimate proration (e.g. 50% remaining for live preview)
  const prorationEstimate = useMemo(() => {
    if (!currentPlan || !targetPlan) return null;
    const oldPrice = parseFloat(currentPlan.price || 0) || 0;
    const newPrice = parseFloat(targetPlan.price || 0) || 0;
    // Assuming mid-period (approx 50% unused)
    const credit = Number(oldPrice * 0.5) || 0;
    const charge = Number(newPrice * 0.5) || 0;
    const net = Number(charge - credit) || 0;
    return {
      credit,
      charge,
      net: net > 0 ? net : 0,
      isDowngrade: net <= 0,
    };
  }, [currentPlan, targetPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveSubId = subId || selectedSub?.id;
    const effectivePlanId = newPlanId || targetPlan?.id;

    if (!effectiveSubId || !effectivePlanId) {
      setError('Please select both a subscription and a target plan.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const res = await changePlan(apiKey, effectiveSubId, effectivePlanId, paymentMethodId, idempotencyKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      setResult(res.data);
      onTriggerToast?.('success', 'Plan Changed Successfully', `Subscription updated to ${targetPlan?.name || 'new plan'} with atomic proration.`);
      onSuccess?.();
      // Generate new idempotency key for next action
      setIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 9)}`);
    } else {
      setError(res.data?.error || `Failed with status ${res.status}`);
      onTriggerToast?.('error', 'Plan Change Failed', res.data?.error || 'Proration or transaction failed.');
    }
    setLoading(false);
  };

  return (
    <div className="panel glass-panel animate-fade-in">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">🔄</div>
          <div>
            <h2 className="section-title">Prorated Plan Switcher</h2>
            <p className="panel-subtitle">Instant upgrade/downgrade with automatic credit & debit calculation.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="action-form">
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="cp-sub">Subscription</label>
            <select
              id="cp-sub"
              className="input-field"
              value={subId || selectedSub?.id || ''}
              onChange={(e) => setSubId(e.target.value)}
            >
              {subscriptions.length === 0 ? (
                <option value="">No active subscriptions</option>
              ) : (
                subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.plan?.name} · ${s.plan?.price}/{s.plan?.billingPeriod})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="cp-plan">Target Plan</label>
            <select
              id="cp-plan"
              className="input-field"
              value={newPlanId || targetPlan?.id || ''}
              onChange={(e) => setNewPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price}/{p.billingPeriod})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Proration Breakdown Preview */}
        {prorationEstimate && currentPlan && targetPlan && (
          <div className="proration-preview-box">
            <div className="proration-header">
              <span className="proration-tag">Live Proration Estimate</span>
              <span className="proration-summary">
                {currentPlan.name} → {targetPlan.name}
              </span>
            </div>
            <div className="proration-grid">
              <div className="proration-item">
                <span className="p-label">Unused Time Credit:</span>
                <span className="p-value credit-text">-${(Number(prorationEstimate.credit) || 0).toFixed(2)}</span>
              </div>
              <div className="proration-item">
                <span className="p-label">New Plan Charge:</span>
                <span className="p-value">+${(Number(prorationEstimate.charge) || 0).toFixed(2)}</span>
              </div>
              <div className="proration-item proration-total">
                <span className="p-label">Estimated Net Due:</span>
                <span className="p-value total-text">${(Number(prorationEstimate.net) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="input-group">
            <label htmlFor="cp-pm">Payment Method</label>
            <select
              id="cp-pm"
              className="input-field"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              <option value="pm_card_visa">💳 Visa (Success - 200 OK)</option>
              <option value="pm_card_0000">⚠️ Card 0000 (Decline & Enqueue Dunning)</option>
              <option value="pm_card_9999">🔴 Card 9999 (Simulate Timeout & Breaker)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="cp-idem">Idempotency Key</label>
            <input
              id="cp-idem"
              className="input-field code-font"
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary btn-full"
          type="submit"
          disabled={loading || subscriptions.length === 0}
        >
          {loading ? 'Processing Atomic Plan Change…' : 'Confirm & Execute Plan Change'}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { changePlan } from '../api';

export default function ChangePlanForm({ apiKey, subscriptions, plans, addLog, onSuccess }) {
  const [subId, setSubId] = useState('');
  const [planId, setPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subId || !planId || !paymentMethod) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    // Auto-generate idempotency key
    const idempotencyKey = 'idk_' + Math.random().toString(36).substring(2, 10);

    const res = await changePlan(apiKey, subId, planId, paymentMethod, idempotencyKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
      idempotencyKey,
    });

    if (res.ok) {
      setSuccess(true);
      setSubId('');
      setPlanId('');
      setPaymentMethod('');
      onSuccess(); // Refresh subs
    } else {
      setError(res.data?.error || 'Failed to change plan');
    }
    setLoading(false);
  };

  return (
    <div className="panel glass">
      <div className="section-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Change Plan
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="action-form">
        <div className="input-group">
          <label htmlFor="cp-sub">Subscription</label>
          <select
            id="cp-sub"
            className="input-field"
            value={subId}
            onChange={(e) => { setSubId(e.target.value); setSuccess(false); }}
            required
          >
            <option value="">Select a subscription...</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.planName} ({s.id})
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="cp-plan">New Plan</label>
          <select
            id="cp-plan"
            className="input-field"
            value={planId}
            onChange={(e) => { setPlanId(e.target.value); setSuccess(false); }}
            required
          >
            <option value="">Select new plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - ${parseFloat(p.price)}/{p.billingPeriod === 'MONTHLY' ? 'mo' : 'yr'}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="cp-pm">Payment Method ID</label>
          <input
            id="cp-pm"
            className="input-field"
            type="text"
            placeholder="e.g. pm_12345"
            value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value); setSuccess(false); }}
            required
          />
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">Plan changed successfully!</div>}

        <button type="submit" className="btn btn-primary" disabled={loading || !subId || !planId || !paymentMethod}>
          {loading ? 'Processing...' : 'Submit Change'}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { changePlan, createSubscription } from '../api';
import './GatewaySandbox.css';

export default function GatewaySandbox({ apiKey, subscriptions, plans, addLog, onTriggerToast }) {
  const [selectedSubId, setSelectedSubId] = useState(subscriptions[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [paymentScenario, setPaymentScenario] = useState('pm_card_visa');
  const [customKey, setCustomKey] = useState(`idem_${Math.random().toString(36).substring(2, 10)}`);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const generateNewKey = () => {
    setCustomKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleExecuteRequest = async () => {
    if (!selectedSubId || !selectedPlanId) {
      onTriggerToast?.('warning', 'Missing Selection', 'Please ensure you have selected a subscription and target plan.');
      return;
    }

    setLoading(true);
    setLastResult(null);

    const res = await changePlan(apiKey, selectedSubId, selectedPlanId, paymentScenario, customKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    setLastResult(res);
    setLoading(false);

    if (res.ok) {
      onTriggerToast?.('success', 'Request Processed (200 OK)', `Plan changed successfully with key: ${customKey}`);
    } else {
      onTriggerToast?.('error', `Error (${res.status})`, res.data?.error || 'Transaction or Idempotency check failed.');
    }
  };

  return (
    <div className="sandbox-container glass-panel animate-fade-in">
      <div className="sandbox-header">
        <div className="sandbox-title-group">
          <div className="sandbox-icon">🧪</div>
          <div>
            <h2 className="sandbox-title">Payment Gateway & Idempotency Sandbox</h2>
            <p className="sandbox-subtitle">
              Simulate concurrent double-charges, card declines, and circuit breaker timeouts against the live Spring Boot engine.
            </p>
          </div>
        </div>
      </div>

      <div className="sandbox-grid">
        {/* Left: Configuration Form */}
        <div className="sandbox-form-card">
          <h3 className="sandbox-section-heading">1. Configure Scenario</h3>

          <div className="sandbox-field-group">
            <label className="sandbox-label">Target Subscription</label>
            <select
              className="sandbox-select"
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
            >
              {subscriptions.length === 0 ? (
                <option value="">No active subscriptions</option>
              ) : (
                subscriptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.id} ({sub.plan?.name} - {sub.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="sandbox-field-group">
            <label className="sandbox-label">New Target Plan</label>
            <select
              className="sandbox-select"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price}/{p.billingPeriod})
                </option>
              ))}
            </select>
          </div>

          <div className="sandbox-field-group">
            <label className="sandbox-label">Payment Gateway Test Card</label>
            <div className="scenario-options">
              <label className={`scenario-pill ${paymentScenario === 'pm_card_visa' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scenario"
                  value="pm_card_visa"
                  checked={paymentScenario === 'pm_card_visa'}
                  onChange={(e) => setPaymentScenario(e.target.value)}
                />
                <div>
                  <span className="pill-title">🟢 Success Card</span>
                  <span className="pill-sub">pm_card_visa (200 OK)</span>
                </div>
              </label>

              <label className={`scenario-pill ${paymentScenario === 'pm_card_0000' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scenario"
                  value="pm_card_0000"
                  checked={paymentScenario === 'pm_card_0000'}
                  onChange={(e) => setPaymentScenario(e.target.value)}
                />
                <div>
                  <span className="pill-title">🟠 Decline Card (Dunning)</span>
                  <span className="pill-sub">Ends with ...0000 (Insufficient funds)</span>
                </div>
              </label>

              <label className={`scenario-pill ${paymentScenario === 'pm_card_9999' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scenario"
                  value="pm_card_9999"
                  checked={paymentScenario === 'pm_card_9999'}
                  onChange={(e) => setPaymentScenario(e.target.value)}
                />
                <div>
                  <span className="pill-title">🔴 Gateway Timeout (Breaker)</span>
                  <span className="pill-sub">Ends with ...9999 (3s timeout & fallback)</span>
                </div>
              </label>
            </div>
          </div>

          <div className="sandbox-field-group">
            <div className="key-label-row">
              <label className="sandbox-label">Idempotency Key (SHA-256)</label>
              <button className="btn-key-gen" onClick={generateNewKey}>⚡ New UUID</button>
            </div>
            <input
              className="sandbox-input code-font"
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
            />
            <span className="sandbox-hint">
              Tip: Re-submit without changing this key to test duplicate request rejection.
            </span>
          </div>

          <button
            className="btn btn-primary btn-full sandbox-submit-btn"
            onClick={handleExecuteRequest}
            disabled={loading || subscriptions.length === 0}
          >
            {loading ? 'Dispatching to Gateway…' : '🚀 Dispatch Request'}
          </button>
        </div>

        {/* Right: Live Response & Header Inspector */}
        <div className="sandbox-response-card">
          <h3 className="sandbox-section-heading">2. Gateway Output & Response</h3>

          {lastResult ? (
            <div className="response-output-box">
              <div className="response-status-bar">
                <span className={`status-pill status-${lastResult.ok ? 'success' : 'fail'}`}>
                  HTTP {lastResult.status || 'ERR'} {lastResult.ok ? 'OK' : 'FAILED'}
                </span>
                <span className="response-elapsed">⚡ {lastResult.meta.elapsed}ms latency</span>
              </div>

              <div className="response-json-viewer">
                <pre><code>{JSON.stringify(lastResult.data, null, 2)}</code></pre>
              </div>
            </div>
          ) : (
            <div className="response-placeholder">
              <div className="placeholder-icon">📡</div>
              <p>Configure a scenario and click <strong>Dispatch Request</strong> to observe the backend transaction and idempotency handler.</p>
            </div>
          )}

          <div className="sandbox-notes">
            <h4>💡 What happens under the hood?</h4>
            <ul>
              <li><strong>Idempotency Validation:</strong> First request stores SHA-256 in PostgreSQL. Duplicate replays return cached results immediately.</li>
              <li><strong>Resilience4j Circuit Breaker:</strong> If 3 consecutive gateway calls fail/timeout, circuit trips to <code>OPEN</code> state.</li>
              <li><strong>Transactional Outbox:</strong> All mutations are committed alongside outbox table records atomically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ingestUsage } from '../api';

export default function UsageForm({ apiKey, subscriptions, addLog, onTriggerToast }) {
  const [subId, setSubId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [eventType, setEventType] = useState('api_requests');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedSubId = subId || subscriptions[0]?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubId || !quantity) {
      setError('Please provide a valid subscription and quantity.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await ingestUsage(apiKey, selectedSubId, quantity, eventType);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      onTriggerToast?.('success', 'Usage Ingested', `Logged ${quantity} ${eventType} for subscription ${selectedSubId}.`);
    } else {
      setError(res.data?.error || `Failed with status ${res.status}`);
      onTriggerToast?.('error', 'Usage Ingestion Failed', res.data?.error || 'Could not record usage event.');
    }
    setLoading(false);
  };

  const applyPreset = (qty, type) => {
    setQuantity(qty.toString());
    if (type) setEventType(type);
  };

  return (
    <div className="panel glass-panel animate-fade-in">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">📊</div>
          <div>
            <h2 className="section-title">Metered Usage Ingestion</h2>
            <p className="panel-subtitle">Stream metered billing events for usage-based subscription tiers.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="action-form">
        <div className="input-group">
          <label htmlFor="usage-sub">Target Subscription</label>
          <select
            id="usage-sub"
            className="input-field"
            value={selectedSubId || ''}
            onChange={(e) => setSubId(e.target.value)}
          >
            {subscriptions.length === 0 ? (
              <option value="">No subscriptions available</option>
            ) : (
              subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} ({s.plan?.name} · {s.status})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label htmlFor="usage-qty">Usage Units / Quantity</label>
            <input
              id="usage-qty"
              className="input-field"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="usage-type">Metric Event Type</label>
            <select
              id="usage-type"
              className="input-field"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="api_requests">API Requests (calls)</option>
              <option value="storage_gb">Storage (GB)</option>
              <option value="compute_minutes">Compute Time (mins)</option>
            </select>
          </div>
        </div>

        <div className="presets-row">
          <span className="presets-label">Quick Presets:</span>
          <button type="button" className="preset-chip" onClick={() => applyPreset(50, 'api_requests')}>+50 API</button>
          <button type="button" className="preset-chip" onClick={() => applyPreset(250, 'api_requests')}>+250 API</button>
          <button type="button" className="preset-chip" onClick={() => applyPreset(10, 'storage_gb')}>+10 GB</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-secondary btn-full"
          type="submit"
          disabled={loading || subscriptions.length === 0}
        >
          {loading ? 'Ingesting Usage…' : '⚡ Record Metered Usage'}
        </button>
      </form>
    </div>
  );
}

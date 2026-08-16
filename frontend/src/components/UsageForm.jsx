import { useState } from 'react';
import { ingestUsage } from '../api';

export default function UsageForm({ apiKey, subscriptions, addLog }) {
  const [subId, setSubId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [eventType, setEventType] = useState('API_CALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subId || !quantity || !eventType) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    const res = await ingestUsage(apiKey, subId, quantity, eventType);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      setSuccess(true);
      setQuantity('');
    } else {
      setError(res.data?.error || 'Failed to ingest usage');
    }
    setLoading(false);
  };

  return (
    <div className="panel glass">
      <div className="section-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Ingest Usage
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="action-form">
        <div className="input-group">
          <label htmlFor="usg-sub">Subscription</label>
          <select
            id="usg-sub"
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

        <div className="input-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="usg-qty">Quantity</label>
            <input
              id="usg-qty"
              className="input-field"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setSuccess(false); }}
              required
            />
          </div>
          
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="usg-evt">Event Type</label>
            <input
              id="usg-evt"
              className="input-field"
              type="text"
              placeholder="API_CALL"
              value={eventType}
              onChange={(e) => { setEventType(e.target.value); setSuccess(false); }}
              required
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">Usage ingested successfully!</div>}

        <button type="submit" className="btn btn-primary" disabled={loading || !subId || !quantity || !eventType}>
          {loading ? 'Sending...' : 'Ingest Event'}
        </button>
      </form>
    </div>
  );
}

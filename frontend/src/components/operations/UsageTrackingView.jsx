import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { recordUsage, listUsageEvents, getUsageSummary } from '../../eventsApi';
import { listSubscriptions } from '../../customerApi';
import { 
  BarChart3, 
  Plus, 
  RotateCw, 
  Activity, 
  Layers, 
  Hash, 
  Calendar, 
  User, 
  ShieldCheck 
} from 'lucide-react';

export function UsageTrackingView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Record Modal
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [featureKey, setFeatureKey] = useState('screens');
  const [quantity, setQuantity] = useState('1');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState('');

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const [sumRes, evRes, subRes] = await Promise.all([
      getUsageSummary(product.id),
      listUsageEvents(product.id),
      listSubscriptions(product.id),
    ]);

    if (sumRes.ok) setSummary(sumRes.data);
    else setSummary(null);

    if (evRes.ok && Array.isArray(evRes.data)) setEvents(evRes.data);
    else setEvents([]);

    if (subRes.ok && Array.isArray(subRes.data)) {
      setSubscriptions(subRes.data);
      if (subRes.data.length > 0 && !selectedSubId) {
        setSelectedSubId(subRes.data[0].id);
      }
    }

    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const sub = subscriptions.find((s) => s.id === selectedSubId);
    if (!sub) {
      setRecordError('Please select a valid customer subscription');
      return;
    }

    setRecordLoading(true);
    setRecordError('');

    try {
      const res = await recordUsage(product.id, {
        customerId: sub.customerId,
        subscriptionId: sub.id,
        featureKey: featureKey.trim(),
        quantity: parseFloat(quantity) || 1,
        idempotencyKey: idempotencyKey.trim() || undefined,
        occurredAt: new Date().toISOString(),
      });

      if (!res.ok) throw new Error(res.data?.error || 'Failed to record usage event');

      setIsRecordOpen(false);
      setQuantity('1');
      setIdempotencyKey('');

      if (onTriggerToast) {
        onTriggerToast('success', 'Usage Recorded', `Recorded ${quantity} unit(s) of '${featureKey}' for ${sub.customerName}.`);
      }
      await loadData();
    } catch (err) {
      setRecordError(err.message);
    } finally {
      setRecordLoading(false);
    }
  };

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Units Used</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summary ? parseFloat(summary.totalQuantity || 0).toLocaleString() : '0'}
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Usage Events Logged</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summary ? summary.totalEventsCount : '0'}
            </div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Features Tracked</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summary && summary.byFeature ? Object.keys(summary.byFeature).length : '0'}
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Breakdown Chips */}
      {summary && summary.byFeature && Object.keys(summary.byFeature).length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Usage Breakdown by Feature</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byFeature).map(([feat, qty]) => (
              <div
                key={feat}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2"
              >
                <span className="font-bold text-slate-800">{feat}:</span>
                <span className="font-mono font-black text-indigo-600">{parseFloat(qty).toLocaleString()} units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Events Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Feature Usage Audit Stream</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time consumption telemetry validated against active customer subscriptions with idempotency keys.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RotateCw size={13} className="mr-1.5" />
              <span>Refresh</span>
            </Button>
            {!isDeveloper && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsRecordOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Record Usage</span>
              </Button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
            No feature usage events recorded yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Feature Key</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-4">Occurred At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {ev.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="primary" size="sm" className="font-mono">
                        {ev.featureKey}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      +{parseFloat(ev.quantity).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {ev.idempotencyKey || '—'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {new Date(ev.occurredAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Usage */}
      <Dialog
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Feature Usage Event"
        description="Log consumption metrics for a specific active customer subscription."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {recordError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {recordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Customer Subscription</label>
            {subscriptions.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                No customer subscriptions found.
              </div>
            ) : (
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                required
              >
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.customerName} ({s.planName}) — {s.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Feature Key</label>
            <Input
              placeholder="e.g. screens, downloads, api_calls"
              value={featureKey}
              onChange={(e) => setFeatureKey(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Idempotency Key (Optional)</label>
            <Input
              placeholder="e.g. idem_tx_948271"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Prevents duplicate usage counting if requests are retried.</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              loading={recordLoading}
              disabled={subscriptions.length === 0}
            >
              <Activity size={13} />
              <span>Record Usage</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

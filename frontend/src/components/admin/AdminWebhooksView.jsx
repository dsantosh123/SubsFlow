import React, { useState, useEffect, useCallback } from 'react';
import { Send, RotateCw, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { listAllWebhookDeliveries, retryAdminWebhookDelivery } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminWebhooksView({ onTriggerToast }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await listAllWebhookDeliveries();
    if (res.ok && Array.isArray(res.data)) {
      setDeliveries(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = async (deliveryId) => {
    setRetryingId(deliveryId);
    const res = await retryAdminWebhookDelivery(deliveryId);
    if (res.ok) {
      onTriggerToast('success', 'Retry Dispatched', 'Webhook retry queued successfully.');
      loadData();
    } else {
      onTriggerToast('error', 'Retry Failed', res.data?.error || 'Could not retry delivery.');
    }
    setRetryingId(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">DELIVERED (200)</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Webhook Deliveries</h2>
          <p className="text-xs text-gray-500 font-mono">
            Live telemetry of all outbound HMAC-SHA256 signed event dispatches across all tenant products.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Feed</span>
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-gray-500">
            No outbound webhook deliveries dispatched yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Destination Endpoint</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                      {d.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-[200px] truncate" title={d.endpoint?.url}>
                    {d.endpoint?.url || '—'}
                  </td>
                  <td className="py-3 px-4">{d.attemptCount} / 5</td>
                  <td className="py-3 px-4">{getStatusBadge(d.status)}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(d.createdAt).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 text-right">
                    {d.status === 'FAILED' && (
                      <button
                        disabled={retryingId === d.id}
                        onClick={() => handleRetry(d.id)}
                        className="px-2.5 py-1 rounded bg-cyber-rose/15 hover:bg-cyber-rose/25 text-cyber-rose border border-cyber-rose/30 text-[10px] font-mono inline-flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {retryingId === d.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCw size={10} />}
                        <span>Retry</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

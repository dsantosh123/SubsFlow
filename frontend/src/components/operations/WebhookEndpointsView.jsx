import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { 
  createWebhookEndpoint, 
  listWebhookEndpoints, 
  deleteWebhookEndpoint, 
  toggleWebhookEndpoint, 
  listWebhookDeliveries, 
  retryWebhookDelivery, 
  sendTestPing 
} from '../../eventsApi';
import { 
  Send, 
  Plus, 
  Trash2, 
  Power, 
  RotateCw, 
  Play, 
  Check, 
  Copy, 
  ShieldAlert, 
  Globe, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export function WebhookEndpointsView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [endpoints, setEndpoints] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedEndpointFilter, setSelectedEndpointFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Endpoint Modal & Secret Reveal Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [subscribedEvents, setSubscribedEvents] = useState('*');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Secret Reveal state
  const [revealedSecret, setRevealedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const [epRes, delRes] = await Promise.all([
      listWebhookEndpoints(product.id),
      listWebhookDeliveries(product.id, selectedEndpointFilter),
    ]);

    if (epRes.ok && Array.isArray(epRes.data)) setEndpoints(epRes.data);
    else setEndpoints([]);

    if (delRes.ok && Array.isArray(delRes.data)) setDeliveries(delRes.data);
    else setDeliveries([]);

    setLoading(false);
  }, [product?.id, selectedEndpointFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEndpoint = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await createWebhookEndpoint(product.id, {
        url: url.trim(),
        subscribedEvents: subscribedEvents.trim() || '*',
      });

      if (!res.ok) throw new Error(res.data?.error || 'Failed to create webhook endpoint');

      setIsCreateOpen(false);
      setUrl('');
      setSubscribedEvents('*');
      setRevealedSecret(res.data.secret); // Open secret reveal modal

      if (onTriggerToast) {
        onTriggerToast('success', 'Endpoint Created', 'New webhook endpoint registered with secure signing key.');
      }
      await loadData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (endpointId) => {
    if (!window.confirm('Are you sure you want to delete this webhook endpoint? All delivery history will be removed.')) return;
    const res = await deleteWebhookEndpoint(product.id, endpointId);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('info', 'Endpoint Deleted', 'Webhook endpoint removed.');
      await loadData();
    }
  };

  const handleToggle = async (endpointId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const res = await toggleWebhookEndpoint(product.id, endpointId, nextStatus);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('info', 'Status Updated', `Endpoint is now ${nextStatus}`);
      await loadData();
    }
  };

  const handleTestPing = async (endpointId) => {
    const res = await sendTestPing(product.id, endpointId);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('success', 'Test Ping Sent', 'Dispatched test.ping event to destination URL.');
      await loadData();
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Ping Failed', res.data?.error || 'Failed to send ping');
    }
  };

  const handleRetryDelivery = async (deliveryId) => {
    const res = await retryWebhookDelivery(product.id, deliveryId);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('success', 'Delivery Retried', 'Webhook delivery attempt re-executed.');
      await loadData();
    }
  };

  const handleCopySecret = () => {
    if (revealedSecret) {
      navigator.clipboard.writeText(revealedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoints Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Registered SaaS Webhook Endpoints</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              SubsFlow sends signed HMAC-SHA256 HTTP POST notifications to your endpoints whenever events occur.
            </p>
          </div>

          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Webhook Endpoint</span>
            </Button>
          )}
        </div>

        {endpoints.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            No outbound endpoints configured. Add an endpoint to receive real-time events.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Endpoint URL</th>
                  <th className="py-3 px-4">Subscribed Events</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-indigo-600 shrink-0" />
                        <span className="truncate max-w-sm">{ep.url}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" size="sm" className="font-mono">
                        {ep.subscribedEvents}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ep.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                        {ep.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestPing(ep.id)}
                        className="h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                        title="Send Test Ping"
                      >
                        <Play size={12} className="mr-1 inline" />
                        <span>Ping</span>
                      </Button>
                      {!isDeveloper && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(ep.id, ep.status)}
                            className="h-7 px-2 text-slate-600 hover:text-slate-900"
                            title="Toggle Active/Disabled"
                          >
                            <Power size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ep.id)}
                            className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                            title="Delete Endpoint"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outbound Delivery Logs Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Outbound Webhook Delivery Logs</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of HTTP deliveries, response codes, and automatic retries.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={loadData}>
            <RotateCw size={13} className="mr-1.5" />
            <span>Refresh Logs</span>
          </Button>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
            No webhook delivery attempts recorded yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Status & HTTP</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((d) => {
                  const isDelivered = d.status === 'DELIVERED';
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {d.eventType}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 max-w-xs truncate">
                        {d.endpointUrl}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={isDelivered ? 'success' : 'destructive'} size="sm">
                            {d.status}
                          </Badge>
                          {d.responseCode && (
                            <span className={`font-mono font-bold text-[11px] ${isDelivered ? 'text-emerald-600' : 'text-rose-600'}`}>
                              HTTP {d.responseCode}
                            </span>
                          )}
                        </div>
                        {d.errorMessage && (
                          <div className="text-[10px] text-rose-500 mt-0.5 max-w-xs truncate">
                            {d.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {d.attemptCount} attempt{d.attemptCount !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {new Date(d.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isDeveloper && !isDelivered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryDelivery(d.id)}
                            className="h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                          >
                            <RotateCw size={12} className="mr-1 inline" />
                            <span>Retry</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Endpoint */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Webhook Endpoint"
        description="Register an HTTPS destination endpoint for signed event broadcasts."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateEndpoint} className="space-y-4">
          {createError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination URL</label>
            <Input
              placeholder="https://api.yourproduct.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              icon={<Globe size={15} />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Subscribed Events</label>
            <Input
              placeholder="* or subscription.*, payment.succeeded"
              value={subscribedEvents}
              onChange={(e) => setSubscribedEvents(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Use * to receive all product events, or comma-separated patterns.</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" loading={createLoading}>
              <Send size={13} />
              <span>Create Endpoint</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Secret Reveal Modal */}
      <Dialog
        isOpen={!!revealedSecret}
        onClose={() => setRevealedSecret(null)}
        title="Webhook Signing Secret Generated"
        description="This secret will only be shown once. Copy and store it securely in your backend."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Signing Secret Safeguard</strong>
              SubsFlow signs webhook payloads with this secret using HMAC-SHA256 (in the <code className="font-mono">X-SubsFlow-Signature</code> header).
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Secret Key</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={revealedSecret || ''}
                className="w-full h-10 px-3 font-mono text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleCopySecret} className="shrink-0 h-10">
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="default" size="sm" onClick={() => setRevealedSecret(null)}>
              I Have Saved My Secret
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

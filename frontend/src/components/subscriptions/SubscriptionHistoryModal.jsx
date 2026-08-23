import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getSubscriptionHistory } from '../../customerApi';
import { Activity, Clock, User, ArrowRight } from 'lucide-react';

export function SubscriptionHistoryModal({
  isOpen,
  onClose,
  subscription,
  productId,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subscription?.id && productId) {
      loadHistory();
    }
  }, [isOpen, subscription?.id, productId]);

  const loadHistory = async () => {
    setLoading(true);
    const res = await getSubscriptionHistory(productId, subscription.id);
    if (res.ok && Array.isArray(res.data)) {
      setHistory(res.data);
    } else {
      setHistory([]);
    }
    setLoading(false);
  };

  if (!subscription) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Subscription Lifecycle History`}
      description={`Audit trail for subscription ${subscription.id} (${subscription.customerName} — ${subscription.planName}).`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            No history events recorded yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.map((h, index) => (
              <div
                key={h.id || index}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                      {h.action}
                    </Badge>
                    {h.previousStatus && h.newStatus && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        {h.previousStatus} <ArrowRight size={11} /> {h.newStatus}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-800 font-medium">{h.details || 'Lifecycle state update'}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    <span>Actor: {h.performedBy || 'system'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

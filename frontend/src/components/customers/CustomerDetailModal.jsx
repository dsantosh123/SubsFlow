import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { listSubscriptions } from '../../customerApi';
import { User, Mail, Hash, Calendar, Layers, Clock, AlertCircle } from 'lucide-react';

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  productId,
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer?.id && productId) {
      loadCustomerSubs();
    }
  }, [isOpen, customer?.id, productId]);

  const loadCustomerSubs = async () => {
    setLoading(true);
    const res = await listSubscriptions(productId, { customerId: customer.id });
    if (res.ok && Array.isArray(res.data)) {
      setSubscriptions(res.data);
    } else {
      setSubscriptions([]);
    }
    setLoading(false);
  };

  if (!customer) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer: ${customer.name}`}
      description="View customer profile details and active/past subscription history."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Full Name</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <User size={13} className="text-indigo-600" />
              {customer.name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="text-indigo-600" />
              {customer.email}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">External Customer ID</span>
            <span className="font-mono text-slate-700 mt-0.5 block">
              {customer.externalCustomerId || <span className="text-slate-400 italic">None</span>}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Status</span>
            <div className="mt-0.5">
              <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                {customer.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Subscriptions section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Customer Subscriptions ({subscriptions.length})</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No subscriptions found for this customer.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sub.planName}</span>
                      <Badge
                        variant={
                          sub.status === 'ACTIVE' ? 'success' :
                          sub.status === 'TRIALING' ? 'primary' :
                          sub.status === 'PAUSED' ? 'outline' : 'destructive'
                        }
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Rate: <strong>${parseFloat(sub.priceAtSubscription).toFixed(2)} {sub.currencyAtSubscription}/{sub.billingIntervalAtSubscription.toLowerCase()}</strong>
                      {sub.trialDays > 0 && <span className="ml-2 text-indigo-600">({sub.trialDays}d trial)</span>}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>Period Ends:</div>
                    <div className="font-medium text-slate-700">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

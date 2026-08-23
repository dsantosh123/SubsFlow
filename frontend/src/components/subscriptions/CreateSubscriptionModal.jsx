import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { listCustomers } from '../../customerApi';
import { listPlans } from '../../planApi';
import { Layers, User, Clock, Check, DollarSign } from 'lucide-react';

export function CreateSubscriptionModal({
  isOpen,
  onClose,
  productId,
  onSubmitSubscription,
}) {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      loadFormData();
    }
  }, [isOpen, productId]);

  const loadFormData = async () => {
    setFetchingData(true);
    setError('');

    const [custRes, planRes] = await Promise.all([
      listCustomers(productId),
      listPlans(productId),
    ]);

    if (custRes.ok && Array.isArray(custRes.data)) {
      const activeCusts = custRes.data.filter(c => c.status === 'ACTIVE');
      setCustomers(activeCusts);
      if (activeCusts.length > 0) setSelectedCustomerId(activeCusts[0].id);
    }

    if (planRes.ok && Array.isArray(planRes.data)) {
      const activePlans = planRes.data.filter(p => p.status === 'ACTIVE' && p.visibility === 'PUBLIC');
      setPlans(activePlans);
      if (activePlans.length > 0) setSelectedPlanId(activePlans[0].id);
    }

    setFetchingData(false);
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) {
      setError('Please select both an active customer and an active plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmitSubscription({
        customerId: selectedCustomerId,
        planId: selectedPlanId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Customer Subscription"
      description="Subscribe a registered customer to an active pricing plan."
      maxWidth="max-w-lg"
    >
      {fetchingData ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading customers and active plans...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Active Customer</span>
              <span className="text-[10px] text-slate-400 font-normal">{customers.length} available</span>
            </label>

            {customers.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                No active customers found. Please add a customer first.
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) {c.externalCustomerId ? `— Ext: ${c.externalCustomerId}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Active Pricing Plan</span>
              <span className="text-[10px] text-slate-400 font-normal">{plans.length} active public plans</span>
            </label>

            {plans.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                No active public plans found for this product. Please create and activate a plan first.
              </div>
            ) : (
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                required
              >
                {plans.map((p) => {
                  const isFree = parseFloat(p.price) === 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — {isFree ? 'Free ($0)' : `$${parseFloat(p.price).toFixed(2)} ${p.currency}/${p.billingInterval.toLowerCase()}`}
                      {p.trialDays > 0 ? ` (${p.trialDays}-day trial)` : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Plan Snapshot Preview Card */}
          {selectedPlan && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Subscription Snapshot Preview</span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{selectedPlan.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Rate: <strong>${parseFloat(selectedPlan.price).toFixed(2)} {selectedPlan.currency}/{selectedPlan.billingInterval.toLowerCase()}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={selectedPlan.trialDays > 0 ? 'primary' : 'success'} size="sm">
                    {selectedPlan.trialDays > 0 ? `${selectedPlan.trialDays}-DAY TRIAL` : 'ACTIVE IMMEDIATELY'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              loading={loading}
              disabled={customers.length === 0 || plans.length === 0}
            >
              <Check size={14} />
              <span>Create Subscription</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

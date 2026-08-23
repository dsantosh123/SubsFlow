import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { listPlans } from '../../planApi';
import { RefreshCw, Check, ArrowRight } from 'lucide-react';

export function ChangePlanModal({
  isOpen,
  onClose,
  subscription,
  productId,
  onSubmitChangePlan,
}) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId && subscription) {
      loadAlternativePlans();
    }
  }, [isOpen, productId, subscription]);

  const loadAlternativePlans = async () => {
    setError('');
    const res = await listPlans(productId);
    if (res.ok && Array.isArray(res.data)) {
      // Filter out current plan and inactive plans
      const activeAlternatives = res.data.filter(
        p => p.status === 'ACTIVE' && p.id !== subscription.planId
      );
      setPlans(activeAlternatives);
      if (activeAlternatives.length > 0) {
        setSelectedPlanId(activeAlternatives[0].id);
      }
    }
  };

  if (!subscription) return null;

  const targetPlan = plans.find(p => p.id === selectedPlanId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError('Please select a new active plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmitChangePlan(subscription.id, selectedPlanId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Subscription Plan: ${subscription.customerName}`}
      description="Switch this customer's active subscription to another plan. Historical rates and lifecycle records are preserved."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Current Plan Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Plan</span>
            <div className="font-bold text-slate-900 mt-0.5">{subscription.planName}</div>
            <div className="text-slate-500">
              ${parseFloat(subscription.priceAtSubscription).toFixed(2)} {subscription.currencyAtSubscription}/{subscription.billingIntervalAtSubscription.toLowerCase()}
            </div>
          </div>
          <Badge variant="outline" size="sm">ACTIVE</Badge>
        </div>

        {/* New Plan Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Select New Target Plan</span>
            <span className="text-[10px] text-slate-400 font-normal">{plans.length} available</span>
          </label>

          {plans.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              No alternative active plans available for this product.
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
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Change Preview */}
        {targetPlan && (
          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <span>{subscription.planName}</span>
              <ArrowRight size={13} />
              <span>{targetPlan.name}</span>
            </div>
            <div className="text-[11px] text-indigo-700">
              New Rate: <strong>${parseFloat(targetPlan.price).toFixed(2)} {targetPlan.currency}/{targetPlan.billingInterval.toLowerCase()}</strong>
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
            disabled={plans.length === 0}
          >
            <Check size={14} />
            <span>Confirm Plan Change</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CreateSubscriptionModal } from './CreateSubscriptionModal';
import { ChangePlanModal } from './ChangePlanModal';
import { SubscriptionHistoryModal } from './SubscriptionHistoryModal';
import { 
  listSubscriptions, 
  createSubscription, 
  pauseSubscription, 
  resumeSubscription, 
  cancelSubscription, 
  changeSubscriptionPlan 
} from '../../customerApi';
import { listPlans } from '../../planApi';
import { 
  CreditCard, 
  Plus, 
  Filter, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  RefreshCw, 
  Activity, 
  Clock, 
  Calendar, 
  User, 
  Layers 
} from 'lucide-react';

export function SubscriptionListView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [changePlanSub, setChangePlanSub] = useState(null);
  const [historySub, setHistorySub] = useState(null);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadSubscriptions = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const res = await listSubscriptions(product.id, {
      status: statusFilter || undefined,
      planId: planFilter || undefined,
    });
    if (res.ok && Array.isArray(res.data)) {
      setSubscriptions(res.data);
    } else {
      setSubscriptions([]);
    }
    setLoading(false);
  }, [product?.id, statusFilter, planFilter]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (product?.id) {
      listPlans(product.id).then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      });
    }
  }, [product?.id]);

  const handleCreateSub = async (subData) => {
    const res = await createSubscription(product.id, subData);
    if (!res.ok) throw new Error(res.data?.error || 'Failed to create subscription');
    if (onTriggerToast) onTriggerToast('success', 'Subscription Created', 'Customer successfully subscribed to plan.');
    await loadSubscriptions();
  };

  const handlePause = async (sub) => {
    if (window.confirm(`Pause subscription for customer '${sub.customerName}'?`)) {
      const res = await pauseSubscription(product.id, sub.id);
      if (res.ok) {
        if (onTriggerToast) onTriggerToast('info', 'Subscription Paused', 'Subscription status updated to PAUSED');
        await loadSubscriptions();
      } else {
        if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to pause');
      }
    }
  };

  const handleResume = async (sub) => {
    const res = await resumeSubscription(product.id, sub.id);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('success', 'Subscription Resumed', 'Subscription status updated to ACTIVE');
      await loadSubscriptions();
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to resume');
    }
  };

  const handleCancel = async (sub, cancelAtPeriodEnd) => {
    const msg = cancelAtPeriodEnd
      ? `Schedule cancellation at the end of the current billing period (${new Date(sub.currentPeriodEnd).toLocaleDateString()})?`
      : `Cancel subscription immediately for customer '${sub.customerName}'?`;

    if (window.confirm(msg)) {
      const res = await cancelSubscription(product.id, sub.id, cancelAtPeriodEnd);
      if (res.ok) {
        if (onTriggerToast) onTriggerToast('warning', 'Subscription Cancelled', cancelAtPeriodEnd ? 'Scheduled cancellation at period end' : 'Cancelled immediately');
        await loadSubscriptions();
      } else {
        if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to cancel');
      }
    }
  };

  const handleChangePlan = async (subId, newPlanId) => {
    const res = await changeSubscriptionPlan(product.id, subId, newPlanId);
    if (!res.ok) throw new Error(res.data?.error || 'Failed to change plan');
    if (onTriggerToast) onTriggerToast('success', 'Plan Changed', 'Customer subscription plan updated successfully.');
    await loadSubscriptions();
  };

  const getStatusBadge = (status, cancelAtPeriodEnd) => {
    if (cancelAtPeriodEnd && status === 'ACTIVE') {
      return <Badge variant="destructive" size="sm">CANCELLING AT PERIOD END</Badge>;
    }
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm">ACTIVE</Badge>;
      case 'TRIALING':
        return <Badge variant="primary" size="sm">TRIALING</Badge>;
      case 'PAUSED':
        return <Badge variant="outline" size="sm">PAUSED</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" size="sm">CANCELLED</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" size="sm">EXPIRED</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Customer Subscriptions</h3>
            <Badge variant="primary" size="sm">PHASE 5</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage active subscriptions, pricing snapshots, trial periods, and status lifecycles for <strong>{product.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIALING">TRIALING</option>
            <option value="PAUSED">PAUSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>Create Subscription</span>
            </Button>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">No Subscriptions Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Subscribe active customers to pricing plans or create a new subscription above.
            </p>
          </div>
          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={14} />
              <span>Create First Subscription</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Plan & Snapshot Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Period</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {subscriptions.map((s) => {
                  const isCancelled = s.status === 'CANCELLED' || s.status === 'EXPIRED';
                  const isPaused = s.status === 'PAUSED';
                  const isActive = s.status === 'ACTIVE' || s.status === 'TRIALING';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{s.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.customerEmail}</div>
                      </td>

                      {/* Plan & Pricing Snapshot */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Layers size={13} className="text-indigo-600" />
                          <span>{s.planName}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">(v{s.planVersion})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ${parseFloat(s.priceAtSubscription).toFixed(2)} {s.currencyAtSubscription}/{s.billingIntervalAtSubscription.toLowerCase()}
                          {s.trialDays > 0 && <span className="ml-1.5 text-indigo-600 font-semibold">({s.trialDays}d trial)</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(s.status, s.cancelAtPeriodEnd)}
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="text-slate-700">
                          {new Date(s.currentPeriodStart).toLocaleDateString()} → {new Date(s.currentPeriodEnd).toLocaleDateString()}
                        </div>
                        {s.trialEndDate && (
                          <div className="text-[10px] text-indigo-600 font-medium">
                            Trial Ends: {new Date(s.trialEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistorySub(s)}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                        >
                          <Activity size={13} className="mr-1 inline" />
                          <span>History</span>
                        </Button>

                        {!isDeveloper && !isCancelled && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChangePlanSub(s)}
                              className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                            >
                              <RefreshCw size={13} className="mr-1 inline" />
                              <span>Change Plan</span>
                            </Button>

                            {s.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePause(s)}
                                className="h-7 px-2 text-amber-600 hover:text-amber-700"
                              >
                                <PauseCircle size={13} className="mr-1 inline" />
                                <span>Pause</span>
                              </Button>
                            )}

                            {isPaused && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResume(s)}
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700"
                              >
                                <PlayCircle size={13} className="mr-1 inline" />
                                <span>Resume</span>
                              </Button>
                            )}

                            {!s.cancelAtPeriodEnd ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(s, false)}
                                className="h-7 px-2 text-rose-600 hover:text-rose-700"
                              >
                                <XCircle size={13} className="mr-1 inline" />
                                <span>Cancel</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-medium italic">
                                Ending soon
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        productId={product.id}
        onSubmitSubscription={handleCreateSub}
      />

      <ChangePlanModal
        isOpen={!!changePlanSub}
        onClose={() => setChangePlanSub(null)}
        subscription={changePlanSub}
        productId={product.id}
        onSubmitChangePlan={handleChangePlan}
      />

      <SubscriptionHistoryModal
        isOpen={!!historySub}
        onClose={() => setHistorySub(null)}
        subscription={historySub}
        productId={product.id}
      />
    </div>
  );
}

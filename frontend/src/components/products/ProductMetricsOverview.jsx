import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getProductDashboard } from '../../customerApi';
import { Users, CreditCard, Clock, PauseCircle, XCircle, RefreshCw } from 'lucide-react';

export function ProductMetricsOverview({ productId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const res = await getProductDashboard(productId);
    if (res.ok && res.data) {
      setMetrics(res.data);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {/* Customers Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
          <span className="font-semibold">Customers</span>
          <Users size={14} className="text-indigo-600" />
        </div>
        <div className="text-xl font-black text-slate-900">
          {metrics.totalCustomers}
        </div>
        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
          {metrics.activeCustomers} Active
        </div>
      </Card>

      {/* Active Subscriptions Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
          <span className="font-semibold">Active Subs</span>
          <CreditCard size={14} className="text-emerald-600" />
        </div>
        <div className="text-xl font-black text-emerald-600">
          {metrics.activeSubscriptions}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          of {metrics.totalSubscriptions} Total
        </div>
      </Card>

      {/* Trialing Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
          <span className="font-semibold">Trialing</span>
          <Clock size={14} className="text-indigo-600" />
        </div>
        <div className="text-xl font-black text-indigo-600">
          {metrics.trialingSubscriptions}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          Active Trials
        </div>
      </Card>

      {/* Paused Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
          <span className="font-semibold">Paused</span>
          <PauseCircle size={14} className="text-amber-600" />
        </div>
        <div className="text-xl font-black text-amber-600">
          {metrics.pausedSubscriptions}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          Temporarily Paused
        </div>
      </Card>

      {/* Cancelled Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
          <span className="font-semibold">Cancelled</span>
          <XCircle size={14} className="text-rose-600" />
        </div>
        <div className="text-xl font-black text-rose-600">
          {metrics.cancelledSubscriptions}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          Terminated
        </div>
      </Card>
    </div>
  );
}

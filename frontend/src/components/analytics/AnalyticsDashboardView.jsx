import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { 
  getOverviewMetrics, 
  getRevenueMetrics, 
  getPlanPerformance, 
  getPaymentMetrics, 
  downloadReportCsv 
} from '../../analyticsApi';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  RotateCw, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  PieChart, 
  BarChart2, 
  Percent, 
  ArrowUpRight 
} from 'lucide-react';

export function AnalyticsDashboardView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'revenue' | 'plans' | 'payments' | 'export'
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const [ovRes, revRes, plRes, payRes] = await Promise.all([
      getOverviewMetrics(product.id),
      getRevenueMetrics(product.id),
      getPlanPerformance(product.id),
      getPaymentMetrics(product.id),
    ]);

    if (ovRes.ok) setOverview(ovRes.data);
    if (revRes.ok) setRevenue(revRes.data);
    if (plRes.ok && Array.isArray(plRes.data)) setPlans(plRes.data);
    if (payRes.ok) setPayments(payRes.data);

    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (reportType) => {
    setExportingType(reportType);
    try {
      await downloadReportCsv(product.id, reportType);
      if (onTriggerToast) {
        onTriggerToast('success', 'Report Exported', `Downloaded ${reportType} CSV export.`);
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('error', 'Export Failed', err.message);
      }
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Analytics & Financial Intelligence</h3>
            <Badge variant="primary" size="sm">PHASE 8</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MRR, ARR, subscriber retention, plan performance, and exportable business reports for <strong>{product.name}</strong>.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData}>
          <RotateCw size={13} className="mr-1.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Navigation Subtabs */}
      <div className="border-b border-slate-200">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Executive Overview', icon: <TrendingUp size={14} /> },
            { id: 'revenue', label: 'Revenue & MRR', icon: <DollarSign size={14} /> },
            { id: 'plans', label: 'Plan Performance', icon: <Layers size={14} /> },
            { id: 'payments', label: 'Payment Reliability', icon: <CreditCard size={14} /> },
            { id: 'export', label: 'Export Reports (CSV)', icon: <Download size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* View 1: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Recurring (MRR)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${overview ? parseFloat(overview.mrr || 0).toFixed(2) : '0.00'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>Annual Run-Rate: ${overview ? parseFloat(overview.arr || 0).toFixed(2) : '0.00'}</span>
              </div>
            </Card>

            <Card className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Collected Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${overview ? parseFloat(overview.netRevenue || 0).toFixed(2) : '0.00'}
              </div>
              <div className="text-[11px] text-slate-400">
                Refunds: -${overview ? parseFloat(overview.totalRefunded || 0).toFixed(2) : '0.00'}
              </div>
            </Card>

            <Card className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Subscriptions</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overview ? overview.activeSubscriptions : 0}
              </div>
              <div className="text-[11px] text-slate-500">
                Total Subscriptions: {overview ? overview.totalSubscriptions : 0}
              </div>
            </Card>

            <Card className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Churn Rate</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Percent size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overview ? overview.churnRate : 0}%
              </div>
              <div className="text-[11px] text-slate-500">
                Trial Conversion: {overview ? overview.trialConversionRate : 0}%
              </div>
            </Card>
          </div>

          {/* Subscriptions Status Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-white space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subscription Status Distribution</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="font-bold text-emerald-800">Active Subscriptions</span>
                  <span className="font-mono font-black text-emerald-900">{overview ? overview.activeSubscriptions : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <span className="font-bold text-indigo-800">Trialing Subscriptions</span>
                  <span className="font-mono font-black text-indigo-900">{overview ? overview.trialingSubscriptions : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                  <span className="font-bold text-amber-800">Paused Subscriptions</span>
                  <span className="font-mono font-black text-amber-900">{overview ? overview.pausedSubscriptions : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <span className="font-bold text-rose-800">Cancelled Subscriptions</span>
                  <span className="font-mono font-black text-rose-900">{overview ? overview.cancelledSubscriptions : 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gateway & Customer Ratios</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Payment Gateway Success Rate</span>
                  <span className="font-mono font-black text-emerald-600">{overview ? overview.paymentSuccessRate : 100}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Total Registered Customers</span>
                  <span className="font-mono font-black text-slate-900">{overview ? overview.totalCustomers : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Active Customers with Subscriptions</span>
                  <span className="font-mono font-black text-slate-900">{overview ? overview.activeCustomers : 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700">Failed Charge Attempts</span>
                  <span className="font-mono font-black text-rose-600">{overview ? overview.failedPayments : 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* View 2: Revenue & MRR */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Processed Volume</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                ${revenue ? parseFloat(revenue.grossCollected || 0).toFixed(2) : '0.00'}
              </div>
            </Card>
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Refunded Volume</span>
              <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                -${revenue ? parseFloat(revenue.totalRefunded || 0).toFixed(2) : '0.00'}
              </div>
            </Card>
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Retained Revenue</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                ${revenue ? parseFloat(revenue.netRevenue || 0).toFixed(2) : '0.00'}
              </div>
            </Card>
          </div>

          {/* MRR by Plan Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-slate-900">MRR Contribution by Plan</h4>
            {revenue && revenue.mrrByPlan && Object.keys(revenue.mrrByPlan).length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {Object.entries(revenue.mrrByPlan).map(([planName, amount]) => (
                  <div key={planName} className="py-3 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{planName}</span>
                    <span className="font-mono font-black text-indigo-600">${parseFloat(amount).toFixed(2)}/mo</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active subscriptions currently generating recurring revenue.
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 3: Plan Performance */}
      {activeTab === 'plans' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Pricing Plan Comparative Performance</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of subscriber counts, plan MRR generation, and churn per pricing plan tier.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Active Subs</th>
                  <th className="py-3 px-4">Trialing</th>
                  <th className="py-3 px-4">Cancelled</th>
                  <th className="py-3 px-4">Plan MRR</th>
                  <th className="py-3 px-4">Churn Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((p) => (
                  <tr key={p.planId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.planName}</td>
                    <td className="py-3 px-4 font-mono">${parseFloat(p.price).toFixed(2)} {p.currency}/{p.billingInterval.toLowerCase()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 font-mono">{p.activeSubscribers}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600">{p.trialingSubscribers}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{p.cancelledSubscribers}</td>
                    <td className="py-3 px-4 font-mono font-black text-indigo-600">${parseFloat(p.planMrr).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">{p.churnRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 4: Payment Reliability */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{payments ? payments.totalPayments : 0}</div>
            </Card>
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Successful Charges</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{payments ? payments.succeededCount : 0}</div>
            </Card>
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Declined / Failed</span>
              <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{payments ? payments.failedCount : 0}</div>
            </Card>
            <Card className="p-5 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Success Rate</span>
              <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">{payments ? payments.successRate : 100}%</div>
            </Card>
          </div>

          {/* Failure Reasons Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-slate-900">Decline & Failure Breakdown</h4>
            {payments && payments.failureReasons && Object.keys(payments.failureReasons).length > 0 ? (
              <div className="space-y-2 text-xs">
                {Object.entries(payments.failureReasons).map(([code, count]) => (
                  <div key={code} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex justify-between">
                    <span className="font-mono font-bold text-rose-800">{code}</span>
                    <span className="font-mono font-black text-rose-900">{count} occurrences</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No failed payments recorded. 100% gateway transaction success.
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 5: Export Reports */}
      {activeTab === 'export' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h4 className="text-base font-bold text-slate-900">Download Official CSV Business Reports</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Export complete datasets for accounting, auditing, cohort analysis, and external BI tool integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'customers', title: 'Customers Report', desc: 'Customer registry with contact details, active statuses, and creation dates.' },
              { id: 'subscriptions', title: 'Subscriptions Report', desc: 'Complete subscription lifecycle, plan snapshots, prices, and renewal periods.' },
              { id: 'payments', title: 'Payments & Transactions', desc: 'Settled payments, provider transaction IDs, refunds, and failure codes.' },
              { id: 'usage', title: 'Feature Usage Telemetry', desc: 'Granular consumption logs with idempotency keys and timestamps.' },
            ].map((rep) => (
              <Card key={rep.id} className="p-5 flex items-start justify-between gap-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{rep.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{rep.desc}</p>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  loading={exportingType === rep.id}
                  onClick={() => handleExport(rep.id)}
                  className="shrink-0"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

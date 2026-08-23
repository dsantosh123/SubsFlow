import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCw, 
  Box, 
  Users, 
  CreditCard, 
  Receipt, 
  Activity,
  Layers,
  Calendar,
  Mail,
  User
} from 'lucide-react';
import { getTenantDetail, updateTenantStatus, getAuditLogs, getTenantSupportOverview } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';
import './AdminTenantDetail.css';

export default function AdminTenantDetail({ tenantId, onBack, addLog, onTriggerToast }) {
  const [tenant, setTenant] = useState(null);
  const [supportData, setSupportData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // null | 'ACTIVE' | 'SUSPENDED'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'customers' | 'subscriptions' | 'payments' | 'audit'

  const fetchData = async () => {
    setLoading(true);
    const [tenantRes, logsRes, supRes] = await Promise.all([
      getTenantDetail(tenantId),
      getAuditLogs(),
      getTenantSupportOverview(tenantId),
    ]);

    if (tenantRes.ok) {
      setTenant(tenantRes.data);
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Detail Query Failed', `Failed to load tenant record ${tenantId}`);
      if (onBack) onBack();
    }

    if (supRes.ok) {
      setSupportData(supRes.data);
    }

    if (logsRes.ok && Array.isArray(logsRes.data)) {
      setLogs(logsRes.data.filter((log) => log.targetId === tenantId));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const targetStatus = confirmAction;
    setConfirmAction(null);

    const res = await updateTenantStatus(tenantId, targetStatus);
    if (res.ok) {
      setTenant(res.data);
      if (onTriggerToast) {
        onTriggerToast(
          targetStatus === 'ACTIVE' ? 'success' : 'warning',
          targetStatus === 'ACTIVE' ? 'Tenant Activated' : 'Tenant Suspended',
          `Tenant ${res.data.name} status updated successfully.`
        );
      }
      fetchData();
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Operation Failed', res.data?.error || 'Failed to update tenant status.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw size={24} className="text-cyber-rose animate-spin" />
        <span className="text-xs font-medium text-slate-400">Loading tenant support overview…</span>
      </div>
    );
  }

  const isSuspended = tenant?.status === 'SUSPENDED';

  return (
    <div className="admin-detail-container space-y-6">
      {/* Header Bar */}
      <div className="admin-detail-header flex items-center justify-between">
        <button className="admin-detail-back-btn cursor-pointer flex items-center gap-1.5 text-xs text-slate-400 hover:text-white" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to tenants</span>
        </button>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          TENANT SUPPORT & OPERATIONS VIEW
        </span>
      </div>

      {/* Top Banner Card */}
      <TiltCard3D glowColor={isSuspended ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)'} depth={3}>
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">{tenant?.name}</h2>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${isSuspended ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {tenant?.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><User size={14} className="text-slate-500" /> {tenant?.ownerName || 'Unknown Owner'}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-500" /> {tenant?.contactEmail || 'No Email'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-500" /> Created: {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSuspended ? (
              <button
                disabled={actionLoading}
                onClick={() => setConfirmAction('ACTIVE')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={14} />
                <span>Reactivate Tenant</span>
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={() => setConfirmAction('SUSPENDED')}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Pause size={14} />
                <span>Suspend Tenant</span>
              </button>
            )}
          </div>
        </div>
      </TiltCard3D>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3 text-xs">
        {[
          { id: 'overview', label: 'Support Overview', icon: Activity },
          { id: 'products', label: `Products (${supportData?.productsCount || 0})`, icon: Box },
          { id: 'customers', label: `Customers (${supportData?.customersCount || 0})`, icon: Users },
          { id: 'subscriptions', label: `Subscriptions (${supportData?.subscriptionsCount || 0})`, icon: CreditCard },
          { id: 'payments', label: `Payments (${supportData?.paymentsCount || 0})`, icon: Receipt },
          { id: 'audit', label: `Audit Trail (${logs.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/30'
                  : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View 1: Support Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Products</span>
            <div className="text-2xl font-black text-white">{supportData?.productsCount || 0}</div>
          </div>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Base</span>
            <div className="text-2xl font-black text-emerald-400">{supportData?.customersCount || 0}</div>
          </div>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Subscriptions</span>
            <div className="text-2xl font-black text-indigo-400">{supportData?.subscriptionsCount || 0}</div>
          </div>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed Payments</span>
            <div className="text-2xl font-black text-cyan-400">{supportData?.paymentsCount || 0}</div>
          </div>
        </div>
      )}

      {/* View 2: Products & Plans */}
      {activeTab === 'products' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {(supportData?.products || []).map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px]">{p.status}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View 3: Customers */}
      {activeTab === 'customers' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {(supportData?.customers || []).map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-4 text-slate-400">{c.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">{c.status}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View 4: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Price</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {(supportData?.subscriptions || []).map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono text-slate-400">{s.id}</td>
                  <td className="py-3 px-4 font-bold text-white">{s.customerName}</td>
                  <td className="py-3 px-4 text-indigo-400">${s.price} {s.currency}/{s.interval?.toLowerCase()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px]">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View 5: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {(supportData?.payments || []).map((pay) => (
                <tr key={pay.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono text-slate-400">{pay.id}</td>
                  <td className="py-3 px-4 font-bold text-white">${pay.amount} {pay.currency}</td>
                  <td className="py-3 px-4">{pay.customerName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${pay.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Admin Operator</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-cyber-rose">{l.action}</td>
                  <td className="py-3 px-4 text-slate-300">{l.adminEmail}</td>
                  <td className="py-3 px-4 text-slate-200">{l.details}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-cyber-rose" size={24} />
              <h3 className="text-sm font-bold text-white">
                {confirmAction === 'ACTIVE' ? 'Activate Tenant?' : 'Suspend Tenant Service?'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Are you sure you want to change the status of <strong>{tenant?.name}</strong> to <strong>{confirmAction}</strong>? This action will be audited.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 rounded-xl bg-cyber-rose/20 text-cyber-rose hover:bg-cyber-rose/30 border border-cyber-rose/30 text-xs font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

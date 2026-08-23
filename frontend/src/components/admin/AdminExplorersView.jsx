import React, { useState, useEffect, useCallback } from 'react';
import { Box, Users, CreditCard, Receipt, Download, RotateCw, Loader2, FileSpreadsheet } from 'lucide-react';
import { 
  listAllProducts, 
  listAllCustomers, 
  listAllSubscriptions, 
  listAllPayments, 
  downloadAdminReportCsv 
} from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminExplorersView({ onSelectTenant, onTriggerToast }) {
  const [activeSubTab, setActiveSubTab] = useState('products'); // 'products' | 'customers' | 'subscriptions' | 'payments' | 'exports'
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [prodRes, custRes, subRes, payRes] = await Promise.all([
      listAllProducts(),
      listAllCustomers(),
      listAllSubscriptions(),
      listAllPayments(),
    ]);

    if (prodRes.ok && Array.isArray(prodRes.data)) setProducts(prodRes.data);
    if (custRes.ok && Array.isArray(custRes.data)) setCustomers(custRes.data);
    if (subRes.ok && Array.isArray(subRes.data)) setSubscriptions(subRes.data);
    if (payRes.ok && Array.isArray(payRes.data)) setPayments(payRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (reportType) => {
    setExporting(reportType);
    try {
      await downloadAdminReportCsv(reportType);
      onTriggerToast('success', 'Report Exported', `Downloaded platform ${reportType} CSV export.`);
    } catch (err) {
      onTriggerToast('error', 'Export Failed', err.message);
    } finally {
      setExporting(null);
    }
  };

  const tabs = [
    { id: 'products', label: 'Products', count: products.length, icon: Box },
    { id: 'customers', label: 'Customers', count: customers.length, icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length, icon: CreditCard },
    { id: 'payments', label: 'Billing Ledger', count: payments.length, icon: Receipt },
    { id: 'exports', label: 'Platform Reports (CSV)', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Entities Explorer</h2>
          <p className="text-xs text-gray-500 font-mono">
            Global cross-tenant registries for product catalogs, customer bases, subscriptions, and transaction ledgers.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Explorer Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/30'
                  : 'text-gray-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/[0.06] text-[10px]">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Products */}
      {activeSubTab === 'products' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Tenant Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectTenant(p.tenantId)}
                      className="text-cyber-cyan hover:underline cursor-pointer"
                    >
                      {p.tenantName}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-gray-300">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Customers */}
      {activeSubTab === 'customers' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-4 text-gray-400">{c.email}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectTenant(c.tenantId)}
                      className="text-cyber-cyan hover:underline cursor-pointer"
                    >
                      {c.tenantName}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{c.productName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Subscriptions */}
      {activeSubTab === 'subscriptions' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Price</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{s.customerName}</span>
                    <span className="text-[10px] text-gray-500">{s.customerEmail}</span>
                  </td>
                  <td className="py-3 px-4 text-indigo-400">
                    {s.planName} (${s.price} {s.currency}/{s.interval.toLowerCase()})
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectTenant(s.tenantId)}
                      className="text-cyber-cyan hover:underline cursor-pointer"
                    >
                      {s.tenantName}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.05] text-gray-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Billing Payments */}
      {activeSubTab === 'payments' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Provider Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">${p.amount} {p.currency}</td>
                  <td className="py-3 px-4">{p.customerName}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectTenant(p.tenantId)}
                      className="text-cyber-cyan hover:underline cursor-pointer"
                    >
                      {p.tenantName}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-[11px] truncate max-w-[140px]" title={p.providerPaymentId}>
                    {p.providerPaymentId || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${p.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Platform CSV Exports */}
      {activeSubTab === 'exports' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'tenants', title: 'Tenants Directory CSV', desc: 'All registered platform tenants with owner contacts and operational statuses.' },
            { id: 'customers', title: 'Customers Registry CSV', desc: 'Full cross-tenant customer database with product mappings.' },
            { id: 'subscriptions', title: 'Subscriptions Master CSV', desc: 'Active, trialing, and historical subscriptions with plan snapshots.' },
            { id: 'payments', title: 'Payment Ledger CSV', desc: 'Complete gateway settlements, refunds, and decline reason codes.' },
            { id: 'audit-logs', title: 'Platform Audit Log CSV', desc: 'Chronological security, administrative, and tenant state change trail.' },
          ].map((rep) => (
            <TiltCard3D key={rep.id} glowColor="rgba(244, 63, 94, 0.1)" depth={3}>
              <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyber-rose/10 border border-cyber-rose/20 text-cyber-rose flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{rep.title}</h5>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">{rep.desc}</p>
                  </div>
                </div>

                <button
                  disabled={exporting === rep.id}
                  onClick={() => handleExport(rep.id)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {exporting === rep.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>Export</span>
                </button>
              </div>
            </TiltCard3D>
          ))}
        </div>
      )}
    </div>
  );
}

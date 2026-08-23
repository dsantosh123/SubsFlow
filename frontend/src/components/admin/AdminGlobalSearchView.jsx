import React, { useState } from 'react';
import { Search, Building, Box, Users, CreditCard, Receipt, Loader2, ArrowRight } from 'lucide-react';
import { globalAdminSearch } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminGlobalSearchView({ onSelectTenant, onTriggerToast }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setLoading(true);
    const res = await globalAdminSearch(query);
    if (res.ok) {
      setResults(res.data);
    } else {
      onTriggerToast('error', 'Search Failed', res.data?.error || 'Could not perform global search');
    }
    setLoading(false);
  };

  const totalResults = results
    ? (results.tenants?.length || 0) +
      (results.products?.length || 0) +
      (results.customers?.length || 0) +
      (results.subscriptions?.length || 0) +
      (results.payments?.length || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Global Search</h2>
        <p className="text-xs text-gray-500 font-mono">
          Universal cross-tenant index searching Tenants, Products, Customers, Subscriptions, and Payments.
        </p>
      </div>

      {/* Search Input Bar */}
      <TiltCard3D glowColor="rgba(244, 63, 94, 0.15)" depth={2}>
        <form onSubmit={handleSearch} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tenant name, product slug, customer email, subscription ID, or payment ref…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-rose/50 font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="px-5 py-2.5 rounded-xl bg-cyber-rose/15 hover:bg-cyber-rose/25 text-cyber-rose border border-cyber-rose/30 text-xs font-bold font-mono flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span>Query Platform</span>
          </button>
        </form>
      </TiltCard3D>

      {/* Results View */}
      {results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">
              Found <strong className="text-white">{totalResults}</strong> matches for query <code className="text-cyber-cyan">"{results.query}"</code>
            </span>
          </div>

          {/* Tenants Section */}
          {results.tenants && results.tenants.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Building size={14} className="text-purple-400" />
                <span>Tenants ({results.tenants.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.tenants.map((t) => (
                  <div key={t.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between hover:border-purple-500/30 transition-colors">
                    <div>
                      <span className="font-bold text-white text-xs block">{t.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{t.contactEmail || t.id}</span>
                    </div>
                    <button
                      onClick={() => onSelectTenant(t.id)}
                      className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono hover:bg-purple-500/20 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Tenant</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results.products && results.products.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Box size={14} className="text-indigo-400" />
                <span>Products ({results.products.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.products.map((p) => (
                  <div key={p.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">{p.name}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Tenant: {p.tenantName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-gray-400 text-[10px] font-mono">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {results.customers && results.customers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-emerald-400" />
                <span>Customers ({results.customers.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.customers.map((c) => (
                  <div key={c.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{c.email}</span>
                      <span className="text-[9px] text-gray-500 font-mono block mt-0.5">Tenant: {c.tenantName} • Product: {c.productName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions Section */}
          {results.subscriptions && results.subscriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} className="text-cyan-400" />
                <span>Subscriptions ({results.subscriptions.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.subscriptions.map((s) => (
                  <div key={s.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">{s.customerName} ({s.planName})</span>
                      <span className="text-[10px] text-gray-400 font-mono">{s.id}</span>
                      <span className="text-[9px] text-gray-500 font-mono block mt-0.5">Tenant: {s.tenantName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Section */}
          {results.payments && results.payments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Receipt size={14} className="text-amber-400" />
                <span>Payments ({results.payments.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.payments.map((pay) => (
                  <div key={pay.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">${pay.amount} {pay.currency}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{pay.customerName}</span>
                      <span className="text-[9px] text-gray-500 font-mono block mt-0.5">Tenant: {pay.tenantName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${pay.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {pay.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="p-12 text-center bg-white/[0.01] border border-white/[0.04] rounded-2xl">
              <p className="text-xs font-mono text-gray-500">No records found matching query "{results.query}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

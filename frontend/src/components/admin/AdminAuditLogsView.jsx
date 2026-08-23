import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RotateCw, Search, Download } from 'lucide-react';
import { getAuditLogs, downloadAdminReportCsv } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminAuditLogsView({ onTriggerToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const res = await getAuditLogs();
    if (res.ok && Array.isArray(res.data)) {
      setLogs(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      l.action?.toLowerCase().includes(f) ||
      l.adminEmail?.toLowerCase().includes(f) ||
      l.targetId?.toLowerCase().includes(f) ||
      l.details?.toLowerCase().includes(f)
    );
  });

  const getActionBadgeClass = (action) => {
    if (action.includes('SUSPEND')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (action.includes('ACTIVATE')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (action.includes('CREATE')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Audit Trail</h2>
          <p className="text-xs text-gray-500 font-mono">
            Immutable chronological record of administrative actions, lifecycle updates, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => downloadAdminReportCsv('audit-logs')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyber-rose/15 hover:bg-cyber-rose/25 text-cyber-rose border border-cyber-rose/30 transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter audit logs by action, admin email, target ID, or keyword…"
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-gray-500">
            No audit records matching filter criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Admin Operator</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-gray-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyber-cyan font-bold">{log.targetId}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{log.adminEmail}</span>
                    <span className="text-[9px] text-gray-500">ID: {log.adminId}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-[280px] truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

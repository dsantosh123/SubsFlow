import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { getDashboardStats, getAuditLogs } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';
import './AdminDashboard.css';

export default function AdminDashboard({ addLog, onTriggerToast, onSelectTenant }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const [statsRes, logsRes] = await Promise.all([
      getDashboardStats(),
      getAuditLogs(),
    ]);

    // Log telemetry
    if (statsRes.meta) addLog({ method: statsRes.meta.method, url: statsRes.meta.url, status: statsRes.status, elapsed: statsRes.meta.elapsed });
    if (logsRes.meta) addLog({ method: logsRes.meta.method, url: logsRes.meta.url, status: logsRes.status, elapsed: logsRes.meta.elapsed });

    if (statsRes.ok) setStats(statsRes.data);
    if (logsRes.ok) setLogs(logsRes.data.slice(0, 15)); // show top 15

    if (!statsRes.ok || !logsRes.ok) {
      onTriggerToast('error', 'Dashboard Error', 'Failed to retrieve platform analytics.');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActionBadgeClass = (action) => {
    if (action.includes('SUSPEND')) return 'suspend';
    if (action.includes('ACTIVATE')) return 'activate';
    return 'login';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw size={24} className="text-cyber-rose animate-spin" />
        <span className="text-xs font-mono text-gray-500">Querying global registry…</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tenants',
      val: stats?.totalTenants ?? 0,
      icon: Users,
      color: '#8b5cf6', // Violet
      bgColor: 'rgba(139, 92, 246, 0.12)',
      borderCol: 'rgba(139, 92, 246, 0.25)',
      trend: 'Registered on platform'
    },
    {
      label: 'Active Tenants',
      val: stats?.activeTenants ?? 0,
      icon: UserCheck,
      color: '#10b981', // Emerald
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderCol: 'rgba(16, 185, 129, 0.25)',
      trend: 'Provisioned and running'
    },
    {
      label: 'Suspended Tenants',
      val: stats?.suspendedTenants ?? 0,
      icon: UserX,
      color: '#f43f5e', // Rose
      bgColor: 'rgba(244, 63, 94, 0.12)',
      borderCol: 'rgba(244, 63, 94, 0.25)',
      trend: 'Service block enforced'
    },
    {
      label: 'New Tenants (30d)',
      val: stats?.newTenants ?? 0,
      icon: UserPlus,
      color: '#06b6d4', // Cyan
      bgColor: 'rgba(6, 182, 212, 0.12)',
      borderCol: 'rgba(6, 182, 212, 0.25)',
      trend: 'Onboarded in last month'
    }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Ops Center</h2>
          <p className="text-xs text-gray-500 font-mono">Telemetry, provisioning & operational logs</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white
                     transition-all duration-200"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing…' : 'Sync'}</span>
        </button>
      </div>

      {/* Grid of stats */}
      <div className="admin-stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <TiltCard3D key={i} glowColor={`${card.color}25`} depth={6} className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">{card.label}</span>
                <div
                  className="admin-stat-icon-wrapper"
                  style={{
                    backgroundColor: card.bgColor,
                    border: `1px solid ${card.borderCol}`,
                    color: card.color
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="admin-stat-val">{card.val}</div>
              <div className="admin-stat-trend">
                <Clock size={10} />
                <span>{card.trend}</span>
              </div>
            </TiltCard3D>
          );
        })}
      </div>

      {/* Audit Log Panel */}
      <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={4}>
        <div className="admin-activity-panel">
          <div className="admin-panel-title-bar">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-cyber-rose" />
              <h3>Recent Security & Admin Operations</h3>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Live feed</span>
          </div>

          <div className="admin-table-wrapper">
            {logs.length === 0 ? (
              <div className="admin-table-empty">No administrator activities recorded.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Target Tenant</th>
                    <th>Operator</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`admin-badge-action ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectTenant(log.targetId)}
                          className="font-mono text-cyber-cyan hover:underline text-left cursor-pointer"
                        >
                          {log.targetId}
                        </button>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-300">{log.adminEmail}</span>
                          <span className="text-[10px] text-gray-600 font-mono">ID: {log.adminId}</span>
                        </div>
                      </td>
                      <td className="text-gray-400 font-mono max-w-[250px] truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </TiltCard3D>
    </div>
  );
}

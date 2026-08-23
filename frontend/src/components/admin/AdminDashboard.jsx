import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, ShieldAlert, Clock, RefreshCw, Send, Activity, Bell, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getAuditLogs } from '../../adminApi';
import { getAdminMonitoringStats } from '../../eventsApi';
import TiltCard3D from '../3d/TiltCard3D';
import './AdminDashboard.css';

export default function AdminDashboard({ addLog, onTriggerToast, onSelectTenant }) {
  const [stats, setStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const [statsRes, logsRes, monRes] = await Promise.all([
      getDashboardStats(),
      getAuditLogs(),
      getAdminMonitoringStats(),
    ]);

    // Log telemetry
    if (statsRes.meta && addLog) addLog({ method: statsRes.meta.method, url: statsRes.meta.url, status: statsRes.status, elapsed: statsRes.meta.elapsed });
    if (logsRes.meta && addLog) addLog({ method: logsRes.meta.method, url: logsRes.meta.url, status: logsRes.status, elapsed: logsRes.meta.elapsed });

    if (statsRes.ok) setStats(statsRes.data);
    if (logsRes.ok) setLogs(logsRes.data.slice(0, 15)); // show top 15
    if (monRes.ok) setEventStats(monRes.data);

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
        <span className="text-xs font-medium text-slate-400">Querying global platform registry…</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tenants',
      val: stats?.totalTenants ?? 0,
      icon: Users,
      color: '#a78bfa', // Bright Violet
      bgColor: 'rgba(167, 139, 250, 0.15)',
      borderCol: 'rgba(167, 139, 250, 0.3)',
      trend: 'Registered on platform'
    },
    {
      label: 'Active Tenants',
      val: stats?.activeTenants ?? 0,
      icon: UserCheck,
      color: '#34d399', // Bright Emerald
      bgColor: 'rgba(52, 211, 153, 0.15)',
      borderCol: 'rgba(52, 211, 153, 0.3)',
      trend: 'Provisioned and running'
    },
    {
      label: 'Suspended Tenants',
      val: stats?.suspendedTenants ?? 0,
      icon: UserX,
      color: '#fb7185', // Bright Rose
      bgColor: 'rgba(251, 113, 133, 0.15)',
      borderCol: 'rgba(251, 113, 133, 0.3)',
      trend: 'Service block enforced'
    },
    {
      label: 'New Tenants (30d)',
      val: stats?.newTenants ?? 0,
      icon: UserPlus,
      color: '#22d3ee', // Bright Cyan
      bgColor: 'rgba(34, 211, 238, 0.15)',
      borderCol: 'rgba(34, 211, 238, 0.3)',
      trend: 'Onboarded in last month'
    }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Ops Center</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Platform telemetry, provisioning & operational audit stream</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white
                     hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-cyber-rose' : ''} />
          <span>{refreshing ? 'Syncing…' : 'Sync'}</span>
        </button>
      </div>

      {/* Grid of stats */}
      <div className="admin-stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <TiltCard3D key={i} glowColor={`${card.color}30`} depth={4} className="admin-stat-card">
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
                <Clock size={12} className="text-slate-500" />
                <span>{card.trend}</span>
              </div>
            </TiltCard3D>
          );
        })}
      </div>

      {/* Event Operations & Webhook Deliveries Telemetry */}
      {eventStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Send size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Webhook Deliveries</span>
              <span className="text-base font-extrabold text-white">{eventStats.totalWebhookDeliveries || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Delivery Failures</span>
              <span className="text-base font-extrabold text-rose-400">{eventStats.failedDeliveries || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Usage Events</span>
              <span className="text-base font-extrabold text-emerald-400">{eventStats.totalUsageEvents || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Notifications</span>
              <span className="text-base font-extrabold text-purple-400">{eventStats.totalNotifications || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Panel */}
      <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={3}>
        <div className="admin-activity-panel">
          <div className="admin-panel-title-bar">
            <div className="flex items-center gap-2">
              <ShieldAlert size={17} className="text-cyber-rose" />
              <h3>Recent Security & Admin Operations</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live feed</span>
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
                          className="font-mono text-cyan-400 hover:text-cyan-300 hover:underline text-left cursor-pointer font-bold"
                        >
                          {log.targetId}
                        </button>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{log.adminEmail}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {log.adminId}</span>
                        </div>
                      </td>
                      <td className="text-slate-300 max-w-[250px] truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="text-slate-400 font-mono">
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

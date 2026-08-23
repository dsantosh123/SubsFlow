import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';
import { getTenantDetail, updateTenantStatus, getAuditLogs } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';
import './AdminTenantDetail.css';

export default function AdminTenantDetail({ tenantId, onBack, addLog, onTriggerToast }) {
  const [tenant, setTenant] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // null | 'ACTIVE' | 'SUSPENDED'

  const fetchData = async () => {
    setLoading(true);
    const [tenantRes, logsRes] = await Promise.all([
      getTenantDetail(tenantId),
      getAuditLogs(),
    ]);

    if (tenantRes.meta) addLog({ method: tenantRes.meta.method, url: tenantRes.meta.url, status: tenantRes.status, elapsed: tenantRes.meta.elapsed });
    if (logsRes.meta) addLog({ method: logsRes.meta.method, url: logsRes.meta.url, status: logsRes.status, elapsed: logsRes.meta.elapsed });

    if (tenantRes.ok) {
      setTenant(tenantRes.data);
    } else {
      onTriggerToast('error', 'Detail Query Failed', `Failed to load tenant record ${tenantId}`);
      onBack();
    }

    if (logsRes.ok) {
      // Filter logs affecting this specific tenant
      const tenantLogs = logsRes.data.filter((log) => log.targetId === tenantId);
      setLogs(tenantLogs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const targetStatus = confirmAction;
    setConfirmAction(null); // close modal

    const res = await updateTenantStatus(tenantId, targetStatus);
    if (res.meta) {
      addLog({
        method: res.meta.method,
        url: res.meta.url,
        status: res.status,
        elapsed: res.meta.elapsed,
      });
    }

    if (res.ok) {
      setTenant(res.data);
      onTriggerToast(
        targetStatus === 'ACTIVE' ? 'success' : 'warning',
        targetStatus === 'ACTIVE' ? 'Service Activated' : 'Service Suspended',
        `Tenant ${res.data.name} status updated successfully.`
      );
      // Reload logs to show new audit entry
      const logsRes = await getAuditLogs();
      if (logsRes.ok) {
        setLogs(logsRes.data.filter((log) => log.targetId === tenantId));
      }
    } else {
      onTriggerToast('error', 'Operation Failed', res.data?.error || 'Failed to update tenant status.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw size={24} className="text-cyber-rose animate-spin" />
        <span className="text-xs font-mono text-gray-500">Querying registry block…</span>
      </div>
    );
  }

  return (
    <div className="admin-detail-container">
      {/* Header bar */}
      <div className="admin-detail-header">
        <button className="admin-detail-back-btn cursor-pointer" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to list</span>
        </button>
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">TENANT CONTROLLER</span>
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* Left Side: Detail & History */}
        <div className="space-y-6">
          {/* Main Info */}
          <TiltCard3D glowColor={tenant?.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)'} depth={2}>
            <div className="admin-detail-panel">
              <h3 className="admin-detail-section-title">Organization Overview</h3>
              <div className="admin-fields-list">
                <div className="admin-field-row">
                  <span className="admin-field-label">Tenant ID</span>
                  <span className="admin-field-val code">{tenant.id}</span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Organization Name</span>
                  <span className="admin-field-val text-white font-bold text-sm">{tenant.name}</span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Primary Owner</span>
                  <span className="admin-field-val">{tenant.ownerName || '—'}</span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Contact Email</span>
                  <span className="admin-field-val font-mono">{tenant.contactEmail || '—'}</span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Status</span>
                  <span className={`tenant-badge-status ${tenant.status.toLowerCase()}`}>
                    {tenant.status}
                  </span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Primary API Key</span>
                  <span className="admin-field-val code">{tenant.apiKey}</span>
                </div>
                <div className="admin-field-row">
                  <span className="admin-field-label">Provisioned At</span>
                  <span className="admin-field-val font-mono text-gray-400">
                    {new Date(tenant.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </TiltCard3D>

          {/* Audit log for this tenant */}
          <TiltCard3D glowColor="rgba(244, 63, 94, 0.03)" depth={2}>
            <div className="admin-detail-panel">
              <h3 className="admin-detail-section-title">Audit History</h3>
              <div className="admin-table-wrapper">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono text-gray-500">
                    No admin actions recorded for this tenant.
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Operator</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className={`admin-badge-action ${log.action.includes('SUSPEND') ? 'suspend' : 'activate'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-300 font-semibold">{log.adminEmail}</span>
                          </td>
                          <td className="text-gray-400 font-mono text-xs">{log.details}</td>
                          <td className="text-gray-500 font-mono text-xs">
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

        {/* Right Side: Quick Actions Panel */}
        <div className="space-y-6">
          <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={4}>
            <div className="admin-actions-card">
              <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-cyber-rose" />
                <span>Service Controls</span>
              </h3>

              <div className="text-[11px] text-gray-500 leading-relaxed mb-2 font-mono">
                Suspension revokes API keys, intercepts JWT claims, and disables Webhook broadcasts. Activation restores service configuration and billing schedules.
              </div>

              {tenant.status === 'ACTIVE' ? (
                <button
                  onClick={() => setConfirmAction('SUSPENDED')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold
                             bg-cyber-rose/10 hover:bg-cyber-rose/25 text-cyber-rose border border-cyber-rose/30
                             transition-all duration-200 cursor-pointer"
                >
                  <Pause size={14} />
                  <span>Suspend Subscription</span>
                </button>
              ) : (
                <button
                  onClick={() => setConfirmAction('ACTIVE')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold
                             bg-cyber-emerald/10 hover:bg-cyber-emerald/25 text-cyber-emerald border border-cyber-emerald/30
                             transition-all duration-200 cursor-pointer"
                >
                  <Play size={14} />
                  <span>Activate Service</span>
                </button>
              )}
            </div>
          </TiltCard3D>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="flex items-center gap-2 text-cyber-rose mb-3">
              <AlertTriangle size={20} />
              <h4 className="admin-modal-title">
                {confirmAction === 'SUSPENDED' ? 'Confirm Service Suspension' : 'Confirm Service Activation'}
              </h4>
            </div>
            <p className="admin-modal-desc">
              Are you sure you want to {confirmAction === 'SUSPENDED' ? 'SUSPEND' : 'ACTIVATE'} the tenant{' '}
              <strong className="text-white font-bold">{tenant.name}</strong> ({tenantId})?
              {confirmAction === 'SUSPENDED'
                ? ' This operation will block all API calls and dashboard logins for this tenant immediately.'
                : ' This will restore all API routing and dashboard services.'}
            </p>
            <div className="admin-modal-footer">
              <button
                className="btn btn-secondary cursor-pointer"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn cursor-pointer ${confirmAction === 'SUSPENDED' ? 'btn-rose' : 'btn-emerald'}`}
                onClick={handleStatusChange}
                disabled={actionLoading}
              >
                {confirmAction === 'SUSPENDED' ? 'Yes, Suspend Tenant' : 'Yes, Activate Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

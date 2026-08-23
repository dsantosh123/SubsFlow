import React, { useState, useEffect, useCallback } from 'react';
import { Shield, UserPlus, Key, UserCheck, UserX, Loader2, RotateCw, Check, X } from 'lucide-react';
import { 
  listAdmins, 
  createAdmin, 
  updateAdminStatus, 
  updateAdminRole, 
  resetAdminPassword 
} from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminUsersView({ currentAdmin, onTriggerToast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null); // adminId | null

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'PLATFORM_ADMIN' });
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    const res = await listAdmins();
    if (res.ok && Array.isArray(res.data)) {
      setAdmins(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await createAdmin(formData);
    if (res.ok) {
      onTriggerToast('success', 'Admin Created', `Successfully provisioned internal admin ${formData.email}.`);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'PLATFORM_ADMIN' });
      loadAdmins();
    } else {
      onTriggerToast('error', 'Creation Failed', res.data?.error || 'Failed to create admin');
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const res = await updateAdminStatus(adminId, nextStatus);
    if (res.ok) {
      onTriggerToast('success', 'Status Updated', `Admin status set to ${nextStatus}.`);
      loadAdmins();
    } else {
      onTriggerToast('error', 'Update Failed', res.data?.error || 'Could not update status');
    }
  };

  const handleChangeRole = async (adminId, newRole) => {
    const res = await updateAdminRole(adminId, newRole);
    if (res.ok) {
      onTriggerToast('success', 'Role Updated', `Admin role set to ${newRole}.`);
      loadAdmins();
    } else {
      onTriggerToast('error', 'Update Failed', res.data?.error || 'Could not update role');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    setSubmitting(true);
    const res = await resetAdminPassword(showPasswordModal, newPassword);
    if (res.ok) {
      onTriggerToast('success', 'Password Reset', 'Admin password updated successfully.');
      setShowPasswordModal(null);
      setNewPassword('');
    } else {
      onTriggerToast('error', 'Reset Failed', res.data?.error || 'Failed to reset password');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Internal Platform Administrators</h2>
          <p className="text-xs text-gray-500 font-mono">
            Manage SubsFlow root operators, support leads, and RBAC permission delegations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdmins}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-cyber-rose/15 hover:bg-cyber-rose/25 text-cyber-rose border border-cyber-rose/30 transition-all cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Add Platform Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase text-[10px]">
              <th className="py-3 px-4">Admin Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-gray-300">
            {admins.map((a) => {
              const isSelf = currentAdmin?.id === a.id || currentAdmin?.email === a.email;
              return (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <span>{a.name}</span>
                    {isSelf && (
                      <span className="px-1.5 py-0.2 rounded bg-cyber-rose/15 text-cyber-rose text-[9px]">YOU</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{a.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={a.role}
                      disabled={isSelf}
                      onChange={(e) => handleChangeRole(a.id, e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none cursor-pointer"
                    >
                      <option value="PLATFORM_ADMIN" className="bg-slate-900 text-white">PLATFORM_ADMIN</option>
                      <option value="PLATFORM_SUPPORT" className="bg-slate-900 text-white">PLATFORM_SUPPORT</option>
                      <option value="PLATFORM_VIEWER" className="bg-slate-900 text-white">PLATFORM_VIEWER</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${a.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setShowPasswordModal(a.id)}
                      className="px-2 py-1 rounded bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.08] text-[10px] cursor-pointer"
                    >
                      Reset Password
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => handleToggleStatus(a.id, a.status)}
                        className={`px-2 py-1 rounded text-[10px] border cursor-pointer ${a.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                      >
                        {a.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/[0.1] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add Platform Administrator</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 font-mono block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@subsflow.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono block mb-1">Initial Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono block mb-1">Platform Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono cursor-pointer"
                >
                  <option value="PLATFORM_ADMIN" className="bg-slate-900 text-white">PLATFORM_ADMIN (Full Platform Authority)</option>
                  <option value="PLATFORM_SUPPORT" className="bg-slate-900 text-white">PLATFORM_SUPPORT (Support & Diagnostics)</option>
                  <option value="PLATFORM_VIEWER" className="bg-slate-900 text-white">PLATFORM_VIEWER (Read-Only Analytics)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyber-rose/20 text-cyber-rose hover:bg-cyber-rose/30 border border-cyber-rose/30 text-xs font-bold font-mono flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                  <span>Provision Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Reset Admin Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 font-mono block mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyber-rose/20 text-cyber-rose hover:bg-cyber-rose/30 border border-cyber-rose/30 text-xs font-bold font-mono"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

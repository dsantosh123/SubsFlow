import { useEffect, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { getCurrentUser } from '../../tenantAuthApi';
import TiltCard3D from '../3d/TiltCard3D';
import { Users, Shield, Key } from 'lucide-react';

export default function TenantDashboard({ addLog, onTriggerToast, onNavigateToTeam }) {
  const { tenantUserSession } = usePortal();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentUser();
      addLog({
        method: res.meta.method,
        url: res.meta.url,
        status: res.status,
        elapsed: res.meta.elapsed,
        body: res.data,
      });

      if (res.ok) {
        setProfile(res.data);
      } else {
        onTriggerToast('error', 'Error', 'Failed to retrieve profile info.');
      }
      setLoading(false);
    }
    loadProfile();
  }, [addLog, onTriggerToast]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-xl flex items-center justify-between border border-white/[0.06] bg-slate-900/50">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome back, {tenantUserSession?.name || 'User'}!</h1>
          <p className="text-xs text-gray-400 mt-1">
            You are logged into <span className="text-blue-400 font-bold">{tenantUserSession?.tenantName || 'Tenant'}</span> workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-mono font-bold">
            Role: {tenantUserSession?.role}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono font-bold">
            Status: Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Info Card */}
        <TiltCard3D glowColor="rgba(59, 130, 246, 0.1)" depth={6}>
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-white/[0.06] pb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              Workspace Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span className="text-gray-400">Company Name</span>
                <span className="text-white font-semibold">{tenantUserSession?.tenantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span className="text-gray-400">Workspace ID</span>
                <span className="text-white font-mono">{tenantUserSession?.tenantId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span className="text-gray-400">Contact Email</span>
                <span className="text-white">{tenantUserSession?.email}</span>
              </div>
              <div className="flex flex-col gap-1.5 py-1">
                <span className="text-gray-400">Admin API Key</span>
                <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded border border-white/[0.05]">
                  <Key size={12} className="text-yellow-500 flex-shrink-0" />
                  <span className="font-mono text-gray-300 select-all truncate text-[11px]">
                    {tenantUserSession?.apiKey}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TiltCard3D>

        {/* Shortcuts Card */}
        <TiltCard3D glowColor="rgba(16, 185, 129, 0.1)" depth={6}>
          <div className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-sm font-semibold text-white border-b border-white/[0.06] pb-2 flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                Team Management
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Invite colleagues to your workspace, manage roles (Admin / Developer), and configure access restrictions.
              </p>
            </div>
            <button
              onClick={onNavigateToTeam}
              className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2.5"
            >
              <Users size={14} />
              Manage Team Members
            </button>
          </div>
        </TiltCard3D>
      </div>
    </div>
  );
}

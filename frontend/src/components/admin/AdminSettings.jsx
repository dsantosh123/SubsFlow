import { Shield, User } from 'lucide-react';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminSettings({ admin }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">System Configuration</h2>
        <p className="text-xs text-gray-500 font-mono">Platform operations credentials and security policies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={4}>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-cyber-rose" />
              <span>Admin Profile Details</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 text-xs">
                <span className="text-gray-500 font-medium">Identifier</span>
                <span className="font-mono text-cyber-cyan">{admin?.adminId || admin?.id || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 text-xs">
                <span className="text-gray-500 font-medium">Administrator Name</span>
                <span className="text-white font-semibold">{admin?.name || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 text-xs">
                <span className="text-gray-500 font-medium">Email Address</span>
                <span className="font-mono text-white">{admin?.email || '—'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 text-xs">
                <span className="text-gray-500 font-medium">Assigned Role</span>
                <span className="px-2 py-0.5 rounded bg-cyber-rose/10 border border-cyber-rose/20 text-cyber-rose font-mono font-bold text-[10px]">
                  {admin?.role || 'ROLE_SUBSFLOW_ADMIN'}
                </span>
              </div>
            </div>
          </div>
        </TiltCard3D>

        <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={4}>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-cyber-rose" />
              <span>Security Policies</span>
            </h3>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-rose/50" />
                <span>JWT Authentication tokens expire after 24 hours.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-rose/50" />
                <span>All state mutations record structured audit trails.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-rose/50" />
                <span>Row Level Security (RLS) restricts cross-tenant queries.</span>
              </div>
            </div>
          </div>
        </TiltCard3D>
      </div>
    </div>
  );
}

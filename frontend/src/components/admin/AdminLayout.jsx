import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  Layers, 
  Send, 
  Activity, 
  ShieldAlert, 
  UserCheck, 
  Settings, 
  LogOut, 
  Radio, 
  Shield 
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminTenantsPage from './AdminTenantsPage';
import AdminGlobalSearchView from './AdminGlobalSearchView';
import AdminExplorersView from './AdminExplorersView';
import AdminWebhooksView from './AdminWebhooksView';
import AdminSystemHealthView from './AdminSystemHealthView';
import AdminAuditLogsView from './AdminAuditLogsView';
import AdminUsersView from './AdminUsersView';
import AdminSettings from './AdminSettings';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminLayout({ admin, onLogout, addLog, onTriggerToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenant Directory', icon: Users },
    { id: 'search', label: 'Platform Search', icon: Search },
    { id: 'explorers', label: 'Entities & Reports', icon: Layers },
    { id: 'webhooks', label: 'Webhook Deliveries', icon: Send },
    { id: 'health', label: 'System Health & Integrations', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'admins', label: 'Admin Users & RBAC', icon: UserCheck },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const handleSelectTenant = (id) => {
    setSelectedTenantId(id);
    setActiveTab('tenants');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard
            addLog={addLog}
            onTriggerToast={onTriggerToast}
            onSelectTenant={handleSelectTenant}
          />
        );
      case 'tenants':
        return (
          <AdminTenantsPage
            addLog={addLog}
            onTriggerToast={onTriggerToast}
            selectedTenantId={selectedTenantId}
            onClearSelectedTenant={() => setSelectedTenantId(null)}
          />
        );
      case 'search':
        return (
          <AdminGlobalSearchView
            onSelectTenant={handleSelectTenant}
            onTriggerToast={onTriggerToast}
          />
        );
      case 'explorers':
        return (
          <AdminExplorersView
            onSelectTenant={handleSelectTenant}
            onTriggerToast={onTriggerToast}
          />
        );
      case 'webhooks':
        return (
          <AdminWebhooksView
            onTriggerToast={onTriggerToast}
          />
        );
      case 'health':
        return (
          <AdminSystemHealthView
            onTriggerToast={onTriggerToast}
          />
        );
      case 'audit':
        return (
          <AdminAuditLogsView
            onTriggerToast={onTriggerToast}
          />
        );
      case 'admins':
        return (
          <AdminUsersView
            currentAdmin={admin}
            onTriggerToast={onTriggerToast}
          />
        );
      case 'settings':
        return (
          <AdminSettings
            admin={admin}
            onTriggerToast={onTriggerToast}
          />
        );
      default:
        return <AdminDashboard addLog={addLog} onTriggerToast={onTriggerToast} onSelectTenant={handleSelectTenant} />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] gap-6 mt-4">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0">
        <TiltCard3D glowColor="rgba(244, 63, 94, 0.15)" depth={4} className="h-full">
          <div className="p-5 flex flex-col justify-between h-full min-h-[600px] bg-slate-950/80 border border-white/[0.06] rounded-2xl">
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-cyber-rose/15 border border-cyber-rose/30 flex items-center justify-center text-cyber-rose font-bold text-xs">
                  {admin?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[140px]">
                    {admin?.name || 'System Admin'}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-cyber-rose/15 text-cyber-rose text-[9px] font-mono font-bold block mt-0.5 w-fit">
                    {admin?.role || 'PLATFORM_ADMIN'}
                  </span>
                </div>
              </div>

              {/* Sidebar Menu */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id && (item.id !== 'tenants' || !selectedTenantId);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id === 'tenants') {
                          setSelectedTenantId(null);
                        }
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                        transition-all duration-200 text-left font-mono cursor-pointer
                        ${isActive 
                          ? 'bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/30 shadow-[0_0_15px_rgba(244,63,94,0.08)]' 
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                        }
                      `}
                    >
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Status / Logout */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-cyber-rose" />
                  <span className="text-[10px] font-bold text-gray-400 font-mono">PLATFORM OPS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Radio size={10} className="text-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400
                           hover:text-cyber-rose hover:bg-cyber-rose/10 border border-transparent
                           hover:border-cyber-rose/20 transition-all duration-200 text-left font-mono cursor-pointer"
              >
                <LogOut size={15} />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        </TiltCard3D>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 min-w-0">
        {renderContent()}
      </main>
    </div>
  );
}

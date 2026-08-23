import { useState } from 'react';
import { LayoutDashboard, Users, Settings, ShieldAlert, LogOut, Radio } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminTenantsPage from './AdminTenantsPage';
import AdminSettings from './AdminSettings';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminLayout({ admin, onLogout, addLog, onTriggerToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTenant = (id) => {
    setSelectedTenantId(id);
    setActiveTab('tenants'); // switch tab if needed, details are shown inside TenantsPage
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
      case 'settings':
        return (
          <AdminSettings
            admin={admin}
            onTriggerToast={onTriggerToast}
          />
        );
      default:
        return <AdminDashboard addLog={addLog} onTriggerToast={onTriggerToast} />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] gap-6 mt-4">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0">
        <TiltCard3D glowColor="rgba(244, 63, 94, 0.15)" depth={4} className="h-full">
          <div className="p-5 flex flex-col justify-between h-full min-h-[500px]">
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-cyber-rose/15 border border-cyber-rose/30 flex items-center justify-center text-cyber-rose font-bold">
                  {admin?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[150px]">
                    {admin?.name || 'System Admin'}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                    {admin?.email || 'admin@subsflow.com'}
                  </p>
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
                          setSelectedTenantId(null); // clear selected tenant to show list
                        }
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold
                        transition-all duration-200 text-left
                        ${isActive 
                          ? 'bg-cyber-rose/10 text-cyber-rose border border-cyber-rose/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]' 
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                        }
                      `}
                    >
                      <Icon size={16} />
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
                  <ShieldAlert size={14} className="text-cyber-rose" />
                  <span className="text-[10px] font-bold text-gray-400 font-mono">SECURE MODE</span>
                </div>
                <div className="flex items-center gap-1">
                  <Radio size={10} className="text-cyber-rose animate-pulse" />
                  <span className="text-[9px] font-mono text-cyber-rose font-bold">OPS</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-gray-500
                           hover:text-cyber-rose hover:bg-cyber-rose/10 border border-transparent
                           hover:border-cyber-rose/20 transition-all duration-200 text-left"
              >
                <LogOut size={16} />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        </TiltCard3D>
      </aside>

      {/* Main Admin Tab Content Area */}
      <main className="flex-1 min-w-0">
        {renderContent()}
      </main>
    </div>
  );
}

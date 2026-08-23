import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Users, CreditCard, Settings, BarChart3 } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import SpatialCanvas3D from '../3d/SpatialCanvas3D';
import TiltCard3D from '../3d/TiltCard3D';
import TopbarHUD from './TopbarHUD';
import AdminLoginScreen from '../admin/AdminLoginScreen';
import AdminLayout from '../admin/AdminLayout';
import TenantDashboard from '../tenant/TenantDashboard';
import TeamManagement from '../tenant/TeamManagement';
import { clearStoredAdminAuth } from '../../adminApi';

/* ─────────────────────────────────────────────────────────
   Portal Content Panels — Placeholder views for non-Merchant
   ───────────────────────────────────────────────────────── */

function CustomerPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[
        { icon: CreditCard, title: 'My Subscription', desc: 'View active plan, usage stats, and billing cycle', color: '#06b6d4' },
        { icon: Layers, title: 'Invoice History', desc: 'Download itemized invoices and payment receipts', color: '#06b6d4' },
        { icon: Settings, title: 'Account Settings', desc: 'Update payment method, manage preferences', color: '#06b6d4' },
      ].map((card, i) => (
        <TiltCard3D key={i} glowColor={`${card.color}40`} depth={6}>
          <div className="p-6">
            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/15 flex items-center justify-center border border-cyber-cyan/20 mb-4">
              <card.icon size={20} className="text-cyber-cyan" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{card.title}</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">{card.desc}</p>
            <div className="mt-4 px-3 py-2 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/10 text-[11px] text-cyber-cyan/70 font-mono">
              Phase 2 — Customer self-service portal
            </div>
          </div>
        </TiltCard3D>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Animation Variants
   ───────────────────────────────────────────────────────── */
const contentVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

/* ─────────────────────────────────────────────────────────
   PortalLayout — Primary authenticated layout shell
   ───────────────────────────────────────────────────────── */
export default function PortalLayout({
  tenant,
  onLogout,
  children,       // Merchant dashboard content (Dashboard + ApiLog)
  addLog,
  showToast,
}) {
  const { activePortal, portal, adminSession, setAdminSession, clearAdminSession } = usePortal();
  const [tenantSubview, setTenantSubview] = useState('dashboard');

  const portalContent = useMemo(() => {
    switch (activePortal) {
      case 'SUPER_ADMIN':
        if (!adminSession) {
          return (
            <AdminLoginScreen
              onLogin={(adminData) => {
                setAdminSession(adminData);
                showToast('success', 'Operations Authentication Success', 'Access granted to Ops console.');
              }}
              addLog={addLog}
            />
          );
        }
        return (
          <AdminLayout
            admin={adminSession}
            onLogout={() => {
              clearStoredAdminAuth();
              clearAdminSession();
              showToast('info', 'Logged Out', 'Ops session terminated.');
            }}
            addLog={addLog}
            onTriggerToast={showToast}
          />
        );
      case 'CUSTOMER':
        return <CustomerPanel />;
      case 'TENANT_WORKSPACE':
        return tenantSubview === 'dashboard' ? (
          <TenantDashboard
            addLog={addLog}
            onTriggerToast={showToast}
            onNavigateToTeam={() => setTenantSubview('team')}
          />
        ) : (
          <TeamManagement
            addLog={addLog}
            onTriggerToast={showToast}
            onBack={() => setTenantSubview('dashboard')}
          />
        );
      case 'MERCHANT':
      default:
        return children; // Existing Dashboard + ApiLog components
    }
  }, [activePortal, children, adminSession, setAdminSession, clearAdminSession, addLog, showToast, tenantSubview]);

  return (
    <div className="relative min-h-screen">
      {/* Persistent 3D WebGL Background */}
      <SpatialCanvas3D />

      {/* DOM Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top HUD Navigation */}
        <div className="sticky top-0 z-50 px-4 pt-3 pb-1">
          <TopbarHUD tenant={tenant} onLogout={onLogout} />
        </div>

        {/* Portal Header Bar */}
        <div className="px-6 pt-4 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePortal + '-header'}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl">{portal.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {portal.label} Workspace
                </h2>
                <p className="text-xs text-gray-500">{portal.description}</p>
              </div>
              <div
                className="ml-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border"
                style={{
                  color: portal.color,
                  borderColor: `${portal.color}33`,
                  backgroundColor: `${portal.color}0D`,
                }}
              >
                {portal.path}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Active Portal Content */}
        <main className="flex-1 px-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePortal}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {portalContent}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

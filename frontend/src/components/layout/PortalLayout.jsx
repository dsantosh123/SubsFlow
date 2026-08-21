import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Users, CreditCard, Settings, BarChart3 } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import SpatialCanvas3D from '../3d/SpatialCanvas3D';
import TiltCard3D from '../3d/TiltCard3D';
import TopbarHUD from './TopbarHUD';

/* ─────────────────────────────────────────────────────────
   Portal Content Panels — Placeholder views for non-Merchant
   ───────────────────────────────────────────────────────── */

function SuperAdminPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <TiltCard3D glowColor="rgba(244, 63, 94, 0.25)" depth={8}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-rose/15 flex items-center justify-center border border-cyber-rose/20">
              <Users size={20} className="text-cyber-rose" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Tenant Registry</h3>
              <p className="text-[11px] text-gray-500">Global multi-tenant operations</p>
            </div>
          </div>
          <div className="space-y-3">
            {['Tenant provisioning & lifecycle', 'RLS policy enforcement', 'API key rotation', 'Cross-tenant analytics'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-rose/50" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 px-3 py-2 rounded-lg bg-cyber-rose/5 border border-cyber-rose/10 text-[11px] text-cyber-rose/70 font-mono">
            Phase 2 — Full admin console with tenant CRUD, billing overrides & audit logs
          </div>
        </div>
      </TiltCard3D>

      <TiltCard3D glowColor="rgba(244, 63, 94, 0.25)" depth={8}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-rose/15 flex items-center justify-center border border-cyber-rose/20">
              <BarChart3 size={20} className="text-cyber-rose" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Platform Analytics</h3>
              <p className="text-[11px] text-gray-500">Global system health & metrics</p>
            </div>
          </div>
          <div className="space-y-3">
            {['Revenue heatmaps across tenants', 'Dunning failure rates', 'Payment gateway health', 'Outbox processing latency'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-rose/50" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 px-3 py-2 rounded-lg bg-cyber-rose/5 border border-cyber-rose/10 text-[11px] text-cyber-rose/70 font-mono">
            Phase 2 — Real-time Prometheus dashboards & 3D globe visualization
          </div>
        </div>
      </TiltCard3D>
    </div>
  );
}

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
  const { activePortal, portal } = usePortal();

  const portalContent = useMemo(() => {
    switch (activePortal) {
      case 'SUPER_ADMIN':
        return <SuperAdminPanel />;
      case 'CUSTOMER':
        return <CustomerPanel />;
      case 'MERCHANT':
      default:
        return children; // Existing Dashboard + ApiLog components
    }
  }, [activePortal, children]);

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

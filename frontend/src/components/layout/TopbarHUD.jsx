import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LogOut, Shield, Zap, Radio } from 'lucide-react';
import { usePortal, PORTALS } from '../../context/PortalContext';
import TiltCard3D from '../3d/TiltCard3D';

const portalList = [PORTALS.TENANT_WORKSPACE, PORTALS.MERCHANT, PORTALS.SUPER_ADMIN, PORTALS.CUSTOMER];

function LatencyBadge({ latency }) {
  let colorClass = 'text-cyber-emerald';
  let dotClass = 'status-dot-active';
  let label = 'Healthy';

  if (latency === null) {
    colorClass = 'text-gray-500';
    dotClass = '';
    label = '—';
  } else if (latency > 500) {
    colorClass = 'text-cyber-rose';
    dotClass = 'status-dot-error';
    label = `${latency}ms`;
  } else if (latency > 100) {
    colorClass = 'text-cyber-amber';
    dotClass = 'status-dot-warning';
    label = `${latency}ms`;
  } else {
    label = `${latency}ms`;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
      <Activity size={14} className={colorClass} />
      <div className={`status-dot ${dotClass}`} />
      <span className={`text-xs font-mono ${colorClass}`}>{label}</span>
    </div>
  );
}

export default function TopbarHUD({ tenant, onLogout }) {
  const { activePortal, switchPortal, apiLatency } = usePortal();

  return (
    <TiltCard3D
      className="w-full"
      maxTilt={3}
      scale={1.005}
      glowColor="rgba(99, 102, 241, 0.2)"
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Left: Logo & Portal Switcher */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-indigo to-purple-600 flex items-center justify-center shadow-neon-indigo">
                <Zap size={18} className="text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyber-emerald border-2 border-obsidian" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">SubsFlow</h1>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-cyber-indigo/20 text-cyber-indigo border border-cyber-indigo/30">
                  v2.0-SPATIAL
                </span>
              </div>
              <p className="text-[10px] text-gray-500 -mt-0.5">4D Operations Cockpit</p>
            </div>
          </div>

          {/* Portal Switcher Pills */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {portalList.map((portal) => {
              const isActive = activePortal === portal.id;
              return (
                <button
                  key={portal.id}
                  onClick={() => switchPortal(portal.id)}
                  className={`
                    relative px-3.5 py-1.5 rounded-lg text-xs font-medium
                    transition-colors duration-200
                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="portal-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${portal.color}22, ${portal.color}11)`,
                        border: `1px solid ${portal.color}44`,
                        boxShadow: `0 0 20px ${portal.color}15`,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{portal.icon}</span>
                    <span>{portal.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Telemetry + Tenant + Logout */}
        <div className="flex items-center gap-3">
          {/* Latency Badge */}
          <LatencyBadge latency={apiLatency} />

          {/* Tenant Isolation Status */}
          {tenant && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <Shield size={13} className="text-cyber-cyan" />
              <span className="text-xs text-gray-400">{tenant.name}</span>
              <span className="text-[10px] font-mono text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                {tenant.apiKey}
              </span>
              <div className="status-dot status-dot-active" />
            </div>
          )}

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyber-emerald/10 border border-cyber-emerald/20">
            <Radio size={11} className="text-cyber-emerald animate-pulse" />
            <span className="text-[10px] font-mono text-cyber-emerald">LIVE</span>
          </div>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500
                       hover:text-cyber-rose hover:bg-cyber-rose/10 border border-transparent
                       hover:border-cyber-rose/20 transition-all duration-200"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </TiltCard3D>
  );
}

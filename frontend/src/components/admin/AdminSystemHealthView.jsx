import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Database, Server, Radio, Zap, ShieldCheck, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import { getSystemHealth, getIntegrations } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminSystemHealthView({ onTriggerToast }) {
  const [health, setHealth] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [hRes, iRes] = await Promise.all([
      getSystemHealth(),
      getIntegrations(),
    ]);

    if (hRes.ok) setHealth(hRes.data);
    if (iRes.ok && Array.isArray(iRes.data)) setIntegrations(iRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Health & Integrations</h2>
          <p className="text-xs text-gray-500 font-mono">
            Infrastructure telemetry, micro-service status, and external provider connections.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Ping Services</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database */}
        <TiltCard3D glowColor="rgba(16, 185, 129, 0.1)" depth={3}>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Primary Database</span>
              <Database size={16} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.database?.status === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-sm font-bold text-white font-mono">{health?.database?.status || 'CHECKING'}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">{health?.database?.engine} • {health?.database?.latencyMs}ms latency</p>
          </div>
        </TiltCard3D>

        {/* Redis */}
        <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={3}>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Redis Rate Limiter</span>
              <Server size={16} className="text-cyber-rose" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.redis?.status === 'UP' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-sm font-bold text-white font-mono">{health?.redis?.status || 'STANDBY'}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">In-Memory Cache & Token Bucket</p>
          </div>
        </TiltCard3D>

        {/* Kafka */}
        <TiltCard3D glowColor="rgba(139, 92, 246, 0.1)" depth={3}>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Kafka Message Broker</span>
              <Radio size={16} className="text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm font-bold text-white font-mono">{health?.kafka?.status || 'ONLINE'}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">3 configured outbox event topics</p>
          </div>
        </TiltCard3D>

        {/* Webhooks Engine */}
        <TiltCard3D glowColor="rgba(6, 182, 212, 0.1)" depth={3}>
          <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Webhook Workers</span>
              <Zap size={16} className="text-cyan-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-bold text-white font-mono">{health?.webhooks?.status || 'ACTIVE'}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">Failure rate: {health?.webhooks?.failureRate || 0}%</p>
          </div>
        </TiltCard3D>
      </div>

      {/* Integrations Catalog */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Connected Subsystems & Security Gateways</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {integrations.map((i, idx) => (
            <div key={idx} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{i.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono">{i.status}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">{i.features}</p>
                <span className="text-[9px] text-gray-500 font-mono block">Mode: {i.mode}</span>
              </div>
              <ShieldCheck size={16} className="text-gray-500 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Settings, Save, RotateCw, Loader2, CheckCircle2 } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';

export default function AdminSettings({ admin, onTriggerToast }) {
  const [settings, setSettings] = useState({
    platform_name: 'SubsFlow Cloud',
    support_email: 'ops@subsflow.com',
    default_timezone: 'UTC',
    default_currency: 'USD',
    webhook_max_retries: '5',
    session_timeout_hours: '24',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await getPlatformSettings();
    if (res.ok && res.data) {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updatePlatformSettings(settings);
    if (res.ok) {
      onTriggerToast('success', 'Settings Saved', 'Platform global settings updated.');
    } else {
      onTriggerToast('error', 'Save Failed', res.data?.error || 'Could not save settings.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Global Settings</h2>
          <p className="text-xs text-gray-500 font-mono">
            Platform-wide configuration, default currencies, operational parameters, and alert routing.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={2}>
            <form onSubmit={handleSave} className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4 text-xs font-mono">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Settings size={16} className="text-cyber-rose" />
                <span>Operational Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Platform Branding Name</label>
                  <input
                    type="text"
                    value={settings.platform_name || ''}
                    onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Support Escalation Email</label>
                  <input
                    type="email"
                    value={settings.support_email || ''}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Default Platform Timezone</label>
                  <input
                    type="text"
                    value={settings.default_timezone || 'UTC'}
                    onChange={(e) => setSettings({ ...settings, default_timezone: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Standard Currency</label>
                  <input
                    type="text"
                    value={settings.default_currency || 'USD'}
                    onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Outbound Webhook Max Retries</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.webhook_max_retries || '5'}
                    onChange={(e) => setSettings({ ...settings, webhook_max_retries: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Admin JWT Session Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={settings.session_timeout_hours || '24'}
                    onChange={(e) => setSettings({ ...settings, session_timeout_hours: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-cyber-rose/20 hover:bg-cyber-rose/30 text-cyber-rose border border-cyber-rose/30 text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </TiltCard3D>
        </div>

        {/* Current Operator Profile */}
        <div>
          <TiltCard3D glowColor="rgba(244, 63, 94, 0.1)" depth={2}>
            <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4 text-xs font-mono">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-cyber-rose" />
                <span>Admin Session</span>
              </h3>

              <div className="space-y-3 divide-y divide-white/[0.04]">
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500">Operator</span>
                  <span className="text-white font-bold">{admin?.name || 'Root Admin'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-300">{admin?.email || '—'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500">Authority Role</span>
                  <span className="px-2 py-0.5 rounded bg-cyber-rose/15 text-cyber-rose text-[10px] font-bold">
                    {admin?.role || 'PLATFORM_ADMIN'}
                  </span>
                </div>
              </div>
            </div>
          </TiltCard3D>
        </div>
      </div>
    </div>
  );
}

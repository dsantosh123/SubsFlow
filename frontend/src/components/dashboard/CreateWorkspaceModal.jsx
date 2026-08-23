import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Building2, Globe, Shield } from 'lucide-react';

export function CreateWorkspaceModal({ isOpen, onClose, onCreateWorkspace }) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('Growth Plan');
  const [region, setRegion] = useState('us-east-1 (N. Virginia)');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const id = 't_' + Math.random().toString(36).substring(2, 9);
      const newWs = {
        id,
        name: name.trim(),
        tier,
        region,
        apiKey: 'sk_live_' + Math.random().toString(36).substring(2, 16),
        membersCount: 1,
        status: 'ACTIVE',
      };
      onCreateWorkspace(newWs);
      setName('');
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Tenant Workspace"
      description="Provision a new isolated SaaS tenant with dedicated Row-Level Security policies."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Workspace / Company Name</label>
          <Input
            placeholder="e.g. Apex Dynamics Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<Building2 size={15} />}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Subscription Tier</label>
          <Select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="Starter Plan">Starter Plan ($29/mo)</option>
            <option value="Growth Plan">Growth Plan ($79/mo) — Recommended</option>
            <option value="Enterprise Plan">Enterprise Dedicated ($249/mo)</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Database Cluster Region</label>
          <Select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="us-east-1 (N. Virginia)">US East (N. Virginia)</option>
            <option value="us-west-2 (Oregon)">US West (Oregon)</option>
            <option value="eu-central-1 (Frankfurt)">Europe (Frankfurt)</option>
            <option value="ap-southeast-1 (Singapore)">Asia Pacific (Singapore)</option>
          </Select>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
          <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <span>
            Every workspace receives an isolated PostgreSQL schema session variable and auto-generated API keys.
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" loading={loading} disabled={!name.trim()}>
            Provision Workspace
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

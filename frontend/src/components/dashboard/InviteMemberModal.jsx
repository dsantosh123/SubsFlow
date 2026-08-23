import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Mail, User, ShieldCheck, Check, Key } from 'lucide-react';

export function InviteMemberModal({ isOpen, onClose, onInviteMember }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      id: 'ADMIN',
      name: 'Admin',
      badge: 'admin',
      description: 'Workspace management, settings configuration, and developer team management.',
    },
    {
      id: 'DEVELOPER',
      name: 'Developer',
      badge: 'developer',
      description: 'API keys, webhooks, usage telemetry, and integration sandbox access.',
    },
    {
      id: 'EDITOR',
      name: 'Editor',
      badge: 'editor',
      description: 'Can manage plans, update subscriptions, and configure API integrations.',
    },
    {
      id: 'VIEWER',
      name: 'Viewer',
      badge: 'viewer',
      description: 'Read-only access to dashboard metrics, logs, and subscriber analytics.',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter member name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onInviteMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'Temp_User_2026!',
        role: role.toUpperCase(),
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('DEVELOPER');
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Add a colleague to your tenant workspace and assign appropriate role permissions."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
          <Input
            placeholder="e.g. Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={15} />}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email Address</label>
          <Input
            type="email"
            placeholder="alex@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={15} />}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Temporary Password (Optional)</label>
          <Input
            type="password"
            placeholder="Default: Temp_User_2026!"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Key size={15} />}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Assign Role</label>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = role === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{r.name}</span>
                      <Badge variant={r.badge} size="sm">
                        {r.name.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {r.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ml-2">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" loading={loading}>
            Send Workspace Invite
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

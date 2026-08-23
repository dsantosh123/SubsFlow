import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Key, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export function CredentialRevealModal({
  isOpen,
  onClose,
  credentials, // { clientId, clientSecret, isRotated }
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!credentials) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(credentials.clientId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(credentials.clientSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={credentials.isRotated ? "API Credentials Rotated Successfully" : "API Credentials Generated Successfully"}
      description="Store your Client Secret securely. For security reasons, it will never be displayed again."
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Security Warning Alert Box */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">One-time secret reveal</span>
            <span>SubsFlow hashes your secret using BCrypt. If you lose this secret, you must rotate credentials.</span>
          </div>
        </div>

        {/* Client ID Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Client ID (Public Identifier)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={credentials.clientId}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 select-all"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="shrink-0"
            >
              {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedId ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Client Secret Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">Client Secret (Confidential)</label>
            <Badge variant="destructive" size="sm">SECRET</Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={credentials.clientSecret}
              className="flex-1 bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-2 text-xs font-mono text-rose-900 font-semibold select-all"
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleCopySecret}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              {copiedSecret ? <Check size={14} className="text-white" /> : <Copy size={14} />}
              <span>{copiedSecret ? 'Copied Secret' : 'Copy Secret'}</span>
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Encrypted with BCrypt Hash</span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onClose}
          >
            I have saved my credentials
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

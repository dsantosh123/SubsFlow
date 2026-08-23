import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';
import { CredentialRevealModal } from './CredentialRevealModal';
import {
  getCredentials,
  generateCredentials,
  rotateCredentials,
  revokeCredentials,
  getProductAuditLogs,
  updateProduct,
  setProductStatus
} from '../../productApi';
import { PlanListView } from '../plans/PlanListView';
import { CustomerListView } from '../customers/CustomerListView';
import { SubscriptionListView } from '../subscriptions/SubscriptionListView';
import { BillingDashboardView } from '../billing/BillingDashboardView';
import { OperationsHubView } from '../operations/OperationsHubView';
import { AnalyticsDashboardView } from '../analytics/AnalyticsDashboardView';
import { ProductMetricsOverview } from './ProductMetricsOverview';
import { 
  ArrowLeft, 
  Key, 
  RotateCw, 
  ShieldAlert, 
  Copy, 
  Check, 
  Code, 
  Activity, 
  Settings, 
  Globe, 
  Lock, 
  Calendar, 
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Layers,
  Users,
  CreditCard,
  Receipt,
  Zap,
  TrendingUp
} from 'lucide-react';

export function ProductDetailView({
  product,
  onBack,
  onProductUpdated,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'customers' | 'plans' | 'integration' | 'settings' | 'audit'
  const [codeLang, setCodeLang] = useState('curl'); // 'curl' | 'node' | 'python' | 'java'

  // Credentials State
  const [credMeta, setCredMeta] = useState(null);
  const [loadingCreds, setLoadingCreds] = useState(true);

  // One-time Reveal Modal
  const [revealData, setRevealData] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Settings Form State
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(product?.websiteUrl || '');
  const [savingSettings, setSavingSettings] = useState(false);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  // Load Credential Metadata
  const loadCredentials = useCallback(async () => {
    if (!product?.id) return;
    setLoadingCreds(true);
    const res = await getCredentials(product.id);
    if (res.ok) {
      setCredMeta(res.data);
    }
    setLoadingCreds(false);
  }, [product?.id]);

  // Load Audit Trail
  const loadAuditLogs = useCallback(async () => {
    if (!product?.id) return;
    setLoadingAudit(true);
    const res = await getProductAuditLogs(product.id);
    if (res.ok && Array.isArray(res.data)) {
      setAuditLogs(res.data);
    }
    setLoadingAudit(false);
  }, [product?.id]);

  useEffect(() => {
    loadCredentials();
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [loadCredentials, loadAuditLogs, activeTab]);

  const handleGenerate = async () => {
    const res = await generateCredentials(product.id);
    if (res.ok) {
      setRevealData({
        clientId: res.data.clientId,
        clientSecret: res.data.clientSecret,
        isRotated: false,
      });
      setIsRevealOpen(true);
      await loadCredentials();
      if (onTriggerToast) onTriggerToast('success', 'Credentials Generated', 'New client credentials generated.');
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to generate credentials');
    }
  };

  const handleRotate = async () => {
    if (!window.confirm('Are you sure you want to rotate API credentials? The old client secret will immediately stop working!')) {
      return;
    }
    const res = await rotateCredentials(product.id);
    if (res.ok) {
      setRevealData({
        clientId: res.data.clientId,
        clientSecret: res.data.clientSecret,
        isRotated: true,
      });
      setIsRevealOpen(true);
      await loadCredentials();
      if (onTriggerToast) onTriggerToast('success', 'Credentials Rotated', 'Old credentials revoked and new secret issued.');
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to rotate credentials');
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to revoke API credentials? Any SaaS backend using these credentials will be blocked!')) {
      return;
    }
    const res = await revokeCredentials(product.id);
    if (res.ok) {
      await loadCredentials();
      if (onTriggerToast) onTriggerToast('warning', 'Credentials Revoked', 'API access for this product has been revoked.');
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to revoke credentials');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const res = await updateProduct(product.id, name, description, websiteUrl);
    if (res.ok) {
      if (onProductUpdated) onProductUpdated(res.data);
      if (onTriggerToast) onTriggerToast('success', 'Product Updated', 'Product metadata saved successfully.');
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to update product');
    }
    setSavingSettings(false);
  };

  const handleToggleStatus = async () => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await setProductStatus(product.id, nextStatus);
    if (res.ok) {
      if (onProductUpdated) onProductUpdated(res.data);
      if (onTriggerToast) onTriggerToast('info', 'Status Changed', `Product status set to ${nextStatus}`);
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to update status');
    }
  };

  // Code sample generators
  const sampleClientId = credMeta?.clientId || 'cid_netflix_example_789';
  const sampleClientSecret = 'cs_live_your_client_secret_here';

  const codeSnippets = {
    curl: `curl -X POST https://api.subsflow.io/api/v1/subscriptions \\
  -H "X-Client-Id: ${sampleClientId}" \\
  -H "X-Client-Secret: ${sampleClientSecret}" \\
  -H "Content-Type: application/json" \\
  -d '{"planId": "plan_pro", "customerId": "cust_123"}'`,
    node: `// Node.js (Fetch API)
const response = await fetch('https://api.subsflow.io/api/v1/subscriptions', {
  method: 'POST',
  headers: {
    'X-Client-Id': '${sampleClientId}',
    'X-Client-Secret': process.env.SUBSFLOW_CLIENT_SECRET,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 'plan_pro',
    customerId: 'cust_123',
  }),
});

const data = await response.json();
console.log('SubsFlow response:', data);`,
    python: `# Python (Requests)
import os, requests

headers = {
    "X-Client-Id": "${sampleClientId}",
    "X-Client-Secret": os.environ.get("SUBSFLOW_CLIENT_SECRET"),
    "Content-Type": "application/json",
}

payload = {
    "planId": "plan_pro",
    "customerId": "cust_123"
}

response = requests.post("https://api.subsflow.io/api/v1/subscriptions", json=payload, headers=headers)
print(response.json())`,
    java: `// Java 17+ (HttpClient)
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.subsflow.io/api/v1/subscriptions"))
    .header("X-Client-Id", "${sampleClientId}")
    .header("X-Client-Secret", System.getenv("SUBSFLOW_CLIENT_SECRET"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("{\\"planId\\": \\"plan_pro\\", \\"customerId\\": \\"cust_123\\"}"))
    .build();

HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Products List</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.name}</h1>
              <Badge variant={product.status === 'ACTIVE' ? 'success' : 'outline'} size="md">
                {product.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              {product.description || 'No description provided.'}
            </p>
            {product.websiteUrl && (
              <a
                href={product.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline pt-1"
              >
                <Globe size={13} />
                <span>{product.websiteUrl}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isDeveloper && (
              <Button
                variant={product.status === 'ACTIVE' ? 'outline' : 'default'}
                size="sm"
                onClick={handleToggleStatus}
              >
                {product.status === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}
              </Button>
            )}
          </div>
        </div>

        {/* Product Dashboard Metrics Overview (Phase 5) */}
        <div className="pt-2">
          <ProductMetricsOverview productId={product.id} />
        </div>

        {/* Navigation Tabs */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <Tabs
            tabs={[
              { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard size={14} /> },
              { id: 'billing', label: 'Invoices & Payments', icon: <Receipt size={14} /> },
              { id: 'analytics', label: 'Analytics & Reports', icon: <TrendingUp size={14} /> },
              { id: 'operations', label: 'Operations & Events', icon: <Zap size={14} /> },
              { id: 'customers', label: 'Customers', icon: <Users size={14} /> },
              { id: 'plans', label: 'Pricing Plans', icon: <Layers size={14} /> },
              { id: 'integration', label: 'Integration & Credentials', icon: <Key size={14} /> },
              { id: 'settings', label: 'Product Settings', icon: <Settings size={14} /> },
              { id: 'audit', label: 'Audit Trail', icon: <Activity size={14} /> },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Tab: Subscriptions (Phase 5) */}
      {activeTab === 'subscriptions' && (
        <SubscriptionListView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab: Invoices & Payments (Phase 6) */}
      {activeTab === 'billing' && (
        <BillingDashboardView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab: Analytics & Reports (Phase 8) */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboardView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab: Operations & Events (Phase 7) */}
      {activeTab === 'operations' && (
        <OperationsHubView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab: Customers (Phase 5) */}
      {activeTab === 'customers' && (
        <CustomerListView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab: Customer Plans & Pricing (Phase 4) */}
      {activeTab === 'plans' && (
        <PlanListView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab 1: Integration & Credentials */}
      {activeTab === 'integration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Credentials Management & Code Snippet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credentials Card */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">API Integration Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Use these credentials in your SaaS backend to connect with SubsFlow.</p>
                </div>

                <Badge variant={credMeta?.hasActiveCredentials ? 'success' : 'outline'} size="sm">
                  {credMeta?.hasActiveCredentials ? 'CREDENTIALS ACTIVE' : 'NO CREDENTIALS'}
                </Badge>
              </div>

              {credMeta?.hasActiveCredentials ? (
                <div className="space-y-4">
                  {/* Client ID */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Client ID (Public Header)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={credMeta.clientId}
                        className="bg-slate-50 font-mono text-xs font-bold text-slate-900"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(credMeta.clientId);
                          if (onTriggerToast) onTriggerToast('info', 'Copied', 'Client ID copied to clipboard.');
                        }}
                      >
                        <Copy size={13} />
                        <span>Copy</span>
                      </Button>
                    </div>
                  </div>

                  {/* Secret Masked */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Client Secret</span>
                      <span className="text-[11px] text-slate-400 font-mono">BCrypt Hash Verified</span>
                    </div>
                    <Input
                      readOnly
                      value="••••••••••••••••••••••••••••••••••••••••••••"
                      disabled
                      className="bg-slate-50 font-mono text-xs text-slate-400 select-none"
                    />
                  </div>

                  {/* Metadata info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Created At</span>
                      <span className="text-slate-700 font-mono mt-0.5 block">
                        {credMeta.createdAt ? new Date(credMeta.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Last Used At</span>
                      <span className="text-slate-700 font-mono mt-0.5 block">
                        {credMeta.lastUsedAt ? new Date(credMeta.lastUsedAt).toLocaleDateString() : 'Never used yet'}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Owner / Admin only) */}
                  {!isDeveloper && (
                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRotate}
                      >
                        <RotateCw size={13} />
                        <span>Rotate Credentials</span>
                      </Button>

                      <Button
                        variant="subtleRed"
                        size="sm"
                        onClick={handleRevoke}
                      >
                        <ShieldAlert size={13} />
                        <span>Revoke Access</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <Key size={32} className="mx-auto text-slate-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No API Credentials Generated</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Generate client credentials to allow {product.name} to authenticate securely with SubsFlow.
                    </p>
                  </div>
                  {!isDeveloper ? (
                    <Button variant="default" size="sm" onClick={handleGenerate}>
                      <Key size={14} />
                      <span>Generate API Credentials</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Ask a Workspace Owner or Admin to generate credentials.</span>
                  )}
                </div>
              )}
            </Card>

            {/* Code Integration Guide */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Backend Authentication Example</h3>
                </div>

                {/* Language pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  {['curl', 'node', 'python', 'java'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${codeLang === lang
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeSnippets[codeLang]);
                    if (onTriggerToast) onTriggerToast('info', 'Copied', 'Code sample copied.');
                  }}
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
                <pre className="leading-relaxed">{codeSnippets[codeLang]}</pre>
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Security Summary */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>Product Isolation Protocol</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                When your SaaS backend sends API requests with <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">X-Client-Id</code> and <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">X-Client-Secret</code>, SubsFlow automatically:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Binds connection session to your tenant ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Tags all events to {product.name}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Enforces Postgres Row-Level Security</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Product Settings */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Product Metadata</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update product name, description, and website URL.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Product Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isDeveloper}
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isDeveloper}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Website URL</label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isDeveloper}
              />
            </div>

            {!isDeveloper && (
              <div className="pt-2">
                <Button type="submit" variant="default" size="sm" loading={savingSettings}>
                  Save Product Settings
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Product Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">Immutable record of product and credential lifecycle actions.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadAuditLogs}>
              <RotateCw size={13} />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Performed By</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5">
                        <Badge variant="primary" size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800 font-mono text-[11px]">
                        {log.performedBy}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {log.details}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px] text-right">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* One-Time Credential Reveal Modal */}
      <CredentialRevealModal
        isOpen={isRevealOpen}
        onClose={() => setIsRevealOpen(false)}
        credentials={revealData}
      />
    </div>
  );
}

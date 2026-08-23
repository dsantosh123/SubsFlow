import React, { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardOverview } from './DashboardOverview';
import { TeamRolesTable } from './TeamRolesTable';
import { InviteMemberModal } from './InviteMemberModal';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { ProductListView } from '../products/ProductListView';
import { ProductDetailView } from '../products/ProductDetailView';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { 
  Search, 
  Users, 
  Building2, 
  Layers, 
  Receipt, 
  Activity, 
  Key, 
  Settings, 
  Command, 
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  Box
} from 'lucide-react';
import { getStoredUser, getTeamMembers, inviteTeamMember } from '../../tenantAuthApi';
import { listProducts, createProduct } from '../../productApi';

export function DashboardLayout({
  onBackToLanding,
  onOpenPricing,
  onTriggerToast,
}) {
  const [activeTab, setActiveTab] = useState('products'); // Default to products for Phase 3 showcase
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Products State (Phase 3)
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Default fallback workspaces
  const defaultWorkspaces = [
    { id: 't_acme_prod', name: 'Netflix Corp (Production)', tier: 'Growth Plan', region: 'us-east-1', apiKey: 'sk_live_netflix_prod_9921', status: 'ACTIVE' },
    { id: 't_globex_stg', name: 'Globex Cloud (Staging)', tier: 'Starter Plan', region: 'us-west-2', apiKey: 'sk_test_globex_stg_4180', status: 'ACTIVE' },
    { id: 't_apex_sand', name: 'Apex Dynamics (Sandbox)', tier: 'Enterprise Plan', region: 'eu-central-1', apiKey: 'sk_test_apex_sand_7712', status: 'ACTIVE' },
  ];

  // Initialize workspaces with logged-in user's tenant if available
  const [workspaces, setWorkspaces] = useState(() => {
    const user = getStoredUser();
    if (user && user.tenantId) {
      const realWs = {
        id: user.tenantId,
        name: user.tenantName || 'My Workspace',
        tier: 'Growth Plan',
        region: 'us-east-1',
        apiKey: user.apiKey || 'sk_live_' + user.tenantId,
        status: 'ACTIVE',
      };
      return [realWs, ...defaultWorkspaces.filter(w => w.id !== user.tenantId)];
    }
    return defaultWorkspaces;
  });

  const [activeWorkspace, setActiveWorkspace] = useState(() => workspaces[0]);

  // Team Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch real team members from backend API
  const loadRealTeamMembers = useCallback(async () => {
    const user = getStoredUser();
    if (!user || !user.token) {
      setMembers([
        { id: 'usr_01', name: 'Sarah Connor', email: 'sarah@netflix.io', role: 'owner', status: 'Active', avatar: 'SC', color: 'bg-purple-100 text-purple-700', lastActive: 'Just now', joinedAt: 'Jan 12, 2026' },
        { id: 'usr_02', name: 'Alex Rivera', email: 'alex@netflix.io', role: 'admin', status: 'Active', avatar: 'AR', color: 'bg-indigo-100 text-indigo-700', lastActive: '12m ago', joinedAt: 'Feb 04, 2026' },
        { id: 'usr_03', name: 'Elena Rostova', email: 'elena@netflix.io', role: 'developer', status: 'Active', avatar: 'ER', color: 'bg-emerald-100 text-emerald-700', lastActive: '1h ago', joinedAt: 'Mar 15, 2026' },
      ]);
      return;
    }

    setLoadingMembers(true);
    const res = await getTeamMembers();
    if (res.ok && Array.isArray(res.data)) {
      const mapped = res.data.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: (m.role || 'DEVELOPER').toLowerCase(),
        status: 'Active',
        avatar: m.name.substring(0, 2).toUpperCase(),
        color: m.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : m.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700',
        lastActive: 'Active now',
        joinedAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
      }));
      setMembers(mapped);
    } else {
      setMembers([
        {
          id: user.id || 'usr_owner',
          name: user.name || 'Owner',
          email: user.email || 'owner@subsflow.io',
          role: (user.role || 'OWNER').toLowerCase(),
          status: 'Active',
          avatar: (user.name || 'OW').substring(0, 2).toUpperCase(),
          color: 'bg-purple-100 text-purple-700',
          lastActive: 'Just now',
          joinedAt: 'Today',
        }
      ]);
    }
    setLoadingMembers(false);
  }, []);

  // Fetch real products from backend API (Phase 3)
  const loadRealProducts = useCallback(async () => {
    const user = getStoredUser();
    if (!user || !user.token) {
      setProducts([
        {
          id: 'prod_streaming',
          tenantId: activeWorkspace.id,
          name: 'Netflix Streaming',
          description: 'Global 4K HDR on-demand video streaming platform',
          websiteUrl: 'https://netflix.com',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'prod_games',
          tenantId: activeWorkspace.id,
          name: 'Netflix Games',
          description: 'Cloud and mobile gaming catalog for active subscribers',
          websiteUrl: 'https://games.netflix.com',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        }
      ]);
      return;
    }

    setLoadingProducts(true);
    const res = await listProducts();
    if (res.ok && Array.isArray(res.data)) {
      setProducts(res.data);
    }
    setLoadingProducts(false);
  }, [activeWorkspace.id]);

  useEffect(() => {
    loadRealTeamMembers();
    loadRealProducts();
  }, [loadRealTeamMembers, loadRealProducts, activeWorkspace]);

  // Global search shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws);
    setSelectedProduct(null);
    if (onTriggerToast) {
      onTriggerToast('success', 'Workspace Switched', `Active workspace is now ${ws.name}`);
    }
  };

  const handleCreateWorkspace = (newWs) => {
    setWorkspaces((prev) => [newWs, ...prev]);
    setActiveWorkspace(newWs);
    setSelectedProduct(null);
    if (onTriggerToast) {
      onTriggerToast('success', 'Workspace Provisioned', `New tenant ${newWs.name} created with dedicated RLS.`);
    }
  };

  const handleInviteMember = async ({ name, email, password, role }) => {
    const user = getStoredUser();
    if (user && user.token) {
      const res = await inviteTeamMember(name, email, password, role);
      if (!res.ok) {
        throw new Error(res.data?.error || 'Failed to invite member via backend');
      }
      await loadRealTeamMembers();
      if (onTriggerToast) {
        onTriggerToast('success', 'Member Invited', `Successfully invited ${name} as ${role}!`);
      }
    } else {
      const newMember = {
        id: 'usr_' + Date.now().toString().slice(-6),
        name,
        email,
        role: role.toLowerCase(),
        status: 'Active',
        avatar: name.substring(0, 2).toUpperCase(),
        color: role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700',
        lastActive: 'Just now',
        joinedAt: 'Today',
      };
      setMembers((prev) => [newMember, ...prev]);
      if (onTriggerToast) {
        onTriggerToast('success', 'Member Added', `Added ${name} to workspace.`);
      }
    }
  };

  const handleCreateProduct = async ({ name, description, websiteUrl }) => {
    const user = getStoredUser();
    if (user && user.token) {
      const res = await createProduct(name, description, websiteUrl);
      if (!res.ok) {
        throw new Error(res.data?.error || 'Failed to register product via backend');
      }
      await loadRealProducts();
      setSelectedProduct(res.data);
      if (onTriggerToast) {
        onTriggerToast('success', 'Product Registered', `Registered ${name} successfully!`);
      }
    } else {
      const newProduct = {
        id: 'prod_' + Date.now().toString().slice(-6),
        tenantId: activeWorkspace.id,
        name,
        description,
        websiteUrl,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      setSelectedProduct(newProduct);
      if (onTriggerToast) {
        onTriggerToast('success', 'Product Registered', `Registered ${name} successfully!`);
      }
    }
  };

  const handleProductUpdated = (updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProduct(updated);
  };

  const handleUpdateRole = (memberId, newRole) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              role: newRole.toLowerCase(),
              color: newRole.toLowerCase() === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700',
            }
          : m
      )
    );
    if (onTriggerToast) {
      onTriggerToast('info', 'Role Updated', `Updated role to ${newRole.toUpperCase()}`);
    }
  };

  const handleDeleteMember = (memberId) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (onTriggerToast) {
      onTriggerToast('warning', 'Member Removed', 'Team member removed from workspace.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspaceClick={() => setIsCreateWsOpen(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'products') setSelectedProduct(null);
        }}
        membersCount={members.length}
        productsCount={products.length}
        onOpenPricing={onOpenPricing}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <DashboardHeader
          activeWorkspace={activeWorkspace}
          currentUser={currentUser || { name: 'Sarah Connor', email: 'sarah@netflix.io', role: 'Owner' }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onInviteClick={() => setIsInviteOpen(true)}
          onSignOut={onBackToLanding}
          onBackToLanding={onBackToLanding}
        />

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'products' && (
            selectedProduct ? (
              <ProductDetailView
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                onProductUpdated={handleProductUpdated}
                onTriggerToast={onTriggerToast}
                currentUserRole={currentUser?.role || 'OWNER'}
              />
            ) : (
              <ProductListView
                products={products}
                loading={loadingProducts}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onCreateProduct={handleCreateProduct}
                currentUserRole={currentUser?.role || 'OWNER'}
              />
            )
          )}

          {activeTab === 'overview' && (
            <DashboardOverview
              workspace={activeWorkspace}
              membersCount={members.length}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'products') setSelectedProduct(null);
              }}
              onInviteClick={() => setIsInviteOpen(true)}
            />
          )}

          {activeTab === 'team' && (
            <TeamRolesTable
              members={members}
              onInviteClick={() => setIsInviteOpen(true)}
              onUpdateRole={handleUpdateRole}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Workspace Subscriptions</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage billing plans and customer seat subscriptions.</p>
                </div>
                <Button variant="default" size="sm" onClick={onOpenPricing}>
                  Change Plan
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <span className="text-xs text-slate-400 font-bold uppercase">Current Tier</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">{activeWorkspace.tier}</div>
                  <p className="text-xs text-slate-500 mt-1">Billed monthly with automated dunning.</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-bold">● Active</span>
                    <span className="text-slate-400">Renews in 18 days</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <span className="text-xs text-slate-400 font-bold uppercase">Registered SaaS Products</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">{products.length} Products</div>
                  <p className="text-xs text-slate-500 mt-1">Isolated client ID and secret credentials.</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-indigo-600 font-bold">Isolated RLS</span>
                    <span className="text-indigo-600 hover:underline cursor-pointer" onClick={() => { setActiveTab('products'); setSelectedProduct(null); }}>View Products →</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <span className="text-xs text-slate-400 font-bold uppercase">Isolation Engine</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">Postgres RLS</div>
                  <p className="text-xs text-slate-500 mt-1">Hardware isolation on tenant connection provider.</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-mono text-slate-500">
                    <span>{activeWorkspace.id}</span>
                    <ShieldCheck size={16} className="text-emerald-600" />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Billing & Invoices History</h3>
              <p className="text-xs text-slate-500 mb-6">Itemized invoices generated with transactional outbox events.</p>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="p-3.5">Invoice ID</th>
                      <th className="p-3.5">Period</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">inv_2026_04</td>
                      <td className="p-3.5 text-slate-600">Apr 1 - Apr 30, 2026</td>
                      <td className="p-3.5 font-bold text-slate-900">$79.00</td>
                      <td className="p-3.5"><Badge variant="success" size="sm">PAID</Badge></td>
                      <td className="p-3.5 text-right"><span className="text-indigo-600 font-bold hover:underline cursor-pointer">Download PDF</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'apikeys' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tenant Master API Key (Legacy)</h3>
                <p className="text-xs text-slate-500 mt-1">Tenant-wide master key preserved for backward compatibility.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Master Secret Key</span>
                  <Badge variant="primary" size="sm">TENANT MASTER</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={activeWorkspace.apiKey}
                    className="font-mono text-xs bg-white text-slate-800"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(activeWorkspace.apiKey);
                      if (onTriggerToast) onTriggerToast('info', 'Copied', 'API Key copied to clipboard.');
                    }}
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'usage' && (
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Metered Usage & Rate Limiting</h3>
              <p className="text-xs text-slate-500">Live rate-limiting powered by Redis and token bucket quotas (10,000 req/min).</p>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <Activity size={32} className="text-indigo-600 mx-auto animate-pulse" />
                <div className="text-lg font-bold text-slate-900">1,420,850 Metered Events</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Events ingested with zero dropped payloads via Transactional Outbox pattern.</p>
              </div>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workspace Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Configure tenant metadata and Row-Level Security parameters.</p>
              </div>

              <div className="space-y-4 max-w-lg text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Workspace Name</label>
                  <Input defaultValue={activeWorkspace.name} />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenant ID (Immutable)</label>
                  <Input defaultValue={activeWorkspace.id} disabled className="font-mono bg-slate-50" />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cluster Region</label>
                  <Input defaultValue={activeWorkspace.region || 'us-east-1'} disabled className="bg-slate-50" />
                </div>

                <Button variant="default" size="sm">
                  Save Changes
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Global Search Dialog (⌘K) */}
      <Dialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search workspaces, products, team members, or tabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
            <div className="text-[10px] font-bold uppercase text-slate-400 px-2">Navigation Shortcuts</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'SaaS Products & Keys', tab: 'products', icon: Box },
                { label: 'Team & Roles Table', tab: 'team', icon: Users },
                { label: 'Overview Analytics', tab: 'overview', icon: Building2 },
                { label: 'Subscriptions', tab: 'subscriptions', icon: Layers },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(item.tab);
                    if (item.tab === 'products') setSelectedProduct(null);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-slate-700 text-left cursor-pointer"
                >
                  <item.icon size={14} className="text-indigo-600" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase text-slate-400 px-2 pt-2">SaaS Products ({products.length})</div>
            {products
              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveTab('products');
                    setSelectedProduct(p);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Box size={14} className="text-indigo-600" />
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">{p.status}</Badge>
                </div>
              ))}
          </div>
        </div>
      </Dialog>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteMember={handleInviteMember}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
}

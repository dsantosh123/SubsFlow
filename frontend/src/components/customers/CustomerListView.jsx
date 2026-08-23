import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CreateCustomerModal } from './CreateCustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { 
  listCustomers, 
  createCustomer, 
  updateCustomer, 
  setCustomerStatus 
} from '../../customerApi';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Hash, 
  Mail, 
  Calendar 
} from 'lucide-react';

export function CustomerListView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadCustomers = useCallback(async (query = '') => {
    if (!product?.id) return;
    setLoading(true);
    const res = await listCustomers(product.id, query);
    if (res.ok && Array.isArray(res.data)) {
      setCustomers(res.data);
    } else {
      setCustomers([]);
    }
    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadCustomers(searchQuery);
  }, [loadCustomers, searchQuery]);

  const handleCreateOrEdit = async (customerData) => {
    if (editingCustomer) {
      const res = await updateCustomer(product.id, editingCustomer.id, customerData);
      if (!res.ok) throw new Error(res.data?.error || 'Failed to update customer');
      if (onTriggerToast) onTriggerToast('success', 'Customer Updated', `Saved customer '${customerData.name}'`);
    } else {
      const res = await createCustomer(product.id, customerData);
      if (!res.ok) throw new Error(res.data?.error || 'Failed to create customer');
      if (onTriggerToast) onTriggerToast('success', 'Customer Registered', `Created customer '${customerData.name}'`);
    }
    setEditingCustomer(null);
    await loadCustomers(searchQuery);
  };

  const handleToggleStatus = async (customer) => {
    const targetStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await setCustomerStatus(product.id, customer.id, targetStatus);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast('info', 'Status Updated', `Customer set to ${targetStatus}`);
      await loadCustomers(searchQuery);
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Registered SaaS Customers</h3>
            <Badge variant="primary" size="sm">PHASE 5</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage end-customers and account identities belonging to <strong>{product.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by name, email, or ext ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={14} />}
              className="text-xs h-9"
            />
          </div>

          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingCustomer(null);
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">No Customers Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery ? `No results match "${searchQuery}".` : 'Register your first customer or integrate your backend API.'}
            </p>
          </div>
          {!isDeveloper && !searchQuery && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingCustomer(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Add First Customer</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer Name & Email</th>
                  <th className="py-3.5 px-4">External ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Subscriptions</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {c.externalCustomerId || <span className="text-slate-300 italic">None</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                        {c.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={c.subscriptionsCount > 0 ? 'primary' : 'outline'} size="sm">
                        {c.subscriptionsCount} {c.subscriptionsCount === 1 ? 'Subscription' : 'Subscriptions'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingCustomer(c)}
                        className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                      >
                        <Eye size={13} className="mr-1 inline" />
                        <span>View</span>
                      </Button>

                      {!isDeveloper && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsCreateOpen(true);
                            }}
                            className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                          >
                            <Edit2 size={13} className="mr-1 inline" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(c)}
                            className={`h-7 px-2 ${
                              c.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-amber-600'
                                : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSubmitCustomer={handleCreateOrEdit}
      />

      <CustomerDetailModal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
        productId={product.id}
      />
    </div>
  );
}

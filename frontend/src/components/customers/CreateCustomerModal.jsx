import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Mail, Hash, Check } from 'lucide-react';

export function CreateCustomerModal({
  isOpen,
  onClose,
  customer, // null for create, object for edit
  onSubmitCustomer,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [externalCustomerId, setExternalCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!customer;

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setExternalCustomerId(customer.externalCustomerId || '');
    } else {
      setName('');
      setEmail('');
      setExternalCustomerId('');
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and valid email are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmitCustomer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        externalCustomerId: externalCustomerId.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Customer: ${customer.name}` : "Add New Customer"}
      description="Register a customer for this SaaS product to subscribe to pricing plans."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
          <Input
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={15} />}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
          <Input
            type="email"
            placeholder="e.g. john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={15} />}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            External Customer ID <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <Input
            placeholder="e.g. usr_ext_99124 from your backend"
            value={externalCustomerId}
            onChange={(e) => setExternalCustomerId(e.target.value)}
            icon={<Hash size={15} />}
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            The unique identifier for this user in your SaaS backend system.
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" loading={loading}>
            <Check size={14} />
            <span>{isEditing ? 'Save Changes' : 'Register Customer'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

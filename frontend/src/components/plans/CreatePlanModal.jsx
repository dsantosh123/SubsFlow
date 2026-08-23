import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Layers, DollarSign, Calendar, Clock, Eye, FileText, Check } from 'lucide-react';

export function CreatePlanModal({
  isOpen,
  onClose,
  plan, // null for create, object for edit
  onSubmitPlan,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [trialDays, setTrialDays] = useState('0');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!plan;

  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setDescription(plan.description || '');
      setPrice(plan.price !== undefined ? String(plan.price) : '0');
      setCurrency(plan.currency || 'USD');
      setBillingInterval(plan.billingInterval || 'MONTHLY');
      setTrialDays(plan.trialDays !== undefined ? String(plan.trialDays) : '0');
      setVisibility(plan.visibility || 'PUBLIC');
    } else {
      setName('');
      setDescription('');
      setPrice('0');
      setCurrency('USD');
      setBillingInterval('MONTHLY');
      setTrialDays('0');
      setVisibility('PUBLIC');
    }
    setError('');
  }, [plan, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Plan name is required');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Price must be a valid non-negative number (e.g. 0.00 for free plan)');
      return;
    }

    const numTrial = parseInt(trialDays, 10);
    if (isNaN(numTrial) || numTrial < 0) {
      setError('Trial days must be 0 or a positive number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmitPlan({
        name: name.trim(),
        description: description.trim() || null,
        price: numPrice,
        currency: currency.trim().toUpperCase(),
        billingInterval,
        trialDays: numTrial,
        visibility,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Plan: ${plan.name}` : "Create Customer Plan"}
      description="Define subscription pricing, recurring interval, trial period, and customer visibility."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Plan Name</label>
          <Input
            placeholder="e.g. Standard 1080p or Pro Growth"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<Layers size={15} />}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (Optional)</label>
          <Input
            placeholder="e.g. Full HD streaming on 2 screens simultaneously with 1080p downloads"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<FileText size={15} />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Price</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              icon={<DollarSign size={15} />}
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Set 0 for free plan</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency (ISO Code)</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Billing Interval</label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['MONTHLY', 'YEARLY'].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    billingInterval === interval
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Trial Days</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              icon={<Clock size={15} />}
            />
            <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0, 7, 14, or 30 days</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Visibility</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'PUBLIC', title: 'PUBLIC', desc: 'Offered to customers in the public catalog' },
              { id: 'PRIVATE', title: 'PRIVATE', desc: 'Internal or custom tier, hidden from catalog' },
            ].map((v) => {
              const isSelected = visibility === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setVisibility(v.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{v.title}</span>
                    {isSelected && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{v.desc}</p>
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
            {isEditing ? 'Save Plan Changes' : 'Create Plan (DRAFT)'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

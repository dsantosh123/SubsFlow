import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Plus, Trash2, Edit2, Check, Sparkles, Sliders } from 'lucide-react';

export function PlanFeatureModal({
  isOpen,
  onClose,
  plan,
  onAddFeature,
  onUpdateFeature,
  onDeleteFeature,
  isDeveloper = false,
}) {
  const [editingId, setEditingId] = useState(null);
  const [featureKey, setFeatureKey] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [value, setValue] = useState('');
  const [valueType, setValueType] = useState('TEXT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!plan) return null;

  const handleStartEdit = (f) => {
    setEditingId(f.id);
    setFeatureKey(f.featureKey);
    setFeatureName(f.featureName);
    setValue(f.value);
    setValueType(f.valueType || 'TEXT');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFeatureKey('');
    setFeatureName('');
    setValue('');
    setValueType('TEXT');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!featureKey.trim() || !featureName.trim()) {
      setError('Feature key and display name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingId) {
        await onUpdateFeature(plan.id, editingId, {
          featureKey: featureKey.trim().toLowerCase().replace(/\s+/g, '_'),
          featureName: featureName.trim(),
          value: value.trim(),
          valueType,
        });
      } else {
        await onAddFeature(plan.id, {
          featureKey: featureKey.trim().toLowerCase().replace(/\s+/g, '_'),
          featureName: featureName.trim(),
          value: value.trim(),
          valueType,
        });
      }
      handleCancelEdit();
    } catch (err) {
      setError(err.message || 'Failed to save feature');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (featureId) => {
    if (window.confirm('Are you sure you want to remove this feature from the plan?')) {
      try {
        await onDeleteFeature(plan.id, featureId);
      } catch (err) {
        alert(err.message || 'Failed to delete feature');
      }
    }
  };

  const isArchived = plan.status === 'ARCHIVED';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Features & Limits: ${plan.name}`}
      description="Configure customizable feature limits and entitlement properties for this customer plan."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Existing Features List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Configured Features ({plan.features?.length || 0})</span>
            {isArchived && <Badge variant="outline" size="sm">ARCHIVED (READ-ONLY)</Badge>}
          </div>

          {!plan.features || plan.features.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No custom features or limits defined yet. Add features below.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {plan.features.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{f.featureName}</span>
                      <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                        {f.featureKey}
                      </Badge>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {f.valueType}
                      </Badge>
                    </div>
                    <div className="text-slate-600 font-medium">
                      Value: <span className="font-bold text-indigo-600">{f.value}</span>
                    </div>
                  </div>

                  {!isArchived && !isDeveloper && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(f)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 size={13} className="text-slate-500 hover:text-indigo-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(f.id)}
                        className="h-7 w-7 p-0 hover:bg-rose-50"
                      >
                        <Trash2 size={13} className="text-slate-400 hover:text-rose-600" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Feature Form */}
        {!isArchived && !isDeveloper && (
          <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                {editingId ? 'Edit Feature' : 'Add New Feature'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Feature Name</label>
                <Input
                  placeholder="e.g. Simultaneous Screens"
                  value={featureName}
                  onChange={(e) => {
                    setFeatureName(e.target.value);
                    if (!editingId) {
                      setFeatureKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }
                  }}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Feature Key</label>
                <Input
                  placeholder="e.g. screens"
                  value={featureKey}
                  onChange={(e) => setFeatureKey(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Value</label>
                <Input
                  placeholder="e.g. 4 or true"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Value Type</label>
                <select
                  value={valueType}
                  onChange={(e) => setValueType(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="NUMBER">NUMBER (e.g. 4 screens, 100 downloads)</option>
                  <option value="BOOLEAN">BOOLEAN (e.g. true, false)</option>
                  <option value="TEXT">TEXT (e.g. 4K HDR, Unlimited)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="default" size="sm" loading={loading}>
                <Check size={13} />
                <span>{editingId ? 'Update Feature' : 'Add Feature'}</span>
              </Button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

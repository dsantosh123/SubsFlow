import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CreatePlanModal } from './CreatePlanModal';
import { PlanFeatureModal } from './PlanFeatureModal';
import { PublicCatalogPreviewModal } from './PublicCatalogPreviewModal';
import { 
  listPlans, 
  createPlan, 
  updatePlan, 
  setPlanStatus, 
  addPlanFeature, 
  updatePlanFeature, 
  deletePlanFeature 
} from '../../planApi';
import { 
  Plus, 
  Layers, 
  Globe, 
  Lock, 
  Edit2, 
  PlayCircle, 
  PauseCircle, 
  Archive, 
  Sliders, 
  Check, 
  Clock, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export function PlanListView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [featurePlan, setFeaturePlan] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadProductPlans = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const res = await listPlans(product.id);
    if (res.ok && Array.isArray(res.data)) {
      setPlans(res.data);
    } else {
      setPlans([]);
    }
    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadProductPlans();
  }, [loadProductPlans]);

  const handleCreateOrEditPlan = async (planData) => {
    if (editingPlan) {
      const res = await updatePlan(product.id, editingPlan.id, planData);
      if (!res.ok) {
        throw new Error(res.data?.error || 'Failed to update plan');
      }
      if (onTriggerToast) onTriggerToast('success', 'Plan Updated', `Plan '${planData.name}' saved.`);
    } else {
      const res = await createPlan(product.id, planData);
      if (!res.ok) {
        throw new Error(res.data?.error || 'Failed to create plan');
      }
      if (onTriggerToast) onTriggerToast('success', 'Plan Created', `Plan '${planData.name}' created in DRAFT.`);
    }
    setEditingPlan(null);
    await loadProductPlans();
  };

  const handleStatusChange = async (plan, targetStatus) => {
    if (targetStatus === 'ARCHIVED') {
      if (!window.confirm(`Are you sure you want to ARCHIVE plan '${plan.name}'? Archived plans cannot be edited or reactivated.`)) {
        return;
      }
    } else if (targetStatus === 'INACTIVE') {
      if (!window.confirm(`Deactivate plan '${plan.name}'? Existing subscribers are preserved, but no new customers can subscribe.`)) {
        return;
      }
    }

    const res = await setPlanStatus(product.id, plan.id, targetStatus);
    if (res.ok) {
      await loadProductPlans();
      if (onTriggerToast) onTriggerToast('info', 'Status Updated', `Plan status changed to ${targetStatus}`);
    } else {
      if (onTriggerToast) onTriggerToast('error', 'Error', res.data?.error || 'Failed to change status');
    }
  };

  const handleAddFeature = async (planId, featureData) => {
    const res = await addPlanFeature(product.id, planId, featureData);
    if (!res.ok) throw new Error(res.data?.error || 'Failed to add feature');
    await loadProductPlans();
    // Update active modal plan reference
    setFeaturePlan((prev) => prev ? { ...prev, features: [...(prev.features || []), res.data] } : null);
    if (onTriggerToast) onTriggerToast('success', 'Feature Added', `Added feature '${featureData.featureName}'`);
  };

  const handleUpdateFeature = async (planId, featureId, featureData) => {
    const res = await updatePlanFeature(product.id, planId, featureId, featureData);
    if (!res.ok) throw new Error(res.data?.error || 'Failed to update feature');
    await loadProductPlans();
    setFeaturePlan((prev) => prev ? {
      ...prev,
      features: prev.features.map(f => f.id === featureId ? res.data : f)
    } : null);
    if (onTriggerToast) onTriggerToast('info', 'Feature Updated', 'Feature saved.');
  };

  const handleDeleteFeature = async (planId, featureId) => {
    const res = await deletePlanFeature(product.id, planId, featureId);
    if (!res.ok) throw new Error(res.data?.error || 'Failed to delete feature');
    await loadProductPlans();
    setFeaturePlan((prev) => prev ? {
      ...prev,
      features: prev.features.filter(f => f.id !== featureId)
    } : null);
    if (onTriggerToast) onTriggerToast('warning', 'Feature Removed', 'Feature removed.');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm">ACTIVE</Badge>;
      case 'DRAFT':
        return <Badge variant="primary" size="sm">DRAFT</Badge>;
      case 'INACTIVE':
        return <Badge variant="outline" size="sm">INACTIVE</Badge>;
      case 'ARCHIVED':
        return <Badge variant="destructive" size="sm">ARCHIVED</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Customer Subscription Plans</h3>
            <Badge variant="primary" size="sm">PHASE 4</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define pricing tiers, recurring billing intervals, trial periods, and feature limits for <strong>{product.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Globe size={14} className="text-indigo-600" />
            <span>Public Catalog Preview</span>
          </Button>

          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingPlan(null);
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Plan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Plans List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading customer plans...
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Layers size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">No Plans Created for {product.name}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Create subscription plans (e.g. Basic Free, Standard $15/mo, Premium $25/mo) with custom feature limits.
            </p>
          </div>
          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingPlan(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Create First Plan</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isFree = parseFloat(plan.price) === 0;
            const isArchived = plan.status === 'ARCHIVED';

            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col justify-between transition-all ${
                  isArchived
                    ? 'opacity-70 bg-slate-50/60 border-slate-200'
                    : 'bg-white hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                        {plan.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        {isFree ? 'Free ($0)' : `${plan.currency} $${parseFloat(plan.price).toFixed(2)}`}
                      </span>
                      {!isFree && (
                        <span className="text-xs text-slate-500 font-semibold ml-1">
                          /{plan.billingInterval.toLowerCase() === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={plan.visibility === 'PUBLIC' ? 'outline' : 'primary'} size="sm">
                        {plan.visibility === 'PUBLIC' ? <Globe size={11} className="mr-1 inline text-indigo-600" /> : <Lock size={11} className="mr-1 inline text-slate-500" />}
                        {plan.visibility}
                      </Badge>
                    </div>
                  </div>

                  {/* Trial & Features Metadata */}
                  <div className="space-y-2 text-xs">
                    {plan.trialDays > 0 && (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <Clock size={13} />
                        <span>{plan.trialDays}-day free trial included</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        Features: <strong>{plan.features?.length || 0} configured</strong>
                      </span>
                      <button
                        onClick={() => setFeaturePlan(plan)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders size={12} />
                        <span>Manage Features →</span>
                      </button>
                    </div>

                    {/* Features preview pills */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {plan.features.slice(0, 3).map((f) => (
                          <span
                            key={f.id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {f.featureName}: <strong>{f.value}</strong>
                          </span>
                        ))}
                        {plan.features.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                            +{plan.features.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                {!isDeveloper && (
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {!isArchived ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsCreateOpen(true);
                          }}
                          className="text-slate-600 hover:text-indigo-600 text-xs h-7"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </Button>

                        {plan.status === 'DRAFT' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(plan, 'ACTIVE')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                          >
                            <PlayCircle size={12} />
                            <span>Activate</span>
                          </Button>
                        )}

                        {plan.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(plan, 'INACTIVE')}
                            className="text-xs h-7"
                          >
                            <PauseCircle size={12} />
                            <span>Deactivate</span>
                          </Button>
                        )}

                        {plan.status === 'INACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(plan, 'ACTIVE')}
                            className="text-xs h-7 text-emerald-600 border-emerald-200"
                          >
                            <PlayCircle size={12} />
                            <span>Reactivate</span>
                          </Button>
                        )}

                        <Button
                          variant="subtleRed"
                          size="sm"
                          onClick={() => handleStatusChange(plan, 'ARCHIVED')}
                          className="text-xs h-7"
                        >
                          <Archive size={12} />
                          <span>Archive</span>
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Archived historically. Cannot be edited.
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSubmitPlan={handleCreateOrEditPlan}
      />

      {/* Manage Features Modal */}
      <PlanFeatureModal
        isOpen={!!featurePlan}
        onClose={() => setFeaturePlan(null)}
        plan={featurePlan}
        onAddFeature={handleAddFeature}
        onUpdateFeature={handleUpdateFeature}
        onDeleteFeature={handleDeleteFeature}
        isDeveloper={isDeveloper}
      />

      {/* Public Catalog Preview Modal */}
      <PublicCatalogPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        product={product}
      />
    </div>
  );
}

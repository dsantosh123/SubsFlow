import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { getPublicPlans } from '../../planApi';
import { Globe, Check, ShieldCheck, Code, RefreshCw } from 'lucide-react';

export function PublicCatalogPreviewModal({
  isOpen,
  onClose,
  product,
}) {
  const [publicPlans, setPublicPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewJson, setViewJson] = useState(false);

  const loadPublicCatalog = async () => {
    if (!product?.id) return;
    setLoading(true);
    const res = await getPublicPlans(product.id);
    if (res.ok && Array.isArray(res.data)) {
      setPublicPlans(res.data);
    } else {
      setPublicPlans([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && product?.id) {
      loadPublicCatalog();
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Public Customer Catalog Preview"
      description={`Customer-facing pricing plans for ${product.name} retrieved via /api/v1/public/products/${product.id}/plans.`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Info Banner */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
            <span>
              <strong>Safe Public Endpoint:</strong> Only <strong>ACTIVE + PUBLIC</strong> plans are returned. Internal tenant data, audit logs, and API secrets are never exposed.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewJson(!viewJson)}
              className="bg-white text-xs h-7"
            >
              <Code size={13} />
              <span>{viewJson ? 'View UI Cards' : 'View Raw JSON'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPublicCatalog}
              className="bg-white text-xs h-7"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading public catalog...
          </div>
        ) : publicPlans.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
            <Globe size={32} className="mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-900">No Active Public Plans Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Only plans with status <strong>ACTIVE</strong> and visibility <strong>PUBLIC</strong> appear here. Activate plans to publish them.
            </p>
          </div>
        ) : viewJson ? (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-96 overflow-y-auto">
            <pre>{JSON.stringify(publicPlans, null, 2)}</pre>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publicPlans.map((plan) => {
              const isFree = parseFloat(plan.price) === 0;
              return (
                <Card key={plan.id} className="p-5 flex flex-col justify-between border-slate-200 hover:border-indigo-300 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                      {plan.trialDays > 0 && (
                        <Badge variant="success" size="sm">
                          {plan.trialDays}-DAY TRIAL
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {plan.description || 'Access to platform features and entitlements.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">
                          {isFree ? 'Free' : `${plan.currency} $${parseFloat(plan.price).toFixed(2)}`}
                        </span>
                        {!isFree && (
                          <span className="text-xs text-slate-500 font-semibold">
                            /{plan.billingInterval.toLowerCase() === 'yearly' ? 'yr' : 'mo'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Features Included</span>
                      {plan.features?.length > 0 ? (
                        plan.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Check size={13} className="text-emerald-600 shrink-0" />
                            <span>{f.featureName}: <strong>{f.value}</strong></span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Standard access</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-3">
                    <Button variant="default" size="sm" className="w-full justify-center">
                      Subscribe to {plan.name}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

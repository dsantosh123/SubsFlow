import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { executePay } from '../../billingApi';
import { listSubscriptions } from '../../customerApi';
import { CreditCard, DollarSign, Check, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export function CheckoutModal({
  isOpen,
  onClose,
  productId,
  onPaymentSuccess,
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [simulateOutcome, setSimulateOutcome] = useState('SUCCESS'); // 'SUCCESS' | 'DECLINE'
  const [loading, setLoading] = useState(false);
  const [fetchingSubs, setFetchingSubs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      loadSubs();
    }
  }, [isOpen, productId]);

  const loadSubs = async () => {
    setFetchingSubs(true);
    const res = await listSubscriptions(productId);
    if (res.ok && Array.isArray(res.data)) {
      setSubscriptions(res.data);
      if (res.data.length > 0) setSelectedSubId(res.data[0].id);
    }
    setFetchingSubs(false);
  };

  const selectedSub = subscriptions.find(s => s.id === selectedSubId);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedSub) {
      setError('Please select a customer subscription to charge');
      return;
    }

    setLoading(true);
    setError('');

    const token = simulateOutcome === 'DECLINE' ? 'pm_sandbox_decline_card' : 'pm_sandbox_visa_4242';

    try {
      const res = await executePay(productId, selectedSub.customerId, {
        subscriptionId: selectedSub.id,
        paymentMethodToken: token,
        provider: 'SANDBOX',
      });

      if (!res.ok) {
        throw new Error(res.data?.error || 'Payment execution failed');
      }

      if (res.data?.status === 'FAILED') {
        setError(`Payment Failed: ${res.data?.failureMessage || 'Card declined'}`);
        setLoading(false);
        return;
      }

      if (onPaymentSuccess) onPaymentSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Simulated Payment & Checkout"
      description="Execute a test payment transaction through the payment provider abstraction."
      maxWidth="max-w-lg"
    >
      {fetchingSubs ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading subscriptions...</div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Subscription Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Subscription to Pay</span>
              <span className="text-[10px] text-slate-400 font-normal">{subscriptions.length} subscriptions</span>
            </label>

            {subscriptions.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                No subscriptions found. Please create a customer subscription first.
              </div>
            ) : (
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                required
              >
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.customerName} ({s.planName}) — ${parseFloat(s.priceAtSubscription).toFixed(2)} {s.currencyAtSubscription}/{s.billingIntervalAtSubscription.toLowerCase()} ({s.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Summary Card */}
          {selectedSub && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Subscription:</span>
                <span className="font-bold text-slate-900">{selectedSub.customerName} — {selectedSub.planName}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Total Charge Amount:</span>
                <span className="text-base font-black text-slate-900">
                  ${parseFloat(selectedSub.priceAtSubscription).toFixed(2)} {selectedSub.currencyAtSubscription}
                </span>
              </div>
            </div>
          )}

          {/* Sandbox Simulation Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Sandbox Provider Simulation</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'SUCCESS', title: 'Simulate Success', desc: 'Valid Visa (Charge Succeeded, Invoice Paid)' },
                { id: 'DECLINE', title: 'Simulate Decline', desc: 'Decline Card (Payment Failed, Invoice Open)' },
              ].map((opt) => {
                const isSelected = simulateOutcome === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSimulateOutcome(opt.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? opt.id === 'SUCCESS' ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600' : 'border-rose-600 bg-rose-50/40 ring-1 ring-rose-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                      {isSelected && <Check size={14} className={opt.id === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'} />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={simulateOutcome === 'SUCCESS' ? 'default' : 'subtleRed'}
              size="sm"
              loading={loading}
              disabled={subscriptions.length === 0}
            >
              <CreditCard size={14} />
              <span>{simulateOutcome === 'SUCCESS' ? 'Execute Payment ($' + (selectedSub ? parseFloat(selectedSub.priceAtSubscription).toFixed(2) : '0') + ')' : 'Simulate Decline'}</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

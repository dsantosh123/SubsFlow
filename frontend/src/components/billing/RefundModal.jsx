import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { DollarSign, RotateCcw, AlertTriangle, Check } from 'lucide-react';

export function RefundModal({
  isOpen,
  onClose,
  payment,
  onSubmitRefund,
}) {
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('Customer requested refund');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = payment ? parseFloat(payment.amount) : 0;
  const alreadyRefunded = payment ? parseFloat(payment.refundedAmount || 0) : 0;
  const remainingRefundable = Math.max(0, totalAmount - alreadyRefunded);

  useEffect(() => {
    if (payment) {
      setRefundAmount(remainingRefundable.toFixed(2));
      setReason('Customer requested refund');
    }
    setError('');
  }, [payment, isOpen]);

  if (!payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numRefund = parseFloat(refundAmount);
    if (isNaN(numRefund) || numRefund <= 0) {
      setError('Please enter a valid refund amount greater than $0.00');
      return;
    }
    if (numRefund > remainingRefundable) {
      setError(`Refund amount cannot exceed remaining refundable balance of $${remainingRefundable.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmitRefund(payment.id, {
        amount: numRefund,
        reason: reason.trim() || 'Customer requested refund',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Refund Payment: ${payment.id}`}
      description="Issue a full or partial refund against this settled transaction."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Balance Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Original Charge:</span>
            <span className="font-bold text-slate-900">${totalAmount.toFixed(2)} {payment.currency}</span>
          </div>
          {alreadyRefunded > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Already Refunded:</span>
              <span className="font-bold">-${alreadyRefunded.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
            <span>Remaining Refundable Balance:</span>
            <span className="text-indigo-600">${remainingRefundable.toFixed(2)} {payment.currency}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Refund Amount ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={remainingRefundable}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            icon={<DollarSign size={15} />}
            required
          />
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setRefundAmount(remainingRefundable.toFixed(2))}
              className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              Full Refund (${remainingRefundable.toFixed(2)})
            </button>
            {remainingRefundable > 10 && (
              <button
                type="button"
                onClick={() => setRefundAmount((remainingRefundable / 2).toFixed(2))}
                className="text-[10px] text-slate-500 hover:underline cursor-pointer"
              >
                50% Partial (${(remainingRefundable / 2).toFixed(2)})
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Refund</label>
          <Input
            placeholder="e.g. Dissatisfied with service / Accidental charge"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="subtleRed"
            size="sm"
            loading={loading}
            disabled={remainingRefundable <= 0}
          >
            <RotateCcw size={13} />
            <span>Confirm Refund</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { FileText, User, Mail, Calendar, CheckCircle, Clock } from 'lucide-react';

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
}) {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice: ${invoice.invoiceNumber}`}
      description="Official SaaS billing invoice receipt for customer subscription."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-mono font-black">{invoice.invoiceNumber}</h3>
              <Badge variant={isPaid ? 'success' : 'outline'} size="sm">
                {invoice.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Issued for <strong>{invoice.customerName}</strong> ({invoice.customerEmail})
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-white">
              ${parseFloat(invoice.total).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 uppercase font-mono">{invoice.currency}</div>
          </div>
        </div>

        {/* Invoice Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Billing Period</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {new Date(invoice.billingPeriodStart).toLocaleDateString()} → {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Due Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Created Date</span>
            <span className="text-slate-600 mt-0.5 block">
              {new Date(invoice.createdAt).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Settlement Status</span>
            <span className="mt-0.5 block">
              {isPaid && invoice.paidAt ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle size={13} />
                  Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Clock size={13} />
                  Awaiting Payment
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-100 p-3 font-bold text-slate-700 flex justify-between">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="p-3 bg-white flex justify-between border-b border-slate-100">
            <div>
              <div className="font-bold text-slate-900">Subscription Plan Service</div>
              <div className="text-[11px] text-slate-400">
                Period {new Date(invoice.billingPeriodStart).toLocaleDateString()} to {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
              </div>
            </div>
            <div className="font-mono font-bold text-slate-900">
              ${parseFloat(invoice.subtotal).toFixed(2)} {invoice.currency}
            </div>
          </div>

          {parseFloat(invoice.discount) > 0 && (
            <div className="p-2.5 bg-slate-50/50 flex justify-between text-slate-600 border-b border-slate-100">
              <span>Discount</span>
              <span className="font-mono text-emerald-600">-${parseFloat(invoice.discount).toFixed(2)}</span>
            </div>
          )}

          {parseFloat(invoice.tax) > 0 && (
            <div className="p-2.5 bg-slate-50/50 flex justify-between text-slate-600 border-b border-slate-100">
              <span>Tax</span>
              <span className="font-mono">+${parseFloat(invoice.tax).toFixed(2)}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 font-bold text-slate-900 flex justify-between text-sm">
            <span>Total Billed</span>
            <span className="font-mono font-black">${parseFloat(invoice.total).toFixed(2)} {invoice.currency}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Invoice
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { CheckoutModal } from './CheckoutModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RefundModal } from './RefundModal';
import { listInvoices, listPayments, refundPayment } from '../../billingApi';
import { 
  CreditCard, 
  FileText, 
  Plus, 
  Eye, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Receipt 
} from 'lucide-react';

export function BillingDashboardView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [activeSubTab, setActiveSubTab] = useState('invoices'); // 'invoices' | 'payments'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [refundingPayment, setRefundingPayment] = useState(null);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadBillingData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const [invRes, payRes] = await Promise.all([
      listInvoices(product.id),
      listPayments(product.id),
    ]);

    if (invRes.ok && Array.isArray(invRes.data)) {
      setInvoices(invRes.data);
    } else {
      setInvoices([]);
    }

    if (payRes.ok && Array.isArray(payRes.data)) {
      setPayments(payRes.data);
    } else {
      setPayments([]);
    }

    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handlePaymentSuccess = async (payment) => {
    if (onTriggerToast) {
      onTriggerToast('success', 'Payment Succeeded', `Processed payment of $${parseFloat(payment.amount).toFixed(2)} ${payment.currency}`);
    }
    await loadBillingData();
  };

  const handleRefundSubmit = async (paymentId, refundData) => {
    const res = await refundPayment(product.id, paymentId, refundData);
    if (!res.ok) throw new Error(res.data?.error || 'Refund failed');
    if (onTriggerToast) {
      onTriggerToast('info', 'Refund Processed', `Issued refund of $${parseFloat(refundData.amount).toFixed(2)}`);
    }
    await loadBillingData();
  };

  const getInvoiceBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm">PAID</Badge>;
      case 'OPEN':
        return <Badge variant="primary" size="sm">OPEN</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" size="sm">DRAFT</Badge>;
      case 'VOID':
        return <Badge variant="outline" size="sm">VOID</Badge>;
      case 'UNCOLLECTIBLE':
        return <Badge variant="destructive" size="sm">UNCOLLECTIBLE</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'SUCCEEDED':
        return <Badge variant="success" size="sm">SUCCEEDED</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" size="sm">FAILED</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive" size="sm">REFUNDED</Badge>;
      case 'PARTIALLY_REFUNDED':
        return <Badge variant="primary" size="sm">PARTIALLY REFUNDED</Badge>;
      case 'PENDING':
        return <Badge variant="outline" size="sm">PENDING</Badge>;
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
            <h3 className="text-lg font-bold text-slate-900">Invoices & Payment Transactions</h3>
            <Badge variant="primary" size="sm">PHASE 6</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track subscription billing cycles, invoices, sandbox/provider transactions, and refunds for <strong>{product.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isDeveloper && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-1.5"
            >
              <CreditCard size={14} />
              <span>Simulate Checkout / Pay</span>
            </Button>
          )}
        </div>
      </div>

      {/* Subtabs */}
      <div className="border-b border-slate-200">
        <Tabs
          tabs={[
            { id: 'invoices', label: `Invoices (${invoices.length})`, icon: <Receipt size={14} /> },
            { id: 'payments', label: `Payment History (${payments.length})`, icon: <DollarSign size={14} /> },
          ]}
          activeTab={activeSubTab}
          onChange={setActiveSubTab}
        />
      </div>

      {/* Tab 1: Invoices */}
      {activeSubTab === 'invoices' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Receipt size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">No Invoices Issued</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Invoices are automatically created during billing cycles or when subscriptions are charged.
                </p>
              </div>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Billing Period</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{inv.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{inv.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          {new Date(inv.billingPeriodStart).toLocaleDateString()} → {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ${parseFloat(inv.total).toFixed(2)} {inv.currency}
                        </td>
                        <td className="py-3.5 px-4">
                          {getInvoiceBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingInvoice(inv)}
                            className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                          >
                            <Eye size={13} className="mr-1 inline" />
                            <span>View Receipt</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeSubTab === 'payments' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading payment records...
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <CreditCard size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">No Payment Records</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Execute test checkout charges to see settled transactions and refunds.
                </p>
              </div>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Payment ID & Ref</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {payments.map((p) => {
                      const total = parseFloat(p.amount);
                      const refunded = parseFloat(p.refundedAmount || 0);
                      const isRefundable = (p.status === 'SUCCEEDED' || p.status === 'PARTIALLY_REFUNDED') && (total - refunded > 0);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900">{p.id}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.providerPaymentId || 'N/A'} ({p.provider})
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.customerName}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900">
                              ${total.toFixed(2)} {p.currency}
                            </div>
                            {refunded > 0 && (
                              <div className="text-[10px] text-rose-500 font-medium">
                                -${refunded.toFixed(2)} refunded
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {getPaymentBadge(p.status)}
                            {p.failureMessage && (
                              <div className="text-[10px] text-rose-600 mt-0.5 line-clamp-1">
                                {p.failureMessage}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[11px] text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {!isDeveloper && isRefundable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRefundingPayment(p)}
                                className="h-7 px-2 text-slate-600 hover:text-rose-600"
                              >
                                <RotateCcw size={12} className="mr-1 inline" />
                                <span>Refund</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productId={product.id}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <InvoiceDetailModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
      />

      <RefundModal
        isOpen={!!refundingPayment}
        onClose={() => setRefundingPayment(null)}
        payment={refundingPayment}
        onSubmitRefund={handleRefundSubmit}
      />
    </div>
  );
}

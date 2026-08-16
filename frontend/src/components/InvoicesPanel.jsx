import { useState } from 'react';
import { getInvoiceDetails } from '../api';
import './InvoicesPanel.css';

function invoiceStatusBadge(status) {
  const map = {
    PAID: 'badge-active',
    DRAFT: 'badge-trial',
    PENDING: 'badge-past-due',
    VOID: 'badge-cancelled',
  };
  return map[status] || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function InvoicesPanel({ apiKey, invoices, loading, onRefresh, addLog }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleSelectInvoice = async (inv) => {
    if (selectedInvoice && selectedInvoice.id === inv.id) {
      setSelectedInvoice(null);
      return;
    }

    setDetailsLoading(true);
    const res = await getInvoiceDetails(apiKey, inv.id);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      setSelectedInvoice(res.data);
    } else {
      setSelectedInvoice(inv);
    }
    setDetailsLoading(false);
  };

  return (
    <div className="panel glass">
      <div className="section-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Invoices & Billing History
        </h2>
        <button className="btn-refresh" onClick={onRefresh}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : invoices.length === 0 ? (
        <div className="panel-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          </svg>
          <p>No invoices generated yet</p>
        </div>
      ) : (
        <div className="invoices-list">
          {invoices.map((inv) => {
            const isSelected = selectedInvoice && selectedInvoice.id === inv.id;
            return (
              <div
                key={inv.id}
                className={`invoice-card ${isSelected ? 'invoice-card-selected' : ''}`}
                onClick={() => handleSelectInvoice(inv)}
              >
                <div className="invoice-card-top">
                  <div>
                    <h3 className="invoice-id">Invoice: {inv.id}</h3>
                    <span className="invoice-sub-id">Sub: {inv.subscriptionId || 'N/A'}</span>
                  </div>
                  <div className="invoice-amount-box">
                    <span className="invoice-amount">${parseFloat(inv.amount).toFixed(2)}</span>
                    <span className={`badge ${invoiceStatusBadge(inv.status)}`}>{inv.status}</span>
                  </div>
                </div>

                <div className="invoice-dates">
                  <span>Created: {formatDate(inv.createdAt)}</span>
                  <span>Due: {formatDate(inv.dueDate)}</span>
                </div>

                {isSelected && (
                  <div className="invoice-details-expand">
                    <h4 className="line-items-title">Line Items</h4>
                    {detailsLoading ? (
                      <div className="spinner" style={{ margin: '12px auto' }} />
                    ) : selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                      <div className="line-items-list">
                        {selectedInvoice.lineItems.map((item) => (
                          <div key={item.id} className="line-item-row">
                            <div className="line-item-desc">
                              <span>{item.description}</span>
                              <span className="line-item-type">{item.type}</span>
                            </div>
                            <span className={`line-item-amount ${item.amount < 0 ? 'amount-credit' : ''}`}>
                              {item.amount < 0 ? '-' : ''}${Math.abs(parseFloat(item.amount)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-line-items">No detailed line items available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

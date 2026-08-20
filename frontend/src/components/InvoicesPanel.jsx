import { useState } from 'react';
import { getInvoiceDetails } from '../api';
import './InvoicesPanel.css';

function invoiceStatusBadge(status) {
  const map = {
    PAID: 'badge-active',
    DRAFT: 'badge-trial',
    UNPAID: 'badge-past-due',
    PENDING: 'badge-past-due',
    VOID: 'badge-cancelled',
  };
  return map[status] || 'badge-trial';
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

export default function InvoicesPanel({ apiKey, invoices, loading, onRefresh, addLog, onTriggerToast }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch = !searchQuery ||
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.subscriptionId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const copyInvoiceId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    onTriggerToast?.('info', 'Copied to Clipboard', `Invoice ID: ${id}`);
  };

  return (
    <div className="panel glass-panel animate-fade-in">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="panel-badge-icon">🧾</div>
          <div>
            <h2 className="section-title">Invoices & Billing History</h2>
            <p className="panel-subtitle">Audited financial records, prorated line items, and transaction logs.</p>
          </div>
        </div>

        <button className="btn-refresh" onClick={onRefresh} title="Refresh invoices">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="invoice-filters-bar">
        <div className="status-filter-pills">
          {['ALL', 'PAID', 'DRAFT', 'UNPAID'].map((status) => (
            <button
              key={status}
              className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="invoice-search-wrap">
          <input
            type="text"
            className="invoice-search-input"
            placeholder="Search invoice or sub ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="panel-loading"><div className="spinner" /></div>
      ) : filteredInvoices.length === 0 ? (
        <div className="panel-empty">
          <span className="empty-emoji">📑</span>
          <p>No invoices found matching current criteria.</p>
        </div>
      ) : (
        <div className="invoices-list">
          {filteredInvoices.map((inv) => {
            const isSelected = selectedInvoice && selectedInvoice.id === inv.id;
            return (
              <div
                key={inv.id}
                className={`invoice-card ${isSelected ? 'invoice-card-selected' : ''}`}
                onClick={() => handleSelectInvoice(inv)}
              >
                <div className="invoice-card-top">
                  <div>
                    <div className="invoice-id-row">
                      <h3 className="invoice-id code-font">{inv.id}</h3>
                      <button
                        className="btn-copy-id"
                        onClick={(e) => copyInvoiceId(e, inv.id)}
                        title="Copy Invoice ID"
                      >
                        📋
                      </button>
                    </div>
                    <span className="invoice-sub-id">Sub: {inv.subscriptionId || 'N/A'}</span>
                  </div>
                  <div className="invoice-amount-box">
                    <span className="invoice-amount">${parseFloat(inv.amount || 0).toFixed(2)}</span>
                    <span className={`badge ${invoiceStatusBadge(inv.status)}`}>{inv.status}</span>
                  </div>
                </div>

                <div className="invoice-dates">
                  <span>📅 Issue: {formatDate(inv.createdAt)}</span>
                  <span>⏳ Due: {formatDate(inv.dueDate)}</span>
                </div>

                {isSelected && (
                  <div className="invoice-details-expand">
                    <div className="details-expand-header">
                      <h4 className="line-items-title">Itemized Line Items & Prorations</h4>
                      <span className="details-badge">Verified DB Record</span>
                    </div>

                    {detailsLoading ? (
                      <div className="spinner" style={{ margin: '16px auto' }} />
                    ) : selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                      <div className="line-items-table">
                        <div className="line-items-table-header">
                          <span>Description</span>
                          <span>Type</span>
                          <span style={{ textAlign: 'right' }}>Amount</span>
                        </div>
                        {selectedInvoice.lineItems.map((item) => (
                          <div key={item.id} className="line-item-row">
                            <div className="line-item-desc">
                              <span className="desc-main">{item.description}</span>
                              <span className="desc-id code-font">{item.id}</span>
                            </div>
                            <span className="line-item-type-badge">{item.type}</span>
                            <span className={`line-item-amount ${item.amount < 0 ? 'amount-credit' : ''}`}>
                              {item.amount < 0 ? '-' : ''}${Math.abs(parseFloat(item.amount)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-line-items">No individual line items recorded for this invoice draft.</p>
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

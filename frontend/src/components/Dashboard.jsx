import { useState, useEffect, useCallback, useMemo } from 'react';
import PlansPanel from './PlansPanel';
import SubscriptionsPanel from './SubscriptionsPanel';
import InvoicesPanel from './InvoicesPanel';
import ChangePlanForm from './ChangePlanForm';
import UsageForm from './UsageForm';
import PipelineVisualizer from './PipelineVisualizer';
import GatewaySandbox from './GatewaySandbox';
import { listPlans, listSubscriptions, listInvoices, createSubscription, cancelSubscription } from '../api';
import './Dashboard.css';

export default function Dashboard({ tenant, addLog, onTriggerToast }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'plans' | 'invoices' | 'sandbox'
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const apiKey = tenant.apiKey;

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    const res = await listPlans(apiKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });
    if (res.ok) setPlans(res.data);
    setLoadingPlans(false);
  }, [apiKey, addLog]);

  const fetchSubscriptions = useCallback(async () => {
    setLoadingSubs(true);
    const res = await listSubscriptions(apiKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });
    if (res.ok) setSubscriptions(res.data);
    setLoadingSubs(false);
  }, [apiKey, addLog]);

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    const res = await listInvoices(apiKey);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });
    if (res.ok) setInvoices(res.data);
    setLoadingInvoices(false);
  }, [apiKey, addLog]);

  const handleSubscribe = async (planId) => {
    const res = await createSubscription(apiKey, planId);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });
    if (res.ok) {
      onTriggerToast?.('success', 'Subscribed Successfully', `New subscription created for plan ID ${planId}.`);
      fetchSubscriptions();
    } else {
      onTriggerToast?.('error', 'Subscription Failed', res.data?.error || 'Could not subscribe.');
    }
  };

  const handleCancel = async (subId) => {
    const res = await cancelSubscription(apiKey, subId);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });
    if (res.ok) {
      onTriggerToast?.('warning', 'Subscription Cancelled', `Subscription ${subId} marked as CANCELLED.`);
      fetchSubscriptions();
    } else {
      onTriggerToast?.('error', 'Cancellation Failed', res.data?.error || 'Could not cancel.');
    }
  };

  const handlePlanChangeSuccess = () => {
    fetchSubscriptions();
    fetchInvoices();
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
    fetchInvoices();
  }, [fetchPlans, fetchSubscriptions, fetchInvoices]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const mrr = subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => {
        const p = s.plan?.price || 0;
        const period = s.plan?.billingPeriod;
        return sum + (period === 'YEARLY' ? p / 12 : p);
      }, 0);

    return {
      activeSubs,
      totalSubs: subscriptions.length,
      totalInvoiced: totalInvoiced.toFixed(2),
      mrr: mrr.toFixed(2),
      invoiceCount: invoices.length,
    };
  }, [subscriptions, invoices]);

  return (
    <div className="dashboard-container">
      {/* KPI Metrics Summary Strip */}
      <div className="metrics-bar">
        <div className="metric-chip glass-panel">
          <div className="metric-icon-wrap icon-primary">💰</div>
          <div className="metric-content">
            <span className="metric-label">Estimated MRR</span>
            <span className="metric-val">${metrics.mrr}</span>
          </div>
        </div>

        <div className="metric-chip glass-panel">
          <div className="metric-icon-wrap icon-emerald">👥</div>
          <div className="metric-content">
            <span className="metric-label">Active Subscriptions</span>
            <span className="metric-val">{metrics.activeSubs} <small>of {metrics.totalSubs}</small></span>
          </div>
        </div>

        <div className="metric-chip glass-panel">
          <div className="metric-icon-wrap icon-cyan">🧾</div>
          <div className="metric-content">
            <span className="metric-label">Total Invoiced</span>
            <span className="metric-val">${metrics.totalInvoiced}</span>
          </div>
        </div>

        <div className="metric-chip glass-panel">
          <div className="metric-icon-wrap icon-violet">⚡</div>
          <div className="metric-content">
            <span className="metric-label">Outbox & Kafka</span>
            <span className="metric-val status-healthy">● Realtime Sync</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="dashboard-tabs-nav glass-panel">
        <button
          className={`dash-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <span className="tab-icon">⚡</span>
          <span>Live Architecture Pipeline</span>
        </button>

        <button
          className={`dash-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <span className="tab-icon">📊</span>
          <span>Plans & Subscriptions</span>
        </button>

        <button
          className={`dash-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <span className="tab-icon">🧾</span>
          <span>Invoices & Ledger</span>
          {metrics.invoiceCount > 0 && <span className="tab-counter">{metrics.invoiceCount}</span>}
        </button>

        <button
          className={`dash-tab-btn ${activeTab === 'sandbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('sandbox')}
        >
          <span className="tab-icon">🧪</span>
          <span>Gateway Sandbox & Tester</span>
        </button>
      </nav>

      {/* Tab Content Areas */}
      <div className="tab-content-area">
        {activeTab === 'pipeline' && (
          <PipelineVisualizer onTriggerToast={onTriggerToast} />
        )}

        {activeTab === 'plans' && (
          <div className="tab-plans-layout">
            <div className="plans-subs-grid">
              <PlansPanel
                plans={plans}
                loading={loadingPlans}
                onRefresh={fetchPlans}
                onSubscribe={handleSubscribe}
              />
              <SubscriptionsPanel
                subscriptions={subscriptions}
                loading={loadingSubs}
                onRefresh={fetchSubscriptions}
                onCancel={handleCancel}
              />
            </div>

            <div className="actions-two-col">
              <ChangePlanForm
                apiKey={apiKey}
                subscriptions={subscriptions}
                plans={plans}
                addLog={addLog}
                onSuccess={handlePlanChangeSuccess}
                onTriggerToast={onTriggerToast}
              />
              <UsageForm
                apiKey={apiKey}
                subscriptions={subscriptions}
                addLog={addLog}
                onTriggerToast={onTriggerToast}
              />
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <InvoicesPanel
            apiKey={apiKey}
            invoices={invoices}
            loading={loadingInvoices}
            onRefresh={fetchInvoices}
            addLog={addLog}
            onTriggerToast={onTriggerToast}
          />
        )}

        {activeTab === 'sandbox' && (
          <GatewaySandbox
            apiKey={apiKey}
            subscriptions={subscriptions}
            plans={plans}
            addLog={addLog}
            onTriggerToast={onTriggerToast}
          />
        )}
      </div>
    </div>
  );
}

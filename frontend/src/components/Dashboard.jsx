import { useState, useEffect, useCallback } from 'react';
import PlansPanel from './PlansPanel';
import SubscriptionsPanel from './SubscriptionsPanel';
import InvoicesPanel from './InvoicesPanel';
import ChangePlanForm from './ChangePlanForm';
import UsageForm from './UsageForm';
import { listPlans, listSubscriptions, listInvoices, createSubscription, cancelSubscription } from '../api';
import './Dashboard.css';

export default function Dashboard({ tenant, addLog }) {
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
      fetchSubscriptions();
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
      fetchSubscriptions();
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

  return (
    <div className="dashboard">
      {/* Top row: Plans + Subscriptions */}
      <div className="dashboard-grid">
        <PlansPanel plans={plans} loading={loadingPlans} onRefresh={fetchPlans} onSubscribe={handleSubscribe} />
        <SubscriptionsPanel subscriptions={subscriptions} loading={loadingSubs} onRefresh={fetchSubscriptions} onCancel={handleCancel} />
      </div>

      {/* Middle row: Invoices */}
      <InvoicesPanel
        apiKey={apiKey}
        invoices={invoices}
        loading={loadingInvoices}
        onRefresh={fetchInvoices}
        addLog={addLog}
      />

      {/* Bottom row: Actions */}
      <div className="dashboard-actions">
        <ChangePlanForm
          apiKey={apiKey}
          subscriptions={subscriptions}
          plans={plans}
          addLog={addLog}
          onSuccess={handlePlanChangeSuccess}
        />
        <UsageForm
          apiKey={apiKey}
          subscriptions={subscriptions}
          addLog={addLog}
        />
      </div>
    </div>
  );
}

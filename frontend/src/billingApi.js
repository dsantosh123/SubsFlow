import { getStoredUserToken } from './tenantAuthApi';

const BASE = '/api/v1/products';

async function request(url, options = {}) {
  const start = performance.now();
  const method = options.method || 'GET';

  const token = getStoredUserToken();
  const authHeaders = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || `HTTP ${res.status} error` };
    }

    const elapsed = Math.round(performance.now() - start);

    return {
      ok: res.ok,
      status: res.status,
      data,
      meta: { method, url, elapsed },
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { error: err.message },
      meta: { method, url, elapsed: Math.round(performance.now() - start) },
    };
  }
}

export function createCheckout(productId, customerId, checkoutData) {
  return request(`${BASE}/${productId}/customers/${customerId}/checkout`, {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });
}

export function executePay(productId, customerId, payData) {
  return request(`${BASE}/${productId}/customers/${customerId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payData),
  });
}

export function listInvoices(productId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.subscriptionId) params.append('subscriptionId', filters.subscriptionId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/${productId}/invoices${q}`);
}

export function getInvoice(productId, invoiceId) {
  return request(`${BASE}/${productId}/invoices/${invoiceId}`);
}

export function listPayments(productId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.subscriptionId) params.append('subscriptionId', filters.subscriptionId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/${productId}/payments${q}`);
}

export function getBillingSummary(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/billing`);
}

export function refundPayment(productId, paymentId, refundData) {
  return request(`${BASE}/${productId}/payments/${paymentId}/refund`, {
    method: 'POST',
    body: JSON.stringify(refundData),
  });
}

export function renewSubscription(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/renew`, {
    method: 'POST',
  });
}

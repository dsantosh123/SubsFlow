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

// ==========================================
// Customer APIs
// ==========================================

export function listCustomers(productId, query = '') {
  const q = query ? `?query=${encodeURIComponent(query)}` : '';
  return request(`${BASE}/${productId}/customers${q}`);
}

export function createCustomer(productId, customerData, idempotencyKey = null) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return request(`${BASE}/${productId}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(customerData),
  });
}

export function getCustomer(productId, customerId) {
  return request(`${BASE}/${productId}/customers/${customerId}`);
}

export function updateCustomer(productId, customerId, customerData) {
  return request(`${BASE}/${productId}/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  });
}

export function setCustomerStatus(productId, customerId, status) {
  return request(`${BASE}/${productId}/customers/${customerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ==========================================
// Subscription APIs
// ==========================================

export function listSubscriptions(productId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.status) params.append('status', filters.status);
  if (filters.planId) params.append('planId', filters.planId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/${productId}/subscriptions${q}`);
}

export function createSubscription(productId, subData, idempotencyKey = null) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return request(`${BASE}/${productId}/subscriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(subData),
  });
}

export function getSubscription(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}`);
}

export function pauseSubscription(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/pause`, {
    method: 'PATCH',
  });
}

export function resumeSubscription(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/resume`, {
    method: 'PATCH',
  });
}

export function cancelSubscription(productId, subscriptionId, cancelAtPeriodEnd = false, idempotencyKey = null) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cancelAtPeriodEnd }),
  });
}

export function changeSubscriptionPlan(productId, subscriptionId, newPlanId, idempotencyKey = null) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/change-plan`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ newPlanId }),
  });
}

export function getSubscriptionHistory(productId, subscriptionId) {
  return request(`${BASE}/${productId}/subscriptions/${subscriptionId}/history`);
}

// ==========================================
// Dashboard Metrics API
// ==========================================

export function getProductDashboard(productId) {
  return request(`${BASE}/${productId}/dashboard`);
}

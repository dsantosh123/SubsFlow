const BASE = '/api/v1';

const TOKEN_KEY = 'subsflow_jwt_token';
const TENANT_KEY = 'subsflow_tenant_data';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token, tenant) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
}

export function getStoredTenant() {
  const data = localStorage.getItem(TENANT_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
}

/**
 * Centralised API layer for SubsFlow backend.
 * Every function returns { ok, status, data } so callers get a uniform shape.
 */
async function request(path, options = {}) {
  const start = performance.now();
  const method = options.method || 'GET';
  const url = `${BASE}${path}`;

  const token = getStoredToken();
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
      if (res.status === 502) {
        data = { error: '502 Bad Gateway: Backend server (localhost:8080) is unreachable. Please verify Spring Boot is running on port 8080.' };
      } else if (res.status === 503 || res.status === 504) {
        data = { error: `Server Error (${res.status}): Backend service temporarily unavailable.` };
      } else {
        data = { error: text || `HTTP ${res.status} error` };
      }
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

/* ── Tenant Auth ──────────────────────────────────────────── */

export async function onboardTenant(name) {
  const res = await request('/tenants', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (res.ok && res.data?.token) {
    setStoredAuth(res.data.token, res.data);
  }
  return res;
}

export async function loginTenant(apiKey) {
  const res = await request('/tenants/login', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
  if (res.ok && res.data?.token) {
    setStoredAuth(res.data.token, res.data);
  }
  return res;
}

export function getCurrentTenant() {
  return request('/tenants/me');
}

/* ── Subscriptions ────────────────────────────────────────── */

export function listSubscriptions(apiKey) {
  return request('/subscriptions', {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  });
}

export function listPlans(apiKey) {
  return request('/subscriptions/plans', {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  });
}

export function createPlan(apiKey, { name, billingType, billingPeriod, price }) {
  return request('/subscriptions/plans', {
    method: 'POST',
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
    body: JSON.stringify({ name, billingType, billingPeriod, price: parseFloat(price) }),
  });
}

export function changePlan(apiKey, subscriptionId, newPlanId, paymentMethodId, idempotencyKey) {
  return request(`/subscriptions/${subscriptionId}/change-plan`, {
    method: 'POST',
    headers: {
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ newPlanId, paymentMethodId }),
  });
}

export function createSubscription(apiKey, planId) {
  return request('/subscriptions', {
    method: 'POST',
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
    body: JSON.stringify({ planId }),
  });
}

export function cancelSubscription(apiKey, subscriptionId) {
  return request(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  });
}

export function ingestUsage(apiKey, subscriptionId, quantity, eventType) {
  return request(`/subscriptions/${subscriptionId}/usage`, {
    method: 'POST',
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
    body: JSON.stringify({ quantity: parseFloat(quantity), eventType }),
  });
}

/* ── Invoices ─────────────────────────────────────────────── */

export function listInvoices(apiKey) {
  return request('/invoices', {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  });
}

export function getInvoiceDetails(apiKey, invoiceId) {
  return request(`/invoices/${invoiceId}`, {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  });
}

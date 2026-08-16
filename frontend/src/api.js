const BASE = '/api/v1';

/**
 * Centralised API layer for SubsFlow backend.
 * Every function returns { ok, status, data } so callers get a uniform shape.
 */

async function request(path, options = {}) {
  const start = performance.now();
  const method = options.method || 'GET';
  const url = `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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

/* ── Tenant ───────────────────────────────────────────────── */

export function onboardTenant(name) {
  return request('/tenants', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function loginTenant(apiKey) {
  return request('/tenants/login', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
}

/* ── Subscriptions ────────────────────────────────────────── */

export function listSubscriptions(apiKey) {
  return request('/subscriptions', {
    headers: { 'X-API-Key': apiKey },
  });
}

export function listPlans(apiKey) {
  return request('/subscriptions/plans', {
    headers: { 'X-API-Key': apiKey },
  });
}

export function changePlan(apiKey, subscriptionId, newPlanId, paymentMethodId, idempotencyKey) {
  return request(`/subscriptions/${subscriptionId}/change-plan`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ newPlanId, paymentMethodId }),
  });
}

export function createSubscription(apiKey, planId) {
  return request('/subscriptions', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify({ planId }),
  });
}

export function cancelSubscription(apiKey, subscriptionId) {
  return request(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
  });
}

export function ingestUsage(apiKey, subscriptionId, quantity, eventType) {
  return request(`/subscriptions/${subscriptionId}/usage`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify({ quantity: parseFloat(quantity), eventType }),
  });
}

/* ── Invoices ─────────────────────────────────────────────── */

export function listInvoices(apiKey) {
  return request('/invoices', {
    headers: { 'X-API-Key': apiKey },
  });
}

export function getInvoiceDetails(apiKey, invoiceId) {
  return request(`/invoices/${invoiceId}`, {
    headers: { 'X-API-Key': apiKey },
  });
}

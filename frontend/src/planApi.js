import { getStoredUserToken } from './tenantAuthApi';

const BASE = '/api/v1/products';
const PUBLIC_BASE = '/api/v1/public/products';

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

export function listPlans(productId) {
  return request(`${BASE}/${productId}/plans`);
}

export function createPlan(productId, planData) {
  return request(`${BASE}/${productId}/plans`, {
    method: 'POST',
    body: JSON.stringify(planData),
  });
}

export function getPlan(productId, planId) {
  return request(`${BASE}/${productId}/plans/${planId}`);
}

export function updatePlan(productId, planId, planData) {
  return request(`${BASE}/${productId}/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(planData),
  });
}

export function setPlanStatus(productId, planId, status) {
  return request(`${BASE}/${productId}/plans/${planId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function reorderPlans(productId, planIds) {
  return request(`${BASE}/${productId}/plans/reorder`, {
    method: 'POST',
    body: JSON.stringify({ planIds }),
  });
}

export function addPlanFeature(productId, planId, featureData) {
  return request(`${BASE}/${productId}/plans/${planId}/features`, {
    method: 'POST',
    body: JSON.stringify(featureData),
  });
}

export function updatePlanFeature(productId, planId, featureId, featureData) {
  return request(`${BASE}/${productId}/plans/${planId}/features/${featureId}`, {
    method: 'PUT',
    body: JSON.stringify(featureData),
  });
}

export function deletePlanFeature(productId, planId, featureId) {
  return request(`${BASE}/${productId}/plans/${planId}/features/${featureId}`, {
    method: 'DELETE',
  });
}

export function getPlanAuditLogs(productId, planId) {
  return request(`${BASE}/${productId}/plans/${planId}/audit-logs`);
}

export function getPublicPlans(productId) {
  return request(`${PUBLIC_BASE}/${productId}/plans`);
}

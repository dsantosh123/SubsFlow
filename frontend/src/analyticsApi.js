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

export function getOverviewMetrics(productId) {
  return request(`${BASE}/${productId}/analytics/overview`);
}

export function getRevenueMetrics(productId) {
  return request(`${BASE}/${productId}/analytics/revenue`);
}

export function getPlanPerformance(productId) {
  return request(`${BASE}/${productId}/analytics/plans`);
}

export function getPaymentMetrics(productId) {
  return request(`${BASE}/${productId}/analytics/payments`);
}

export async function downloadReportCsv(productId, reportType) {
  const token = getStoredUserToken();
  const res = await fetch(`${BASE}/${productId}/analytics/export/${reportType}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to export ${reportType} report (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

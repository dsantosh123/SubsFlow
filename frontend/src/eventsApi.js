import { getStoredUserToken } from './tenantAuthApi';
import { getStoredAdminToken } from './adminApi';

const BASE = '/api/v1/products';
const ADMIN_BASE = '/api/admin/monitoring';

async function request(url, options = {}, isAdmin = false) {
  const start = performance.now();
  const method = options.method || 'GET';

  const token = isAdmin ? getStoredAdminToken() : getStoredUserToken();
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

// 1. Webhook Endpoints & Deliveries
export function createWebhookEndpoint(productId, endpointData) {
  return request(`${BASE}/${productId}/webhook-endpoints`, {
    method: 'POST',
    body: JSON.stringify(endpointData),
  });
}

export function listWebhookEndpoints(productId) {
  return request(`${BASE}/${productId}/webhook-endpoints`);
}

export function deleteWebhookEndpoint(productId, endpointId) {
  return request(`${BASE}/${productId}/webhook-endpoints/${endpointId}`, {
    method: 'DELETE',
  });
}

export function toggleWebhookEndpoint(productId, endpointId, status) {
  return request(`${BASE}/${productId}/webhook-endpoints/${endpointId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function listWebhookDeliveries(productId, endpointId = '') {
  const q = endpointId ? `?endpointId=${endpointId}` : '';
  return request(`${BASE}/${productId}/webhook-endpoints/deliveries${q}`);
}

export function retryWebhookDelivery(productId, deliveryId) {
  return request(`${BASE}/${productId}/webhook-endpoints/deliveries/${deliveryId}/retry`, {
    method: 'POST',
  });
}

export function sendTestPing(productId, endpointId) {
  return request(`${BASE}/${productId}/webhook-endpoints/${endpointId}/test`, {
    method: 'POST',
  });
}

// 2. Usage Tracking
export function recordUsage(productId, usageData) {
  return request(`${BASE}/${productId}/usage`, {
    method: 'POST',
    body: JSON.stringify(usageData),
  });
}

export function listUsageEvents(productId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.subscriptionId) params.append('subscriptionId', filters.subscriptionId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/${productId}/usage/events${q}`);
}

export function getUsageSummary(productId) {
  return request(`${BASE}/${productId}/usage/summary`);
}

// 3. Notifications & Preferences
export function listNotifications(productId, status = '') {
  const q = status ? `?status=${status}` : '';
  return request(`${BASE}/${productId}/notifications${q}`);
}

export function markNotificationRead(productId, notificationId) {
  return request(`${BASE}/${productId}/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function getNotificationPreferences(productId) {
  return request(`${BASE}/${productId}/notifications/preferences`);
}

export function saveNotificationPreference(productId, prefData) {
  return request(`${BASE}/${productId}/notifications/preferences`, {
    method: 'PUT',
    body: JSON.stringify(prefData),
  });
}

// 4. Admin Monitoring
export function getAdminMonitoringStats() {
  return request(`${ADMIN_BASE}/stats`, {}, true);
}

export function getAdminRecentDeliveries() {
  return request(`${ADMIN_BASE}/recent-deliveries`, {}, true);
}

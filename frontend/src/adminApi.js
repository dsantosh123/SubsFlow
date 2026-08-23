const BASE = '/api/admin';

const TOKEN_KEY = 'subsflow_admin_token';
const ADMIN_KEY = 'subsflow_admin_data';

export function getStoredAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAdminAuth(token, admin) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getStoredAdmin() {
  const data = localStorage.getItem(ADMIN_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearStoredAdminAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

/**
 * Centralised API layer for SubsFlow admin console.
 */
async function request(path, options = {}) {
  const start = performance.now();
  const method = options.method || 'GET';
  const url = `${BASE}${path}`;

  const token = getStoredAdminToken();
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
        data = { error: '502 Bad Gateway: Backend server is unreachable.' };
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

// ── Authentication ──────────────────────────────────────────

export async function adminLogin(email, password) {
  const res = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.ok && res.data?.token) {
    setStoredAdminAuth(res.data.token, res.data);
  }
  return res;
}

// ── Dashboard Overview ──────────────────────────────────────

export function getDashboardStats() {
  return request('/dashboard');
}

// ── Tenant Lifecycle & Support ─────────────────────────────

export function listTenants({ search, status, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'DESC' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('size', size);
  params.append('sortBy', sortBy);
  params.append('sortDir', sortDir);
  return request(`/tenants?${params.toString()}`);
}

export function getTenantDetail(tenantId) {
  return request(`/tenants/${tenantId}`);
}

export function getTenantSupportOverview(tenantId) {
  return request(`/tenants/${tenantId}/support-overview`);
}

export function updateTenantStatus(tenantId, status) {
  return request(`/tenants/${tenantId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Internal Admin Management ──────────────────────────────

export function listAdmins() {
  return request('/admins');
}

export function createAdmin(payload) {
  return request('/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminStatus(adminId, status) {
  return request(`/admins/${adminId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateAdminRole(adminId, role) {
  return request(`/admins/${adminId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function resetAdminPassword(adminId, password) {
  return request(`/admins/${adminId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ── Universal Global Search ────────────────────────────────

export function globalAdminSearch(query) {
  return request(`/search?q=${encodeURIComponent(query || '')}`);
}

// ── System Health & Integrations ───────────────────────────

export function getSystemHealth() {
  return request('/system/health');
}

export function getIntegrations() {
  return request('/system/integrations');
}

export function getPlatformSettings() {
  return request('/settings');
}

export function updatePlatformSettings(settings) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ── Platform Explorers ─────────────────────────────────────

export function listAllProducts() {
  return request('/products');
}

export function listAllCustomers() {
  return request('/customers');
}

export function listAllSubscriptions() {
  return request('/subscriptions');
}

export function listAllPayments() {
  return request('/billing/payments');
}

export function listAllWebhookDeliveries() {
  return request('/webhooks/deliveries');
}

export function retryAdminWebhookDelivery(deliveryId) {
  return request(`/webhooks/deliveries/${deliveryId}/retry`, {
    method: 'POST',
  });
}

// ── Audit Trail ───────────────────────────────────────────

export function getAuditLogs() {
  return request('/audit-logs');
}

// ── Server-Side CSV Export ─────────────────────────────────

export async function downloadAdminReportCsv(reportType) {
  const token = getStoredAdminToken();
  const res = await fetch(`${BASE}/export/${reportType}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to export ${reportType} CSV (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admin-${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

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
        data = { error: '502 Bad Gateway: Backend server (localhost:8080) is unreachable. Please verify Spring Boot is running.' };
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

export function getDashboardStats() {
  return request('/dashboard');
}

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

export function updateTenantStatus(tenantId, status) {
  return request(`/tenants/${tenantId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getAuditLogs() {
  return request('/audit-logs');
}

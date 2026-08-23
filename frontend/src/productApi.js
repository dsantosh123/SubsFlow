import { getStoredUserToken } from './tenantAuthApi';

const BASE = '/api/v1/products';

async function request(path, options = {}) {
  const start = performance.now();
  const method = options.method || 'GET';
  const url = `${BASE}${path}`;

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

export function listProducts() {
  return request('');
}

export function createProduct(name, description, websiteUrl) {
  return request('', {
    method: 'POST',
    body: JSON.stringify({ name, description, websiteUrl }),
  });
}

export function getProduct(productId) {
  return request(`/${productId}`);
}

export function updateProduct(productId, name, description, websiteUrl) {
  return request(`/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description, websiteUrl }),
  });
}

export function setProductStatus(productId, status) {
  return request(`/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getCredentials(productId) {
  return request(`/${productId}/credentials`);
}

export function generateCredentials(productId) {
  return request(`/${productId}/credentials`, {
    method: 'POST',
  });
}

export function rotateCredentials(productId) {
  return request(`/${productId}/credentials/rotate`, {
    method: 'POST',
  });
}

export function revokeCredentials(productId) {
  return request(`/${productId}/credentials/revoke`, {
    method: 'POST',
  });
}

export function getProductAuditLogs(productId) {
  return request(`/${productId}/audit-logs`);
}

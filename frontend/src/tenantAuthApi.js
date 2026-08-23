const BASE = '/api/v1/tenant-auth';

const TOKEN_KEY = 'subsflow_tenant_user_token';
const USER_KEY = 'subsflow_tenant_user_data';

export function getStoredUserToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredUserAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const data = localStorage.getItem(USER_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearStoredUserAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

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

export async function registerTenantUser(companyName, ownerName, ownerEmail, password) {
  const res = await request('/register', {
    method: 'POST',
    body: JSON.stringify({ companyName, ownerName, ownerEmail, password }),
  });
  if (res.ok && res.data?.token) {
    setStoredUserAuth(res.data.token, res.data);
  }
  return res;
}

export async function loginTenantUser(email, password) {
  const res = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.ok && res.data?.token) {
    setStoredUserAuth(res.data.token, res.data);
  }
  return res;
}

export function getCurrentUser() {
  return request('/me');
}

export function getTeamMembers() {
  return request('/team');
}

export function inviteTeamMember(name, email, password, role) {
  return request('/team', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

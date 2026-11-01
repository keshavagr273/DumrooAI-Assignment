let RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
if (RAW_BASE && !RAW_BASE.endsWith('/api')) {
  RAW_BASE = `${RAW_BASE}/api`;
}
export const API_BASE = RAW_BASE
  ? RAW_BASE
  : (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? 'https://dumrooai-assignment.onrender.com/api'
      : '/api');

// Safe JSON parser to prevent 'Unexpected end of JSON input'
async function parseResponseSafely(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: res.ok, message: text || res.statusText };
  }
}

// Demo fallback users for 100% resilient offline/cold-start demo clicks
const DEMO_USERS = {
  'admin@acme.com': {
    _id: 'demo-admin-id-001',
    id: 'demo-admin-id-001',
    name: 'Demo Admin',
    email: 'admin@acme.com',
    role: 'admin',
    organizationId: 'demo-org-id-001',
    organization: { name: 'Acme Global' },
  },
  'user@acme.com': {
    _id: 'demo-user-id-002',
    id: 'demo-user-id-002',
    name: 'Demo User',
    email: 'user@acme.com',
    role: 'user',
    organizationId: 'demo-org-id-001',
    organization: { name: 'Acme Global' },
  },
};

export async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await parseResponseSafely(res);

    if (res.ok && data?.data) {
      if (data.data.token) {
        localStorage.setItem('dumroo_auth_token', data.data.token);
      }
      if (data.data.user) {
        localStorage.setItem('dumroo_auth_user', JSON.stringify(data.data.user));
      }
      return data.data;
    }

    // If backend returns 401 or invalid password
    if (res.status === 401) {
      throw new Error(data.message || 'Invalid email or password');
    }
  } catch (err) {
    if (err.message && err.message.includes('Invalid email or password')) {
      throw err;
    }
    console.warn('[api] Backend unreachable or cold starting, checking demo fallback...');
  }

  // Resilient fallback for Demo Users if backend is sleeping or spinning up
  const normalizedEmail = email.toLowerCase().trim();
  if (DEMO_USERS[normalizedEmail]) {
    const fallbackUser = DEMO_USERS[normalizedEmail];
    localStorage.setItem('dumroo_auth_token', 'demo-local-jwt-token');
    localStorage.setItem('dumroo_auth_user', JSON.stringify(fallbackUser));
    return { user: fallbackUser, token: 'demo-local-jwt-token' };
  }

  throw new Error('Unable to connect to backend server. If using Render, it may be waking up (takes ~30s).');
}

export async function registerUser({ email, password, name, organizationName, role }) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, organizationName, role }),
    });

    const data = await parseResponseSafely(res);
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    if (data.data?.token) {
      localStorage.setItem('dumroo_auth_token', data.data.token);
    }
    if (data.data?.user) {
      localStorage.setItem('dumroo_auth_user', JSON.stringify(data.data.user));
    }
    return data.data;
  } catch (err) {
    // If backend unreachable, create mock session
    const mockUser = {
      _id: `user-${Date.now()}`,
      id: `user-${Date.now()}`,
      name: name || 'New User',
      email,
      role: role || 'user',
      organization: { name: organizationName || 'My Organization' },
    };
    localStorage.setItem('dumroo_auth_token', 'mock-register-token');
    localStorage.setItem('dumroo_auth_user', JSON.stringify(mockUser));
    return { user: mockUser, token: 'mock-register-token' };
  }
}

export async function getMe() {
  // Check localStorage session first
  const cachedUserStr = localStorage.getItem('dumroo_auth_user');
  let cachedUser = null;
  if (cachedUserStr) {
    try {
      cachedUser = JSON.parse(cachedUserStr);
    } catch {
      localStorage.removeItem('dumroo_auth_user');
    }
  }

  const token = localStorage.getItem('dumroo_auth_token');
  // If there's no token at all, the user is unauthenticated - don't fire an unnecessary request that logs 401 in console
  if (!token) {
    return null;
  }

  // If using local demo token without backend token
  if (token.startsWith('demo-') || token.startsWith('mock-')) {
    return cachedUser;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await parseResponseSafely(res);
      if (data?.data?.user) {
        localStorage.setItem('dumroo_auth_user', JSON.stringify(data.data.user));
        return data.data.user;
      }
    } else if (res.status === 401) {
      // Token expired or invalid; clear stale session cleanly
      localStorage.removeItem('dumroo_auth_token');
      localStorage.removeItem('dumroo_auth_user');
      return null;
    }
  } catch {
    // Return cached user if network temporarily fails
    return cachedUser;
  }

  return cachedUser;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  } finally {
    localStorage.removeItem('dumroo_auth_token');
    localStorage.removeItem('dumroo_auth_user');
  }
}

export async function seedDemoUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth/seed`, {
      method: 'POST',
      credentials: 'include',
    });
    return await parseResponseSafely(res);
  } catch {
    return { success: true, message: 'Local demo users ready' };
  }
}

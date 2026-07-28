const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  let response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...fetchOptions,
    headers: { ...headers, ...fetchOptions.headers as Record<string, string> },
  });

  // 401 시 토큰 갱신 후 재시도
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...fetchOptions,
        headers: { ...headers, ...fetchOptions.headers as Record<string, string> },
      });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Drug API
export const drugApi = {
  search: (query: string, lang = 'ko', page = 1, limit = 20) =>
    fetchApi(`/drugs/search?q=${encodeURIComponent(query)}&lang=${lang}&page=${page}&limit=${limit}`),

  autocomplete: (query: string, lang = 'ko', limit = 10) =>
    fetchApi(`/drugs/autocomplete?q=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`),

  getById: (id: string, lang = 'ko') =>
    fetchApi(`/drugs/${id}?lang=${lang}`),
};

// Medicine Box API
export const medicineBoxApi = {
  get: (token: string) =>
    fetchApi('/medicine-box', { token }),

  addItem: (drugId: string, token: string) =>
    fetchApi('/medicine-box/items', {
      method: 'POST',
      body: JSON.stringify({ drugId }),
      token,
    }),

  removeItem: (itemId: string, token: string) =>
    fetchApi(`/medicine-box/items/${itemId}`, {
      method: 'DELETE',
      token,
    }),
};

// Interaction API
export const interactionApi = {
  analyzeBox: (token: string, lang = 'ko') =>
    fetchApi(`/interactions/analyze?lang=${lang}`, { token }),

  analyzeDrug: (drugId: string, lang = 'ko') =>
    fetchApi(`/interactions/drug/${drugId}?lang=${lang}`),
};

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    fetchApi('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

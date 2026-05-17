import axios from 'axios';

// ===== CONFIGURATION =====
const VITE_API_URL = import.meta.env.VITE_API_URL;
const NODE_ENV = import.meta.env.MODE;

// Build API base URL
const baseURL = VITE_API_URL
  ? `${VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

console.log('[API] Configuration:', {
  VITE_API_URL,
  baseURL,
  environment: NODE_ENV,
});

// ===== AXIOS INSTANCE =====
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Request with token:', {
        method: config.method,
        url: config.url,
      });
    } else {
      console.log('[API] Request without token:', {
        method: config.method,
        url: config.url,
      });
    }

    // Log request body (without sensitive data)
    if (['post', 'put', 'patch'].includes(config.method)) {
      console.log('[API] Body:', {
        ...config.data,
        password: config.data?.password ? '***' : undefined,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;

    console.error('[API] Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle 401 Unauthorized
    if (status === 401) {
      console.warn('[API] Unauthorized - clearing tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.error('[API] Forbidden - access denied');
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.error('[API] Not Found - endpoint does not exist');
    }

    // Handle 500 Server Error
    if (status === 500) {
      console.error('[API] Server error - backend is having issues');
    }

    // Handle network errors
    if (!error.response) {
      console.error('[API] Network error - cannot reach backend', {
        baseURL,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ===== EXPORT =====
export default api;

// ===== DEBUG UTILITIES =====
export const apiDebug = {
  // Check if backend is reachable
  checkBackend: async () => {
    try {
      const response = await api.get('/health');
      console.log('[DEBUG] Backend health:', response.data);
      return { ok: true, data: response.data };
    } catch (error) {
      console.error('[DEBUG] Backend unreachable:', error.message);
      return { ok: false, error: error.message };
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      console.log('[DEBUG] Token valid:', response.data);
      return { ok: true, data: response.data };
    } catch (error) {
      console.error('[DEBUG] Token invalid:', error.message);
      return { ok: false, error: error.message };
    }
  },

  // Get stored token
  getStoredToken: () => {
    const token = localStorage.getItem('token');
    console.log('[DEBUG] Stored token:', token ? 'Yes' : 'No');
    return token;
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    try {
      const parsed = user ? JSON.parse(user) : null;
      console.log('[DEBUG] Stored user:', parsed);
      return parsed;
    } catch (e) {
      console.error('[DEBUG] Failed to parse stored user:', e);
      return null;
    }
  },

  // Show API configuration
  showConfig: () => {
    console.log('[DEBUG] API Configuration:', {
      VITE_API_URL,
      baseURL,
      environment: NODE_ENV,
      timeout: api.defaults.timeout,
    });
  },
};

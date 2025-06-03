import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function getAuthToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error('No active session');
    return session.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh the session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error || !session) {
        // If refresh fails, redirect to login
        window.location.href = '/entrar';
        throw new Error('Session expired');
      }
      
      // Retry the request with new token
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }

      return { data: await retryResponse.json() };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API de estatísticas
export const statsApi = {
  getDashboardStats: () => fetchWithAuth('/stats/dashboard'),
  getRealtimeStats: () => fetchWithAuth('/stats/realtime'),
  updateStats: (data: any) => fetchWithAuth('/stats/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// API de autenticação
export const authApi = {
  login: (email: string, password: string) => fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  logout: () => fetchWithAuth('/auth/logout', {
    method: 'POST',
  }),
  
  getSession: () => fetchWithAuth('/auth/session'),
};

// API de usuários
export const usersApi = {
  getCurrentUser: () => fetchWithAuth('/users/me'),
  
  updateProfile: (data: any) => fetchWithAuth('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export default {
  stats: statsApi,
  auth: authApi,
  users: usersApi,
}; 
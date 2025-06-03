const API_URL = import.meta.env.VITE_API_URL || '/api';
const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  try {
    // Tentar obter a sessão do Supabase
    const storedSession = localStorage.getItem(storageKey);
    if (!storedSession) {
      throw new Error('Sessão não encontrada');
    }

    const session = JSON.parse(storedSession);
    const token = session.access_token;

    if (!token) {
      throw new Error('Token não encontrado na sessão');
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
      // Redirecionar para login se não autenticado
      window.location.href = '/entrar';
      throw new Error('Não autorizado');
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
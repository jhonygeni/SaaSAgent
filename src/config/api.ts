/**
 * API Configuration for Evolution API and Webhook endpoints
 * Handles different environments (development vs production)
 */

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// API Base URLs
export const API_CONFIG = {
  // Evolution API URL (direct API endpoint)
  evolutionApi: import.meta.env.VITE_EVOLUTION_API_URL || 'https://cloudsaas.geni.chat',
  
  // Base URL for our proxy/API routes
  baseUrl: import.meta.env.VITE_API_BASE_URL || (
    typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://ia.geni.chat'
  ),
  
  // Webhook URL
  webhookUrl: import.meta.env.VITE_WEBHOOK_URL || 'https://webhooksaas.geni.chat/webhook/principal',
  
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

// API Endpoints
export const ENDPOINTS = {
  // Evolution API endpoints (will be proxied through our API routes)
  evolution: {
    instances: '/api/evolution/instances',
    createInstance: '/api/evolution/create-instance',
    connectInstance: '/api/evolution/connect',
    deleteInstance: '/api/evolution/delete',
    instanceInfo: '/api/evolution/info',
    instanceStatus: '/api/evolution/status',
  },
  
  // Test endpoints
  test: {
    evolution: '/api/test-evolution',
  },
  
  // Webhook endpoints
  webhook: {
    whatsapp: '/api/webhook/whatsapp',
  }
};

// Headers configuration
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'SaaSAgent/1.0',
};

// CORS configuration
export const CORS_CONFIG = {
  allowedOrigins: [
    'https://ia.geni.chat',
    'https://cloudsaas.geni.chat',
    'https://webhooksaas.geni.chat',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Message-ID', 
    'X-Processing-Count', 
    'X-Anti-Loop-Enabled', 
    'apikey'
  ],
};

// Debug configuration
export const DEBUG_CONFIG = {
  logLevel: isDevelopment ? 'debug' : 'info',
  enableMetrics: true,
  enableRetryLogging: true,
};

console.log('[API-CONFIG] Configuration loaded:', {
  isDevelopment,
  isLocalhost,
  baseUrl: API_CONFIG.baseUrl,
  evolutionApi: API_CONFIG.evolutionApi,
  webhookUrl: API_CONFIG.webhookUrl,
});

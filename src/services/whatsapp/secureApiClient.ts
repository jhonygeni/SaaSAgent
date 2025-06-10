import { supabase } from '@/integrations/supabase/client';
import { 
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE
} from '../../constants/api';

// Get Evolution API configuration from environment
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
// SECURITY: EVOLUTION_API_KEY is NOT exposed to frontend - only backend has access

/**
 * Helper function to replace placeholders in endpoint URLs
 */
export const formatEndpoint = (endpoint: string, params: Record<string, string>): string => {
  let formattedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    formattedEndpoint = formattedEndpoint.replace(`{${key}}`, encodeURIComponent(value));
  });
  return formattedEndpoint;
};

/**
 * Retry function with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_CONNECTION_RETRIES, 
  delay: number = RETRY_DELAY_MS,
  retryCondition?: (error: any) => boolean
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      
      // If retryCondition is provided, check if we should retry
      if (retryCondition && !retryCondition(error)) {
        console.log("Not retrying due to condition check");
        throw error; // Don't retry if condition says not to
      }
      
      lastError = error;
      
      // Don't wait on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const backoffDelay = delay * Math.pow(1.5, attempt) * (0.9 + Math.random() * 0.2);
        console.log(`Retrying in ${Math.round(backoffDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Secure WhatsApp API client using Vercel API Routes as Backend Proxy
 * SECURITY: All Evolution API calls go through /api/evolution/* backend to protect EVOLUTION_API_KEY
 * Frontend NEVER directly calls Evolution API or Supabase Edge Functions
 */
export const secureApiClient = {
  /**
   * Call Evolution API via secure backend proxy (SECURE APPROACH)
   * - Development: Uses Supabase Edge Function
   * - Production: Uses Vercel API Routes
   * This ensures EVOLUTION_API_KEY stays on server-side only
   */
  async callEvolutionAPI<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    console.log(`🔒 Making SECURE Evolution API call - Endpoint: ${endpoint}, Method: ${method}`);

    // Determine environment and appropriate backend strategy
    const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDevelopment = import.meta.env.DEV;
    
    if (isLocalDevelopment && isDevelopment) {
      // DEVELOPMENT: Use Supabase Edge Function
      console.log(`🔧 Development mode detected - Using Supabase Edge Function`);
      return this.callEvolutionAPIViaSupabase(endpoint, method, data);
    } else {
      // PRODUCTION: Use Vercel API Routes
      console.log(`🚀 Production mode detected - Using Vercel API Routes`);
      return this.callEvolutionAPIViaVercel(endpoint, method, data);
    }
  },

  /**
   * Call Evolution API via Supabase Edge Function (DEVELOPMENT)
   */
  async callEvolutionAPIViaSupabase<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    console.log(`📡 Calling Supabase Edge Function: evolution-api`);
    
    const { data: result, error } = await supabase.functions.invoke('evolution-api', {
      body: {
        endpoint,
        method,
        data: data || {}
      }
    });

    if (error) {
      console.error('❌ Supabase Edge Function error:', error);
      throw new Error(error.message || 'Erro na Evolution API via Supabase');
    }

    console.log('✅ Supabase Edge Function response received');
    return result;
  },

  /**
   * Call Evolution API via Vercel API Routes (PRODUCTION)
   * Uses secure backend proxy to protect EVOLUTION_API_KEY
   */
  async callEvolutionAPIViaVercel<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    // Map Evolution API endpoints to Vercel API Routes
    let url = '';
    let fetchOptions: RequestInit = { method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };

    // Route mapping based on Evolution API endpoints
    if (endpoint === '/instance/create') {
      url = `/api/evolution/create-instance`;
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data);
    } else if (endpoint.startsWith('/instance/connect/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/connect?instance=${instanceName}`;
      fetchOptions.method = 'GET';
    } else if (endpoint === '/instance/fetchInstances') {
      url = `/api/evolution/instances`;
      fetchOptions.method = 'GET';
    } else if (endpoint.startsWith('/instance/info/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/info?instance=${instanceName}`;
      fetchOptions.method = 'GET';
    } else if (endpoint.startsWith('/instance/qrcode/')) {
      // This endpoint should not be used anymore - redirect to connect
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/connect?instance=${instanceName}`;
      fetchOptions.method = 'GET';
    } else if (endpoint.startsWith('/instance/connectionState/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/status?instance=${instanceName}`;
      fetchOptions.method = 'GET';
    } else if (endpoint.startsWith('/instance/delete/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/delete`;
      fetchOptions.method = 'DELETE';
      fetchOptions.body = JSON.stringify({ instance: instanceName });
    } else if (endpoint.startsWith('/webhook/set/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/webhook?instance=${instanceName}`;
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data);
    } else if (endpoint.startsWith('/webhook/find/')) {
      const instanceName = endpoint.split('/')[3];
      url = `/api/evolution/webhook?instance=${instanceName}`;
      fetchOptions.method = 'GET';
    } else {
      throw new Error(`Endpoint não mapeado: ${endpoint}`);
    }

    console.log(`🔒 Making secure API call to: ${url}`);
    
    // Call via Vercel API Route (secure proxy)
    const response = await fetch(url, fetchOptions);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result?.error || 'Erro na chamada da Evolution API via Vercel');
    }
    
    return result;
  },

  /**
   * Create a WhatsApp instance
   */
  async createInstance(instanceData: any): Promise<any> {
    return this.callEvolutionAPI('/instance/create', 'POST', instanceData);
  },

  /**
   * Connect to WhatsApp instance and get QR code
   * According to Evolution API v2 docs: GET /instance/connect/{instance}
   * Returns: { pairingCode: "WZYEH1YY", code: "2@y8eK+bjtEjUWy9/FOM...", count: 1 }
   */
  async connectInstance(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/connect/${encodeURIComponent(instanceName)}`, 'GET');
  },

  /**
   * Get QR code for instance
   * Evolution API v2: Use /instance/connect/{instance} to get QR code and pairing code
   * This is the CORRECT endpoint for getting QR codes according to the documentation
   */
  async getQRCode(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/connect/${encodeURIComponent(instanceName)}`, 'GET');
  },

  /**
   * Get instance information (corrigido para Evolution API v2)
   */
  async getInstanceInfo(instanceName: string): Promise<any> {
    // O endpoint correto para status/estado é connectionState
    return this.callEvolutionAPI(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
  },

  /**
   * Fetch all instances
   */
  async fetchInstances(): Promise<any> {
    return this.callEvolutionAPI('/instance/fetchInstances');
  },

  /**
   * Get connection state
   */
  async getConnectionState(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
  },

  /**
   * Delete WhatsApp instance
   */
  async deleteInstance(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/delete/${encodeURIComponent(instanceName)}`, 'DELETE');
  },

  /**
   * Set webhook for instance
   */
  async setWebhook(instanceName: string, webhookData: any): Promise<any> {
    // Garante que o campo 'webhook' está presente, pois Evolution API exige isso
    const payload = {
      ...webhookData,
      webhook: webhookData.webhook || webhookData.url // Prioriza 'webhook', senão usa 'url'
    };
    return this.callEvolutionAPI(`/webhook/set/${encodeURIComponent(instanceName)}`, 'POST', payload);
  },

  /**
   * Find webhook for instance
   */
  async findWebhook(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/webhook/find/${encodeURIComponent(instanceName)}`);
  },

  /**
   * Update instance settings
   */
  async updateSettings(instanceName: string, settings: any): Promise<any> {
    return this.callEvolutionAPI(`/settings/set/${encodeURIComponent(instanceName)}`, 'POST', settings);
  },

  /**
   * Send text message
   */
  async sendText(instanceName: string, messageData: any): Promise<any> {
    return this.callEvolutionAPI(`/message/sendText/${encodeURIComponent(instanceName)}`, 'POST', messageData);
  },

  /**
   * Send media message
   */
  async sendMedia(instanceName: string, mediaData: any): Promise<any> {
    return this.callEvolutionAPI(`/message/sendMedia/${encodeURIComponent(instanceName)}`, 'POST', mediaData);
  }
};

// Legacy compatibility - keep existing method names
export const apiClient = secureApiClient;

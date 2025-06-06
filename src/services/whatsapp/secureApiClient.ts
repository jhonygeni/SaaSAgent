import { supabase } from '@/integrations/supabase/client';
import { 
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE
} from '../../constants/api';

// Get Evolution API configuration from environment
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
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
   * Call Evolution API via Vercel API Route (SECURE BACKEND PROXY)
   * This ensures EVOLUTION_API_KEY stays on server-side only
   */
  async callEvolutionAPI<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    console.log(`🔒 Making SECURE Evolution API call via /api/evolution/* proxy - Endpoint: ${endpoint}, Method: ${method}`);

    // Map endpoint/method to the correct Vercel API Route
    let url = '';
    let fetchOptions: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    let bodyAllowed = ['POST', 'PUT', 'PATCH'].includes(method);

    // Routing logic for Evolution API endpoints
    if (endpoint.startsWith('/instance/create')) {
      url = '/api/evolution/create-instance';
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data);
    } else if (endpoint.startsWith('/instance/connect')) {
      url = '/api/evolution/connect';
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data || { instanceName: endpoint.split('/').pop() });
    } else if (endpoint.startsWith('/instance/qrcode')) {
      url = '/api/evolution/qrcode?instanceId=' + encodeURIComponent(endpoint.split('/').pop()!);
      fetchOptions.method = 'GET';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/info')) {
      url = '/api/evolution/info?instanceId=' + encodeURIComponent(endpoint.split('/').pop()!);
      fetchOptions.method = 'GET';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/fetchInstances')) {
      url = '/api/evolution/instances';
      fetchOptions.method = 'GET';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/connectionState')) {
      url = '/api/evolution/status?instanceId=' + encodeURIComponent(endpoint.split('/').pop()!);
      fetchOptions.method = 'GET';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/delete')) {
      url = '/api/evolution/delete?instanceId=' + encodeURIComponent(endpoint.split('/').pop()!);
      fetchOptions.method = 'DELETE';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/settings')) {
      url = '/api/evolution/settings?instanceId=' + encodeURIComponent(endpoint.split('/').pop()!);
      fetchOptions.method = 'GET';
      delete fetchOptions.body;
    } else if (endpoint.startsWith('/instance/webhook')) {
      url = '/api/evolution/webhook';
      fetchOptions.method = 'POST';
      fetchOptions.body = JSON.stringify(data);
    } else {
      throw new Error('Endpoint não suportado pelo proxy seguro: ' + endpoint);
    }

    // Chamada segura para o backend
    const response = await fetch(url, fetchOptions);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || 'Erro desconhecido na Evolution API');
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
   */
  async connectInstance(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/connect/${encodeURIComponent(instanceName)}`, 'POST');
  },

  /**
   * Get QR code for instance
   */
  async getQRCode(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/qrcode/${encodeURIComponent(instanceName)}`);
  },

  /**
   * Get instance information
   */
  async getInstanceInfo(instanceName: string): Promise<any> {
    return this.callEvolutionAPI(`/instance/info/${encodeURIComponent(instanceName)}`);
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
    return this.callEvolutionAPI(`/webhook/set/${encodeURIComponent(instanceName)}`, 'POST', webhookData);
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

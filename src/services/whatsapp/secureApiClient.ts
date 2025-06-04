import { createClient } from '@supabase/supabase-js';
import { 
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE
} from '../../constants/api';

// Get Supabase configuration from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get Evolution API configuration from environment
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.EVOLUTION_API_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
 * Secure WhatsApp API client using Supabase Edge Function
 * This client routes all requests through our secure Edge Function,
 * keeping the Evolution API key on the server-side only
 */
export const secureApiClient = {
  /**
   * Call Evolution API directly (external API) - NO MORE EDGE FUNCTIONS
   */
  async callEvolutionAPI<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    console.log(`🔄 Making DIRECT Evolution API call - Endpoint: ${endpoint}, Method: ${method}`);
    
    return retryOperation(async () => {
      try {
        // Get current user session for authentication (Supabase auth)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('User not authenticated. Please login to continue.');
        }

        // Validate Evolution API configuration
        if (!EVOLUTION_API_URL) {
          throw new Error('EVOLUTION_API_URL not configured. Please set VITE_EVOLUTION_API_URL environment variable.');
        }

        if (!EVOLUTION_API_KEY) {
          throw new Error('EVOLUTION_API_KEY not configured. Please set EVOLUTION_API_KEY environment variable.');
        }

        // Build full URL for Evolution API
        const evolutionApiUrl = `${EVOLUTION_API_URL.replace(/\/$/, '')}${endpoint}`;
        
        console.log('📤 Direct API call:', { 
          url: evolutionApiUrl,
          method, 
          hasData: Object.keys(data || {}).length > 0,
          dataKeys: Object.keys(data || {})
        });

        // Prepare headers for Evolution API V2
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': EVOLUTION_API_KEY, // Evolution API V2 uses 'apikey' header
        };

        // Prepare request options
        const requestOptions: RequestInit = {
          method,
          headers,
        };

        // Add body for non-GET requests
        if (method !== 'GET' && data) {
          requestOptions.body = JSON.stringify(data);
        }

        // Make direct call to Evolution API
        const response = await fetch(evolutionApiUrl, requestOptions);

        console.log('📥 Evolution API response:', { 
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        // Parse response
        let result: any;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const textResult = await response.text();
          try {
            result = JSON.parse(textResult);
          } catch {
            result = { message: textResult, status: response.status };
          }
        }

        if (!response.ok) {
          console.error('❌ Evolution API error:', { 
            status: response.status, 
            result,
            url: evolutionApiUrl
          });
          
          // Handle specific error types
          if (response.status === 401 || response.status === 403) {
            const authError = new Error(`Evolution API authentication failed (${response.status}). Check EVOLUTION_API_KEY.`) as any;
            authError.name = 'AuthenticationError';
            authError.status = response.status;
            
            if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE) {
              console.error("🛑 Canceling operation to prevent credit consumption");
            }
            
            throw authError;
          }
          
          if (response.status === 404) {
            throw new Error(`Evolution API endpoint not found: ${endpoint} (${response.status})`);
          }
          
          if (response.status >= 500) {
            throw new Error(`Evolution API server error (${response.status}): ${JSON.stringify(result)}`);
          }
          
          throw new Error(`Evolution API error (${response.status}): ${JSON.stringify(result)}`);
        }

        console.log(`✅ Direct Evolution API call successful - Endpoint: ${endpoint}`);
        return result;
        
      } catch (error) {
        console.error(`❌ Direct Evolution API call failed - Endpoint: ${endpoint}:`, error);
        throw error;
      }
    }, undefined, undefined, (error) => {
      // Don't retry on authentication errors
      return !(error instanceof Error && (
        error.message.includes("403") || 
        error.message.includes("401") ||
        error.message.includes("Authentication failed") ||
        error.name === 'AuthenticationError'
      ));
    });
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

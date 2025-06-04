import { createClient } from '@supabase/supabase-js';
import { 
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE
} from '../../constants/api';

// Get Supabase configuration from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
   * Call Evolution API through secure Edge Function
   */
  async callEvolutionAPI<T>(action: string, instanceName?: string, data?: any): Promise<T> {
    console.log(`Making secure API call - Action: ${action}, Instance: ${instanceName}`);
    
    return retryOperation(async () => {
      try {
        // Get current user session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('User not authenticated. Please login to continue.');
        }

        // Call the Edge Function
        const { data: result, error } = await supabase.functions.invoke('evolution-api', {
          body: {
            action,
            instanceName,
            data
          },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (error) {
          console.error('Edge Function error:', error);
          
          // Special handling for authentication errors
          if (error.message?.includes('401') || error.message?.includes('403')) {
            const authError = new Error(`Authentication failed: ${error.message}`) as any;
            authError.name = 'AuthenticationError';
            authError.status = 401;
            
            if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE) {
              console.error("Canceling operation to prevent credit consumption");
            }
            
            throw authError;
          }
          
          throw new Error(`API Error: ${error.message}`);
        }

        console.log(`Secure API call successful - Action: ${action}`);
        return result;
      } catch (error) {
        console.error(`Secure API call failed - Action: ${action}:`, error);
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
    return this.callEvolutionAPI('create', undefined, instanceData);
  },

  /**
   * Connect to WhatsApp instance and get QR code
   */
  async connectInstance(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('connect', instanceName);
  },

  /**
   * Get QR code for instance
   */
  async getQRCode(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('qrcode', instanceName);
  },

  /**
   * Get instance information
   */
  async getInstanceInfo(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('info', instanceName);
  },

  /**
   * Fetch all instances
   */
  async fetchInstances(): Promise<any> {
    return this.callEvolutionAPI('fetchInstances');
  },

  /**
   * Get connection state
   */
  async getConnectionState(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('connectionState', instanceName);
  },

  /**
   * Delete WhatsApp instance
   */
  async deleteInstance(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('delete', instanceName);
  },

  /**
   * Set webhook for instance
   */
  async setWebhook(instanceName: string, webhookData: any): Promise<any> {
    return this.callEvolutionAPI('webhook', instanceName, webhookData);
  },

  /**
   * Find webhook for instance
   */
  async findWebhook(instanceName: string): Promise<any> {
    return this.callEvolutionAPI('webhookFind', instanceName);
  },

  /**
   * Update instance settings
   */
  async updateSettings(instanceName: string, settings: any): Promise<any> {
    return this.callEvolutionAPI('settings', instanceName, settings);
  },

  /**
   * Send text message
   */
  async sendText(instanceName: string, messageData: any): Promise<any> {
    return this.callEvolutionAPI('sendText', instanceName, messageData);
  },

  /**
   * Send media message
   */
  async sendMedia(instanceName: string, mediaData: any): Promise<any> {
    return this.callEvolutionAPI('sendMedia', instanceName, mediaData);
  }
};

// Legacy compatibility - keep existing method names
export const apiClient = secureApiClient;

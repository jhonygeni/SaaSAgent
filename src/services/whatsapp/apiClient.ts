import { 
  EVOLUTION_API_URL, 
  // EVOLUTION_API_KEY, // SECURITY: Removed - now handled securely via Edge Functions
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE
} from '../../constants/api';

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
 * Helper function to create API headers with proper authorization
 * CORREÇÃO APLICADA: Evolution API v2 usa EXCLUSIVAMENTE 'apikey' header
 */
export const createHeaders = (contentType: boolean = false): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  // CORREÇÃO CRÍTICA: Evolution API v2 usa APENAS 'apikey' header
  // Note: EVOLUTION_API_KEY now only available server-side for security
  // headers['apikey'] = EVOLUTION_API_KEY;
  headers['Accept'] = 'application/json';
  
  return headers;
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
 * Base WhatsApp API client for making requests
 */
// DEPRECATED: Use secureApiClient for all Evolution API calls.
export const apiClient = {
  get: () => { throw new Error("apiClient is deprecated. Use secureApiClient instead."); },
  getOptimized: () => { throw new Error("apiClient is deprecated. Use secureApiClient instead."); },
  post: () => { throw new Error("apiClient is deprecated. Use secureApiClient instead."); },
  postOptimized: () => { throw new Error("apiClient is deprecated. Use secureApiClient instead."); },
  delete: () => { throw new Error("apiClient is deprecated. Use secureApiClient instead."); }
};

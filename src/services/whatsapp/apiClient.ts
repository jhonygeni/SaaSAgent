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
export const apiClient = {
  baseUrl: EVOLUTION_API_URL.endsWith('/') ? EVOLUTION_API_URL.slice(0, -1) : EVOLUTION_API_URL,
  
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Ensure endpoint starts with / but remove any trailing / to avoid double slashes
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${sanitizedEndpoint}`;
    
    // Add query parameters if provided
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += url.includes('?') ? '&' : '?';
      url += queryParams.toString();
    }
    
    const headers = createHeaders();
    console.log(`Making GET request to: ${url}`, { headers });
    
    return retryOperation(async () => {
      try {
        // Enhanced logging for debugging
        console.log(`GET request details:
          URL: ${url}
          Headers: ${JSON.stringify(headers)}
        `);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        // Log response headers for debugging
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log(`Response headers: ${JSON.stringify([...response.headers.entries()])}`);
        
        // Parse response regardless of success/failure for debugging
        let responseData;
        let responseText;
        
        try {
          responseText = await response.text();
          console.log(`Raw GET response from ${url}:`, responseText);
          
          // Try to parse as JSON
          try {
            responseData = JSON.parse(responseText);
          } catch (jsonError) {
            console.warn(`Response is not valid JSON: ${jsonError}`);
            responseData = { message: responseText };
          }
          
          console.log(`Parsed GET response from ${url}:`, responseData);
        } catch (e) {
          console.error(`Error reading response text: ${e}`);
          responseData = { error: "Could not read response" };
        }
        
        if (!response.ok) {
          // Enhanced error message with more details
          const errorMsg = `API responded with status ${response.status}: ${
            typeof responseData === 'object' ? JSON.stringify(responseData) : responseData
          }`;
          console.error(errorMsg);
          
          // Special handling for authentication errors (401/403)
          if (response.status === 401 || response.status === 403) {
            console.error("AUTHENTICATION ERROR: Your token is invalid or has insufficient permissions");
            console.error("Please verify your Evolution API token is correct in the environment variables");
            console.error("Token being used (first 4 chars): " + "SERVER-SIDE-ONLY");
            
            // Create a custom error for auth failures to prevent retries
            const authError = new Error(`Authentication failed: Invalid or expired token. Status: ${response.status}`) as any;
            authError.name = 'AuthenticationError';
            authError.status = response.status;
            
            // Prevent credit consumption on auth failures
            if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE) {
              console.error("Canceling operation to prevent credit consumption");
            }
            
            throw authError;
          }
          
          throw new Error(errorMsg);
        }
        
        return responseData;
      } catch (error) {
        // Improved error logging with request details
        console.error(`Request failed for GET ${url}:`, error);
        throw error;
      }
    }, undefined, undefined, (error) => {
      // Don't retry on authentication errors
      return !(error instanceof Error && (
        error.message.includes("403") || 
        error.message.includes("401") ||
        error.message.includes("Authentication failed")
      ));
    });
  },
  
  /**
   * Make an optimized GET request with shorter timeouts for critical operations
   */
  async getOptimized<T>(endpoint: string, timeoutMs: number = 5000): Promise<T> {
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${sanitizedEndpoint}`;
    const headers = createHeaders();
    
    console.log(`[OPTIMIZED] Making fast GET request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(timeoutMs)
      });
      
      console.log(`[OPTIMIZED] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Special handling for authentication errors
        if (response.status === 401 || response.status === 403) {
          const authError = new Error(`Authentication failed: Invalid token. Status: ${response.status}`) as any;
          authError.name = 'AuthenticationError';
          authError.status = response.status;
          throw authError;
        }
        
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[OPTIMIZED] GET request successful for: ${url}`);
      return responseData;
    } catch (error) {
      console.error(`[OPTIMIZED] Request failed for GET ${url}:`, error);
      throw error;
    }
  },

  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    // Ensure endpoint starts with / but remove any trailing / to avoid double slashes
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${sanitizedEndpoint}`;
    const headers = createHeaders(true);
    console.log(`Making POST request to: ${url}`, { headers, data });
    
    return retryOperation(async () => {
      try {
        // Enhanced logging for debugging
        console.log(`POST request details:
          URL: ${url}
          Headers: ${JSON.stringify(headers)}
          Body: ${JSON.stringify(data)}
        `);
        
        // Set proper mode for CORS and credentials
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        // Log response headers for debugging
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log(`Response headers: ${JSON.stringify([...response.headers.entries()])}`);
        
        // Parse response regardless of success/failure for debugging
        let responseData;
        try {
          responseData = await response.json();
          console.log(`POST response from ${url}:`, responseData);
        } catch (e) {
          const text = await response.text();
          console.log(`POST response (non-JSON) from ${url}:`, text);
          responseData = { message: text };
        }
        
        if (!response.ok) {
          const errorMsg = `API responded with status ${response.status}: ${
            typeof responseData === 'object' ? JSON.stringify(responseData) : responseData
          }`;
          console.error(errorMsg);
          
          // Special handling for 403/401 errors to prevent credit consumption
          if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE && (response.status === 403 || response.status === 401)) {
            console.error("Authentication error - canceling operation to prevent credit consumption");
          }
          
          throw new Error(errorMsg);
        }
        
        return responseData;
      } catch (error) {
        // Improved error logging with request details
        console.error(`Request failed for POST ${url}:`, error);
        throw error;
      }
    }, undefined, undefined, (error) => {
      // Don't retry on specific errors
      return !(error instanceof Error && (
        error.message.includes("403") || 
        error.message.includes("401") ||
        error.message.includes("Authentication failed") ||
        error.message.includes("already in use")
      ));
    });
  },
  
  /**
   * Make an optimized POST request with shorter timeouts for critical operations
   */
  async postOptimized<T>(endpoint: string, data: any, timeoutMs: number = 5000): Promise<T> {
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${sanitizedEndpoint}`;
    const headers = createHeaders(true);
    
    console.log(`[OPTIMIZED] Making fast POST request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(timeoutMs)
      });
      
      console.log(`[OPTIMIZED] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Special handling for authentication errors
        if (response.status === 401 || response.status === 403) {
          const authError = new Error(`Authentication failed: Invalid token. Status: ${response.status}`) as any;
          authError.name = 'AuthenticationError';
          authError.status = response.status;
          throw authError;
        }
        
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[OPTIMIZED] POST request successful for: ${url}`);
      return responseData;
    } catch (error) {
      console.error(`[OPTIMIZED] Request failed for POST ${url}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Ensure endpoint starts with / but remove any trailing / to avoid double slashes
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${sanitizedEndpoint}`;
    
    // Add query parameters if provided
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += url.includes('?') ? '&' : '?';
      url += queryParams.toString();
    }
    
    const headers = createHeaders();
    console.log(`Making DELETE request to: ${url}`, { headers });
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      // Parse response regardless of success/failure for debugging
      let responseData;
      try {
        responseData = await response.json();
        console.log(`DELETE response from ${url}:`, responseData);
      } catch (e) {
        const text = await response.text();
        console.log(`DELETE response (non-JSON) from ${url}:`, text);
        responseData = { message: text };
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${
          typeof responseData === 'object' ? JSON.stringify(responseData) : responseData
        }`);
      }
      
      return responseData;
    } catch (error) {
      console.error(`Request failed for DELETE ${url}:`, error);
      throw error;
    }
  }
};

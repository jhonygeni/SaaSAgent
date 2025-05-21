
import { 
  EVOLUTION_API_URL, 
  EVOLUTION_API_KEY, 
  USE_BEARER_AUTH, 
  MAX_CONNECTION_RETRIES, 
  RETRY_DELAY_MS 
} from '../../constants/api';

/**
 * Helper function to replace placeholders in endpoint URLs
 */
export const formatEndpoint = (endpoint: string, params: Record<string, string>): string => {
  let formattedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    formattedEndpoint = formattedEndpoint.replace(`{${key}}`, value);
  });
  return formattedEndpoint;
};

/**
 * Helper function to create API headers with proper authorization
 */
export const createHeaders = (contentType: boolean = false): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Use apikey header instead of Bearer token based on config
  if (USE_BEARER_AUTH) {
    headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
  } else {
    headers['apikey'] = EVOLUTION_API_KEY;
  }
  
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
  baseUrl: EVOLUTION_API_URL,
  
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
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
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      // Parse response regardless of success/failure for debugging
      let responseData;
      try {
        responseData = await response.json();
        console.log(`GET response from ${url}:`, responseData);
      } catch (e) {
        const text = await response.text();
        console.log(`GET response (non-JSON) from ${url}:`, text);
        responseData = text;
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(responseData)}`);
      }
      
      return responseData;
    });
  },
  
  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = createHeaders(true);
    console.log(`Making POST request to: ${url}`, { headers, data });
    
    return retryOperation(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      // Parse response regardless of success/failure for debugging
      let responseData;
      try {
        responseData = await response.json();
        console.log(`POST response from ${url}:`, responseData);
      } catch (e) {
        const text = await response.text();
        console.log(`POST response (non-JSON) from ${url}:`, text);
        responseData = text;
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(responseData)}`);
      }
      
      return responseData;
    });
  },
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
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
      responseData = text;
    }
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}: ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  }
};

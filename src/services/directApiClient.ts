// Direct API caller utility
// This bypasses all middleware to make direct API calls
// Use only as a fallback when normal channels fail

import { 
  EVOLUTION_API_URL,
  EVOLUTION_API_KEY,
  ENDPOINTS
} from '@/constants/api';

/**
 * Direct API client for Evolution API
 * Bypasses all middleware and makes direct fetch calls
 * Uses minimal headers and options to maximize compatibility
 */
export const directApiClient = {
  /**
   * Make a direct GET request to the Evolution API
   * @param {string} endpoint API endpoint
   * @returns {Promise<any>} API response
   */
  async get(endpoint) {
    try {
      console.log(`[Direct API] Making GET request to: ${EVOLUTION_API_URL}${endpoint}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Direct API] Request failed:', error);
      throw error;
    }
  },
  
  /**
   * Get instances directly from Evolution API
   * @returns {Promise<Array>} List of instances
   */
  async getInstances() {
    try {
      return await this.get(ENDPOINTS.fetchInstances);
    } catch (error) {
      console.error('[Direct API] Failed to fetch instances:', error);
      return [];
    }
  }
};

/**
 * Use this function when all other attempts fail
 * It makes a direct API call using the most compatible approach
 */
export async function emergencyFetchInstances() {
  try {
    return await directApiClient.getInstances();
  } catch (error) {
    console.error('Emergency fetch failed:', error);
    // Return empty array to avoid breaking the UI
    return [];
  }
}

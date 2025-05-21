
import { ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE } from '../constants/api';
import { supabase } from '@/integrations/supabase/client';
import { apiClient, formatEndpoint } from './whatsapp/apiClient';
import { storeInstanceData } from './whatsapp/dataStorage';
import { 
  WhatsAppInstanceRequest, 
  WhatsAppInstanceResponse, 
  ConnectionStateResponse,
  InstanceInfo 
} from './whatsapp/types';

/**
 * WhatsApp connection service
 */
export const whatsappService = {
  /**
   * Check if the API is accessible, useful for debugging connection issues
   */
  checkApiHealth: async (): Promise<boolean> => {
    try {
      // Try the health endpoint
      try {
        const healthResponse = await apiClient.get<any>(`${ENDPOINTS.healthCheck}`);
        console.log("API health check successful", healthResponse);
        return true;
      } catch (e) {
        console.log("Health endpoint not available, trying instances endpoint");
      }
      
      // If health endpoint fails, try fetchInstances as a fallback
      try {
        await apiClient.get<any>(`${ENDPOINTS.fetchInstances}`);
        console.log("API accessibility check successful (fetchInstances endpoint)");
        return true;
      } catch (error) {
        // Check if it's an auth error (which means API is accessible but credentials are wrong)
        if (error instanceof Error && 
            (error.message.includes("403") || error.message.includes("401"))) {
          console.error("API health check failed, authentication issue");
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error("API health check failed with exception:", error);
      return false;
    }
  },
  
  /**
   * Create a WhatsApp instance
   */
  createInstance: async (instanceName: string, userId?: string): Promise<WhatsAppInstanceResponse> => {
    console.log(`Creating WhatsApp instance: ${instanceName}`);
    
    // Format instance name to be valid (replace spaces with underscores, etc.)
    const formattedInstanceName = instanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Mock mode for testing
    if (USE_MOCK_DATA) {
      console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
      const mockResponse: WhatsAppInstanceResponse = {
        instance: {
          instanceName: formattedInstanceName,
          instanceId: `mock-${Date.now()}`,
          integration: "WHATSAPP-BAILEYS",
          webhookWaBusiness: null,
          accessTokenWaBusiness: "",
          status: "close"
        },
        hash: `MOCK-${Math.random().toString(36).substring(2, 15)}`,
        webhook: {},
        websocket: {},
        rabbitmq: {},
        sqs: {},
        settings: {
          rejectCall: false,
          msgCall: "",
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
          wavoipToken: ""
        }
      };
      
      // Store mock data in Supabase if userId is provided
      if (userId) {
        await storeInstanceData(userId, mockResponse);
      }
      
      return mockResponse;
    }
    
    try {
      // First check API health
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      const requestBody: WhatsAppInstanceRequest = {
        instanceName: formattedInstanceName,
        integration: "WHATSAPP-BAILEYS"
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const data = await apiClient.post<WhatsAppInstanceResponse>(ENDPOINTS.instanceCreate, requestBody);
      console.log("Instance creation successful response:", data);
      
      // Store the complete instance data in Supabase if userId is provided
      if (userId) {
        await storeInstanceData(userId, data);
      }
      
      return data;
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  /**
   * Connect to an existing WhatsApp instance and get QR code
   * FIXED: Now using GET method with query parameters instead of POST
   */
  connectToInstance: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Connecting to WhatsApp instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Connected to instance successfully (mock)",
          qrcode: MOCK_QR_CODE,
          pairingCode: "123-456-789",
          instance: {
            instanceName,
            connected: true
          }
        };
      }
      
      // FIXED: Use GET method with query parameters instead of POST with body
      const endpoint = `${ENDPOINTS.instanceConnect}?instanceName=${encodeURIComponent(instanceName)}`;
      console.log("Connect instance URL:", `${apiClient.baseUrl}${endpoint}`);
      
      const data = await apiClient.get(endpoint);
      console.log("Instance connection successful:", data);
      
      return data;
    } catch (error) {
      console.error("Error connecting to WhatsApp instance:", error);
      throw error;
    }
  },
  
  /**
   * Get QR code for WhatsApp connection
   */
  getQrCode: async (instanceName: string): Promise<any> => {
    return whatsappService.connectToInstance(instanceName);
  },
  
  /**
   * Check connection status
   */
  getConnectionState: async (instanceName: string): Promise<ConnectionStateResponse> => {
    try {
      console.log(`Checking connection state for instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          state: "connecting",
          message: "WhatsApp connection state: connecting (mock)"
        };
      }
      
      const endpoint = `${ENDPOINTS.connectionState}?instanceName=${instanceName}`;
      
      const data = await apiClient.get<ConnectionStateResponse>(endpoint);
      console.log("Connection state retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error checking connection state:", error);
      throw error;
    }
  },
  
  /**
   * Get instance information
   */
  getInstanceInfo: async (instanceName: string): Promise<InstanceInfo> => {
    try {
      console.log(`Getting info for instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          instance: {
            name: instanceName,
            user: {
              id: "5511987654321@c.us",
              name: "Test User",
              phone: "+5511987654321"
            },
            status: "connected",
            isConnected: true
          }
        };
      }
      
      const data = await apiClient.get<InstanceInfo>(`${ENDPOINTS.instanceInfo}?instanceName=${instanceName}`);
      console.log("Instance info retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error getting instance info:", error);
      throw error;
    }
  },
  
  /**
   * List all instances (for debugging)
   */
  listInstances: async (): Promise<any> => {
    try {
      console.log("Listing all instances");
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          instances: [
            {
              name: "mock_instance_1",
              status: "connected"
            }
          ]
        };
      }
      
      const data = await apiClient.get(ENDPOINTS.fetchInstances);
      console.log("Instances list:", data);
      return data;
    } catch (error) {
      console.error("Error listing instances:", error);
      throw error;
    }
  },
  
  /**
   * Fetch instances with optional filtering
   */
  fetchInstances: async (options: { instanceName?: string, instanceId?: string } = {}): Promise<any> => {
    try {
      console.log("Fetching WhatsApp instances with options:", options);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          instances: [
            {
              id: "mock-instance-1",
              instanceName: "mock_instance_1",
              status: "connected",
              connected: true
            },
            {
              id: "mock-instance-2",
              instanceName: "mock_instance_2",
              status: "disconnected",
              connected: false
            }
          ]
        };
      }
      
      // Convert options to query parameters
      const queryParams = new URLSearchParams();
      if (options.instanceName) queryParams.append('instanceName', options.instanceName);
      if (options.instanceId) queryParams.append('instanceId', options.instanceId);
      
      const endpoint = `${ENDPOINTS.fetchInstances}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const data = await apiClient.get(endpoint);
      console.log("Instances fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("Error fetching instances:", error);
      throw error;
    }
  },
  
  /**
   * Logout/disconnect WhatsApp
   */
  logout: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Logging out instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return true;
      }
      
      try {
        await apiClient.delete(`${ENDPOINTS.instanceLogout}?instanceName=${instanceName}`);
        return true;
      } catch (error) {
        console.error("Error during logout:", error);
        return false;
      }
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }
};

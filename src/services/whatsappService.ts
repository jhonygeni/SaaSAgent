
import { 
  EVOLUTION_API_URL, 
  EVOLUTION_API_KEY, 
  USE_MOCK_DATA,
  ENDPOINTS 
} from '@/constants/api';
import { 
  WebhookConfigResponse, 
  ConnectionStateResponse, 
  QrCodeResponse,
  InstanceInfo,
  InstancesListResponse
} from '@/services/whatsapp/types';
import { apiClient, formatEndpoint } from '@/services/whatsapp/apiClient';

/**
 * Service for WhatsApp API interactions
 */
const whatsappService = {
  /**
   * Configure webhook for an instance
   * Must be called immediately after successful instance creation
   */
  configureWebhook: async (instanceName: string): Promise<WebhookConfigResponse> => {
    try {
      console.log(`Configuring webhook for instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Webhook configured successfully (mock)",
          webhook: {
            enabled: true,
            url: "https://webhooksaas.geni.chat/webhook/principal",
            events: ["MESSAGES_UPSERT"]
          }
        };
      }
      
      // Use the endpoint for webhook configuration
      const endpoint = formatEndpoint(ENDPOINTS.webhookConfig, { instanceName });
      console.log("Webhook configuration URL:", `${apiClient.baseUrl}${endpoint}`);
      
      const webhookConfig = {
        enabled: true,
        url: "https://webhooksaas.geni.chat/webhook/principal",
        webhookByEvents: true,
        webhookBase64: true,
        events: ["MESSAGES_UPSERT"]
      };
      
      const data = await apiClient.post<WebhookConfigResponse>(endpoint, webhookConfig);
      console.log("Webhook configuration successful:", data);
      
      return data;
    } catch (error) {
      console.error("Error configuring webhook:", error);
      throw error;
    }
  },

  // Check API health by using the fetchInstances endpoint
  checkApiHealth: async (): Promise<boolean> => {
    try {
      const endpoint = ENDPOINTS.fetchInstances;
      console.log("Checking API health with endpoint:", endpoint);
      const response = await apiClient.get(endpoint);
      return !!response; // Return true if response exists
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  },

  // Get connection status for an instance
  getConnectionState: async (instanceName: string): Promise<ConnectionStateResponse> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.connectionState, { instanceName });
      return await apiClient.get<ConnectionStateResponse>(endpoint);
    } catch (error) {
      console.error(`Error getting connection state for ${instanceName}:`, error);
      throw error;
    }
  },

  // Create a new WhatsApp instance - FIXED: Adding proper integration parameter
  createInstance: async (instanceName: string, userId?: string) => {
    try {
      const endpoint = ENDPOINTS.instanceCreate;
      
      // FIXED: Using the correct integration parameter "WHATSAPP-BAILEYS"
      const instanceData = {
        instanceName,
        integration: "WHATSAPP-BAILEYS", // CRITICAL FIX: Exact string with no extra spaces or characters
        token: userId || "default_user",
        qrcode: true
      };
      
      console.log("Creating instance with data:", JSON.stringify(instanceData));
      
      return await apiClient.post(endpoint, instanceData);
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
  },

  // Get the QR code for an instance
  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnectQR, { instanceName });
      return await apiClient.get<QrCodeResponse>(endpoint);
    } catch (error) {
      console.error(`Error getting QR code for ${instanceName}:`, error);
      throw error;
    }
  },

  // Get information about an instance
  getInstanceInfo: async (instanceName: string): Promise<InstanceInfo> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceInfo, { instanceName });
      return await apiClient.get<InstanceInfo>(endpoint);
    } catch (error) {
      console.error(`Error getting instance info for ${instanceName}:`, error);
      throw error;
    }
  },

  // Fetch all instances
  fetchInstances: async (): Promise<InstancesListResponse> => {
    try {
      const endpoint = ENDPOINTS.fetchInstances;
      return await apiClient.get<InstancesListResponse>(endpoint);
    } catch (error) {
      console.error("Error fetching instances:", error);
      throw error;
    }
  },

  // Logout/disconnect an instance
  logoutInstance: async (instanceName: string) => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceLogout, { instanceName });
      return await apiClient.delete(endpoint);
    } catch (error) {
      console.error(`Error logging out instance ${instanceName}:`, error);
      throw error;
    }
  },

  // List all instances
  listInstances: async (): Promise<InstancesListResponse> => {
    try {
      return await whatsappService.fetchInstances();
    } catch (error) {
      console.error("Error listing instances:", error);
      throw error;
    }
  }
};

export default whatsappService;
export { whatsappService };

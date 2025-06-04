import { 
  USE_MOCK_DATA 
} from '@/constants/api';
import { 
  WebhookConfigResponse, 
  ConnectionStateResponse, 
  QrCodeResponse,
  InstanceInfo,
  InstancesListResponse,
  WhatsAppInstanceResponse
} from '@/services/whatsapp/types';
import { secureApiClient } from '@/services/whatsapp/secureApiClient';

/**
 * Service for WhatsApp API interactions using secure Edge Functions
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
      
      // Use secure API client for webhook configuration
      const data = await secureApiClient.setWebhook(instanceName, {
        url: "https://webhooksaas.geni.chat/webhook/principal",
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      });
      
      console.log("Webhook configuration successful:", data);
      return data;
    } catch (error) {
      console.error("Error configuring webhook:", error);
      throw error;
    }
  },

  /**
   * Configure instance settings with recommended defaults
   * Must be called after successful instance creation and connection
   */
  configureInstanceSettings: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Configuring instance settings for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Instance settings configured successfully (mock)",
          settings: {
            rejectCall: false,
            alwaysOnline: true,
            readMessages: true
          }
        };
      }

      // Configurações padrão recomendadas para todas as instâncias
      const instanceSettings = {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false
      };

      // Use secure API client for settings configuration
      const data = await secureApiClient.updateSettings(instanceName, instanceSettings);
      console.log("Instance settings configuration successful:", data);
      return data;
    } catch (error) {
      console.error("Error configuring instance settings:", error);
      throw error;
    }
  },

  /**
   * Configure instance settings without blocking (fire and forget)
   */
  configureInstanceSettingsNonBlocking: async (instanceName: string): Promise<void> => {
    try {
      console.log(`[NON-BLOCKING] Configuring instance settings for: ${instanceName}`);
      
      // Fire and forget - don't wait for response
      secureApiClient.updateSettings(instanceName, {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false
      }).catch(error => {
        console.error(`[NON-BLOCKING] Failed to configure settings for ${instanceName}:`, error);
      });
    } catch (error) {
      console.error(`[NON-BLOCKING] Error configuring instance settings for ${instanceName}:`, error);
    }
  },

  /**
   * Configure webhook without blocking (fire and forget)
   */
  configureWebhookNonBlocking: async (instanceName: string): Promise<void> => {
    try {
      console.log(`[NON-BLOCKING] Configuring webhook for instance: ${instanceName}`);
      
      // Fire and forget - don't wait for response
      secureApiClient.setWebhook(instanceName, {
        url: "https://webhooksaas.geni.chat/webhook/principal",
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      }).catch(error => {
        console.error(`[NON-BLOCKING] Failed to configure webhook for ${instanceName}:`, error);
      });
    } catch (error) {
      console.error(`[NON-BLOCKING] Error configuring webhook for ${instanceName}:`, error);
    }
  },

  /**
   * Normalize QR code response to ensure consistent format
   */
  normalizeQrCodeResponse: (response: any): QrCodeResponse => {
    // Handle different response formats from Evolution API
    if (response?.qrcode) {
      return {
        status: response.status || "success",
        qrcode: response.qrcode,
        code: response.qrcode.code || response.qrcode,
        base64: response.qrcode.base64 || response.qrcode,
        instanceName: response.instanceName
      };
    }
    
    if (response?.code || response?.base64) {
      return {
        status: response.status || "success",
        qrcode: response,
        code: response.code,
        base64: response.base64,
        instanceName: response.instanceName
      };
    }
    
    return response;
  },

  /**
   * Check if Evolution API is healthy and responding
   */
  checkApiHealth: async (): Promise<boolean> => {
    try {
      console.log("Checking Evolution API health...");
      
      // Try to fetch instances as a health check
      await secureApiClient.fetchInstances();
      console.log("Evolution API health check passed");
      return true;
    } catch (error) {
      console.error("Evolution API health check failed:", error);
      return false;
    }
  },

  /**
   * Get connection state for an instance
   */
  getConnectionState: async (instanceName: string): Promise<ConnectionStateResponse> => {
    try {
      console.log(`Getting connection state for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return {
          status: "success",
          state: "open"
        };
      }
      
      const data = await secureApiClient.getConnectionState(instanceName);
      console.log(`Connection state for ${instanceName}:`, data);
      return data;
    } catch (error) {
      console.error(`Error getting connection state for ${instanceName}:`, error);
      throw error;
    }
  },

  /**
   * Create a new WhatsApp instance
   */
  createInstance: async (instanceName: string, userId?: string): Promise<WhatsAppInstanceResponse> => {
    try {
      console.log(`Creating instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return {
          instance: {
            instanceName: instanceName,
            instanceId: "mock-id",
            integration: "baileys",
            webhookWaBusiness: null,
            accessTokenWaBusiness: "",
            status: "created"
          },
          hash: "mock-hash-123",
          webhook: {
            enabled: true,
            url: "https://webhooksaas.geni.chat/webhook/principal",
            webhook_by_events: false,
            webhook_base64: false,
            events: ["MESSAGES_UPSERT"]
          },
          websocket: null,
          rabbitmq: null,
          sqs: null,
          settings: {
            rejectCall: false,
            msgCall: "",
            groupsIgnore: true,
            alwaysOnline: true,
            readMessages: true,
            readStatus: true,
            syncFullHistory: false,
            wavoipToken: ""
          }
        };
      }

      const instanceData = {
        instanceName,
        token: instanceName,
        qrcode: true,
        number: "",
        webhook: "https://webhooksaas.geni.chat/webhook/principal",
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE", 
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      };

      const createResponse = await secureApiClient.createInstance(instanceData);
      console.log("Instance creation successful:", createResponse);
      
      // Configure settings and webhook non-blocking
      whatsappService.configureInstanceSettingsNonBlocking(instanceName);
      whatsappService.configureWebhookNonBlocking(instanceName);
      
      return createResponse;
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
  },

  /**
   * Get QR code for an instance
   */
  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    try {
      console.log(`Getting QR code for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return {
          qrcode: "mock-qr-code",
          base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          code: "mock-qr-code"
        };
      }
      
      // First check connection state
      const state = await secureApiClient.getConnectionState(instanceName);
      
      if (state.state === 'open') {
        throw new Error('Instance is already connected');
      }
      
      // Get QR code
      const qrResponse = await secureApiClient.getQRCode(instanceName);
      
      // Normalize the response format
      return whatsappService.normalizeQrCodeResponse(qrResponse);
    } catch (error) {
      console.error(`Error getting QR code for ${instanceName}:`, error);
      throw error;
    }
  },

  /**
   * Get instance information
   */
  getInstanceInfo: async (instanceName: string): Promise<InstanceInfo> => {
    try {
      console.log(`Getting instance info for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return {
          instance: {
            name: instanceName,
            status: "connected",
            isConnected: true,
            user: {
              id: "mock-user-id",
              name: "Mock Owner",
              phone: "555-0123"
            }
          }
        };
      }
      
      const data = await secureApiClient.getInstanceInfo(instanceName);
      console.log(`Instance info for ${instanceName}:`, data);
      return data;
    } catch (error) {
      console.error(`Error getting instance info for ${instanceName}:`, error);
      throw error;
    }
  },

  /**
   * Delete an instance
   */
  deleteInstance: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Deleting instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return true;
      }
      
      await secureApiClient.deleteInstance(instanceName);
      console.log(`Instance ${instanceName} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting instance ${instanceName}:`, error);
      return false;
    }
  },

  /**
   * Fetch all instances
   */
  fetchInstances: async (): Promise<InstancesListResponse> => {
    try {
      console.log("Fetching instances...");
      
      if (USE_MOCK_DATA) {
        return [
          {
            id: "mock-instance-1",
            name: "mock-instance-1",
            connectionStatus: "connected"
          }
        ];
      }
      
      const instances = await secureApiClient.fetchInstances();
      console.log("Instances fetched successfully:", instances);
      return instances;
    } catch (error) {
      console.error("Error fetching instances:", error);
      // Return empty list on error
      return [];
    }
  },

  /**
   * Logout an instance (disconnect without deleting)
   */
  logoutInstance: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Logging out instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        return true;
      }
      
      // Use connection method to disconnect
      const response = await secureApiClient.connectInstance(instanceName);
      console.log(`Instance ${instanceName} logged out successfully`);
      return true;
    } catch (error) {
      console.error(`Error logging out instance ${instanceName}:`, error);
      return false;
    }
  },

  /**
   * List instances (alias for fetchInstances for backward compatibility)
   */
  listInstances: async (): Promise<InstancesListResponse> => {
    return whatsappService.fetchInstances();
  }
};

export { whatsappService };
export default whatsappService;

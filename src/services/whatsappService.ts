
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
  InstancesListResponse,
  WhatsAppInstanceRequest,
  WhatsAppInstanceResponse
} from '@/services/whatsapp/types';
import { apiClient, formatEndpoint } from '@/services/whatsapp/apiClient';
import { supabase } from '@/integrations/supabase/client';

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
        webhookBase64: false,
        events: ["MESSAGES_UPSERT", "MESSAGE_UPDATE"]
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
      console.log(`Getting connection state from endpoint: ${endpoint}`);
      
      const response = await apiClient.get<ConnectionStateResponse>(endpoint);
      console.log(`Connection state response for ${instanceName}:`, response);
      
      // Store connection state in Supabase if possible
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // Extract state from any of the possible response formats
          const state = response?.state || 
                      (response?.instance?.state) || 
                      response?.status || 
                      "unknown";
                      
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              status: state,
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating connection state in Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to save connection state to Supabase:", saveError);
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting connection state for ${instanceName}:`, error);
      throw error;
    }
  },

  // Create a new WhatsApp instance
  createInstance: async (instanceName: string, userId?: string) => {
    try {
      const endpoint = ENDPOINTS.instanceCreate;
      const instanceData: WhatsAppInstanceRequest = {
        instanceName,
        // IMPORTANTE: Use exatamente o valor correto para o parâmetro de integração
        integration: "WHATSAPP-BAILEYS", 
        token: userId || "default_user",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      };
      
      console.log("Creating instance with exact data:", JSON.stringify(instanceData, null, 2));
      
      const response = await apiClient.post<WhatsAppInstanceResponse>(endpoint, instanceData);
      
      // Store instance data in Supabase if possible
      if (userId) {
        try {
          // Convert the complex object to a JSON-compatible structure
          const sessionData = JSON.parse(JSON.stringify(response));
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .upsert({
              name: instanceName,
              user_id: userId,
              status: 'created',
              evolution_instance_id: response.instance?.instanceId || null,
              session_data: sessionData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.error("Error saving instance data to Supabase:", error);
          }
        } catch (saveError) {
          console.error("Failed to save instance data to Supabase:", saveError);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
  },

  // Get the QR code for an instance using the correct connect endpoint
  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    try {
      // IMPORTANTE: Using the correct endpoint name from ENDPOINTS
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnectQR, { instanceName });
      console.log(`Getting QR code using connect endpoint: ${endpoint}`);
      
      // Make the request and log the full response for debugging
      const response = await apiClient.get<QrCodeResponse>(endpoint);
      console.log(`QR code response for ${instanceName}:`, JSON.stringify(response, null, 2));
      
      // Save QR code to Supabase if possible
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && (response.code || response.qrcode || response.base64)) {
          const qrCode = response.code || response.qrcode || response.base64;
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: qrCode,
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error saving QR code to Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to save QR code to Supabase:", saveError);
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting QR code for ${instanceName}:`, error);
      throw error;
    }
  },

  // Get information about an instance
  getInstanceInfo: async (instanceName: string): Promise<InstanceInfo> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceInfo, { instanceName });
      const response = await apiClient.get<InstanceInfo>(endpoint);
      
      // If we have a phone number, update Supabase
      if (response?.instance?.user?.id) {
        try {
          // Extract phone number from user.id (format: "number@s.whatsapp.net")
          const phoneNumber = response.instance.user.id.split('@')[0];
          
          // Check if user is logged in
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id && phoneNumber) {
            const { error } = await supabase
              .from('whatsapp_instances')
              .update({ 
                phone_number: phoneNumber,
                status: 'connected',
                updated_at: new Date().toISOString()
              })
              .eq('name', instanceName)
              .eq('user_id', user.id);
              
            if (error) {
              console.error("Error saving phone number to Supabase:", error);
            }
          }
        } catch (saveError) {
          console.error("Failed to save phone number to Supabase:", saveError);
        }
      }
      
      return response;
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
      const response = await apiClient.delete(endpoint);
      
      // Update status in Supabase
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating logout status in Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to update logout status in Supabase:", saveError);
      }
      
      return response;
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

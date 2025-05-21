
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE, USE_BEARER_AUTH } from '../constants/api';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppInstanceRequest {
  instanceName: string; // Instance name for the request
  integration: string; // Integration type
}

interface WhatsAppInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  webhookWaBusiness: string | null;
  accessTokenWaBusiness: string;
  status: string;
}

interface WhatsAppInstanceResponse {
  instance: WhatsAppInstance;
  hash: string;
  webhook: Record<string, any>;
  websocket: Record<string, any>;
  rabbitmq: Record<string, any>;
  sqs: Record<string, any>;
  settings: {
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
  };
}

// Helper function to replace placeholders in endpoint URLs
const formatEndpoint = (endpoint: string, params: Record<string, string>): string => {
  let formattedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    formattedEndpoint = formattedEndpoint.replace(`{${key}}`, value);
  });
  return formattedEndpoint;
};

// Store WhatsApp instance data in Supabase
const storeInstanceData = async (userId: string, instanceData: WhatsAppInstanceResponse): Promise<void> => {
  try {
    // Use the new agents table instead of whatsapp_instances
    const { error } = await supabase.from('agents').upsert({
      user_id: userId,
      instance_name: instanceData.instance.instanceName,
      instance_id: instanceData.instance.instanceId,
      integration: instanceData.instance.integration,
      status: instanceData.instance.status,
      hash: instanceData.hash,
      webhook_wa_business: instanceData.instance.webhookWaBusiness,
      access_token_wa_business: instanceData.instance.accessTokenWaBusiness,
      settings: instanceData.settings
    });

    if (error) {
      console.error("Error storing instance data in Supabase:", error);
      throw error;
    }
    
    console.log("Successfully stored instance data in Supabase for instance:", instanceData.instance.instanceName);
  } catch (error) {
    console.error("Error in storeInstanceData:", error);
    throw error;
  }
};

// WhatsApp connection service
export const whatsappService = {
  // Create a WhatsApp instance
  createInstance: async (instanceName: string, userId?: string): Promise<any> => {
    console.log(`Creating WhatsApp instance: ${instanceName}`);
    
    // Format instance name to be valid (replace spaces with underscores, etc.)
    const formattedInstanceName = instanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // We're enforcing real API calls for production use
    if (USE_MOCK_DATA) {
      console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
      const mockResponse = {
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
      
      return {
        status: "success",
        message: "Instance created successfully (mock)",
        ...mockResponse
      };
    }
    
    try {
      const requestBody: WhatsAppInstanceRequest = {
        instanceName: formattedInstanceName,
        integration: "WHATSAPP-BAILEYS"
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use apikey header instead of Bearer token
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      console.log("API URL:", `${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`);
      console.log("Using headers:", JSON.stringify(headers, null, 2));
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      console.log("Instance creation response status:", response.status);
      
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Instance creation failed with status ${response.status}:`, errorData);
        
        // More specific error for duplicate names
        if (response.status === 403 && errorData?.response?.message) {
          const messages = Array.isArray(errorData.response.message) 
            ? errorData.response.message 
            : [errorData.response.message];
          
          for (const msg of messages) {
            if (typeof msg === 'string' && msg.includes('already in use')) {
              throw new Error(`This name "${formattedInstanceName}" is already in use.`);
            }
          }
        }
        
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instance creation successful response:", data);
      
      // Store the complete instance data in Supabase if userId is provided
      if (userId) {
        await storeInstanceData(userId, data);
      }
      
      // Return the data - we'll immediately get the QR code in a separate call
      return data;
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Connect to an existing WhatsApp instance and get QR code
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
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      // Use the correct endpoint for connection and QR code
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnect, { instanceName });
      console.log("Connect instance URL:", `${EVOLUTION_API_URL}${endpoint}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
        method: 'GET',
        headers: headers
      });
      
      console.log("Instance connection response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Instance connection failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instance connection successful:", data);
      return data;
    } catch (error) {
      console.error("Error connecting to WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Get QR code for WhatsApp connection - now uses the correct /instance/connect endpoint
  getQrCode: async (instanceName: string): Promise<any> => {
    return whatsappService.connectToInstance(instanceName);
  },
  
  // Check connection status
  getConnectionState: async (instanceName: string): Promise<any> => {
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
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      // We'll append the instanceName as a query parameter for connection state
      const url = new URL(`${EVOLUTION_API_URL}${ENDPOINTS.connectionState}`);
      url.searchParams.append('instanceName', instanceName);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers
      });
      
      console.log("Connection state response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Connection state check failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Connection state retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error checking connection state:", error);
      throw error;
    }
  },
  
  // Get instance information
  getInstanceInfo: async (instanceName: string): Promise<any> => {
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
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      // Use query parameter for instance info endpoint
      const url = new URL(`${EVOLUTION_API_URL}${ENDPOINTS.instanceInfo}`);
      url.searchParams.append('instanceName', instanceName);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers
      });
      
      console.log("Instance info response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Instance info retrieval failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instance info retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error getting instance info:", error);
      throw error;
    }
  },
  
  // List all instances (for debugging)
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
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instances}`, {
        method: 'GET',
        headers: headers
      });
      
      console.log("List instances response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`List instances failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instances list:", data);
      return data;
    } catch (error) {
      console.error("Error listing instances:", error);
      throw error;
    }
  },
  
  // Logout/disconnect WhatsApp - THIS SHOULD NEVER BE CALLED DURING CREATION
  logout: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Logging out instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return true;
      }
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      // Use query parameter for logout endpoint
      const url = new URL(`${EVOLUTION_API_URL}${ENDPOINTS.instanceLogout}`);
      url.searchParams.append('instanceName', instanceName);
      
      const response = await fetch(url.toString(), {
        method: 'DELETE', // Only use DELETE for explicit logout, never during creation
        headers: headers
      });
      
      console.log("Logout response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Logout failed with status ${response.status}:`, errorData);
      }
      
      return response.ok;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }
};


import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE, USE_BEARER_AUTH, MAX_CONNECTION_RETRIES, RETRY_DELAY_MS } from '../constants/api';
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

// Helper function to create API headers with proper authorization
const createHeaders = (contentType: boolean = false): HeadersInit => {
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

// Retry function with exponential backoff
const retryOperation = async <T>(
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

// Check if the API is accessible, useful for debugging connection issues
const checkApiHealth = async (): Promise<boolean> => {
  try {
    // First, try the health endpoint if available
    const healthUrl = `${EVOLUTION_API_URL}${ENDPOINTS.healthCheck}`;
    const headers = createHeaders();
    
    try {
      const response = await fetch(healthUrl, { 
        method: 'GET',
        headers: headers
      });
      
      if (response.ok) {
        console.log("API health check successful");
        return true;
      }
    } catch (e) {
      console.log("Health endpoint not available, trying instances endpoint");
    }
    
    // If health endpoint fails, try instances as a fallback
    const instancesUrl = `${EVOLUTION_API_URL}${ENDPOINTS.instances}`;
    const instancesResponse = await fetch(instancesUrl, {
      method: 'GET',
      headers: headers
    });
    
    // Even a 404 could mean the API is accessible but endpoint not found
    if (instancesResponse.status !== 403 && instancesResponse.status !== 401) {
      console.log("API accessibility check successful (instances endpoint)");
      return true;
    }
    
    console.error("API health check failed, possibly authentication issue");
    return false;
  } catch (error) {
    console.error("API health check failed with exception:", error);
    return false;
  }
};

// WhatsApp connection service
export const whatsappService = {
  // Check API health first
  checkApiHealth,
  
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
      // First check API health
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      const requestBody: WhatsAppInstanceRequest = {
        instanceName: formattedInstanceName,
        integration: "WHATSAPP-BAILEYS"
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const headers = createHeaders(true);
      
      console.log("API URL:", `${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`);
      console.log("Using headers:", JSON.stringify(headers, null, 2));
      
      // Use retry mechanism for instance creation
      return await retryOperation(async () => {
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
      }, 3, 2000);
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
      
      const headers = createHeaders();
      
      // Use the correct endpoint for connection and QR code
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnect, { instanceName });
      console.log("Connect instance URL:", `${EVOLUTION_API_URL}${endpoint}`);
      
      // Use retry mechanism for connection
      return await retryOperation(async () => {
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
          
          // Special handling for authentication errors
          if (response.status === 403 || response.status === 401) {
            throw new Error("Authentication failed. Please check your API key and try again.");
          }
          
          throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        console.log("Instance connection successful:", data);
        
        // Check if we have a QR code or if connection is already established
        if (data.qrcode || data.pairingCode || (data.instance && data.instance.state === "open")) {
          return data;
        } else {
          // If we don't have what we need, try again
          throw new Error("QR code or pairing code not received in response");
        }
      }, 3, 2000);
    } catch (error) {
      console.error("Error connecting to WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Get QR code for WhatsApp connection - now uses the correct /instance/connect endpoint
  getQrCode: async (instanceName: string): Promise<any> => {
    return whatsappService.connectToInstance(instanceName);
  },
  
  // Check connection status - UPDATED to use correct endpoint with improved error handling
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
      
      const headers = createHeaders();
      
      // Use the corrected endpoint with proper URL path parameter
      const endpoint = formatEndpoint(ENDPOINTS.connectionState, { instanceName });
      const url = `${EVOLUTION_API_URL}${endpoint}`;
      
      console.log("Connection state URL:", url);
      
      // Use retry for getting connection state
      return await retryOperation(async () => {
        const response = await fetch(url, {
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
          
          // Special handling for authentication errors
          if (response.status === 403 || response.status === 401) {
            throw new Error("Authentication failed. Please check your API key and try again.");
          }
          
          console.error(`Connection state check failed with status ${response.status}:`, errorData);
          throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        console.log("Connection state retrieved:", data);
        return data;
      }, 3, 2000, (error) => {
        // Only retry on network errors or certain status codes
        return !(error instanceof Error && error.message.includes("Authentication failed"));
      });
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
      
      const headers = createHeaders();
      
      // Use query parameter for instance info endpoint
      const url = new URL(`${EVOLUTION_API_URL}${ENDPOINTS.instanceInfo}`);
      url.searchParams.append('instanceName', instanceName);
      
      // Use retry for getting instance info
      return await retryOperation(async () => {
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
      }, 3, 2000);
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
      
      const headers = createHeaders();
      
      // Use retry for listing instances
      return await retryOperation(async () => {
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
      }, 3, 2000);
    } catch (error) {
      console.error("Error listing instances:", error);
      throw error;
    }
  },
  
  // New method to fetch instances with optional filtering
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
      
      const headers = createHeaders();
      
      // Build URL with optional query parameters
      const url = new URL(`${EVOLUTION_API_URL}${ENDPOINTS.fetchInstances}`);
      
      // Add query parameters if provided
      if (options.instanceName) {
        url.searchParams.append('instanceName', options.instanceName);
      }
      
      if (options.instanceId) {
        url.searchParams.append('instanceId', options.instanceId);
      }
      
      console.log("Fetch instances URL:", url.toString());
      
      // Use retry for fetching instances
      return await retryOperation(async () => {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: headers
        });
        
        console.log("Fetch instances response status:", response.status);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = await response.text();
          }
          console.error(`Fetch instances failed with status ${response.status}:`, errorData);
          throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        console.log("Instances fetched successfully:", data);
        return data;
      }, 3, 2000);
    } catch (error) {
      console.error("Error fetching instances:", error);
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
      
      const headers = createHeaders();
      
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

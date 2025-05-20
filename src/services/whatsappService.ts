
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE, USE_BEARER_AUTH } from '../constants/api';

interface WhatsAppInstanceRequest {
  name: string; // Instance name for the request
}

// Helper function to replace placeholders in endpoint URLs
const formatEndpoint = (endpoint: string, params: Record<string, string>): string => {
  let formattedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    formattedEndpoint = formattedEndpoint.replace(`{${key}}`, value);
  });
  return formattedEndpoint;
};

// WhatsApp connection service
export const whatsappService = {
  // Create a WhatsApp instance
  createInstance: async (instanceName: string): Promise<any> => {
    console.log(`Creating WhatsApp instance: ${instanceName}`);
    
    // We're enforcing real API calls for production use
    if (USE_MOCK_DATA) {
      console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
      return {
        status: "success",
        message: "Instance created successfully (mock)",
        instance: {
          instanceName,
          token: "mock-token-12345",
          qrcode: MOCK_QR_CODE
        }
      };
    }
    
    try {
      const requestBody: WhatsAppInstanceRequest = {
        name: instanceName
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use Bearer token authentication as required
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
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instance creation successful response:", data);
      
      // The response should contain the instanceName, token, and QR code
      // If QR is not in the initial response, immediately fetch it
      if (!data.qrcode && data.instance && data.instance.name) {
        console.log("QR code not in creation response, fetching it separately");
        try {
          const qrData = await whatsappService.getQrCode(data.instance.name);
          // Combine the instance data with the QR code data
          data.qrcode = qrData.qrcode || qrData.base64 || qrData.qr;
        } catch (qrError) {
          console.error("Failed to fetch QR code after instance creation:", qrError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Get QR code for WhatsApp connection
  getQrCode: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Fetching QR code for instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          qrcode: MOCK_QR_CODE,
          message: "QR Code generated successfully (mock)"
        };
      }
      
      const headers: HeadersInit = {};
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      const endpoint = formatEndpoint(ENDPOINTS.qrCode, { instanceName });
      
      console.log("QR code request URL:", `${EVOLUTION_API_URL}${endpoint}`);
      console.log("Using headers:", JSON.stringify(headers, null, 2));
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
        method: 'GET',
        headers: headers
      });
      
      console.log("QR code response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`QR code retrieval failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("QR Code retrieved successfully (data):", data);
      
      return data;
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
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
      
      const endpoint = formatEndpoint(ENDPOINTS.connectionState, { instanceName });
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
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
      
      const endpoint = formatEndpoint(ENDPOINTS.instanceInfo, { instanceName });
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
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
  
  // Logout/disconnect WhatsApp
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
      
      const endpoint = formatEndpoint(ENDPOINTS.instanceLogout, { instanceName });
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
        method: 'DELETE',
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

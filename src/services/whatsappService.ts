
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE, USE_BEARER_AUTH } from '../constants/api';

interface WhatsAppInstanceRequest {
  name: string; // Changed from instanceName to name based on API
  webhook?: string | null;
  webhookByEvents?: boolean;
  qrQuality?: number;
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
    
    // For development/demo when direct API access is blocked by CORS
    if (USE_MOCK_DATA) {
      console.log("Using mock data for createInstance");
      return {
        status: "success",
        message: "Instance created successfully (mock)",
        instance: {
          instanceName,
          token: "mock-token-12345",
          status: "created"
        }
      };
    }
    
    try {
      const requestBody: WhatsAppInstanceRequest = {
        name: instanceName,
        qrQuality: 2, // Medium quality QR code
        webhook: null, // No webhook for now
        webhookByEvents: false
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use Bearer token or API key based on configuration
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      console.log("API URL:", `${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`);
      console.log("Using headers:", headers);
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      console.log("Instance creation response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        console.error(`Instance creation failed with status ${response.status}:`, errorData);
        
        // If instance already exists, don't treat it as an error
        if (response.status === 409) {
          console.log("Instance already exists, proceeding to connect");
          return {
            status: "success",
            message: "Instance already exists (will connect to existing)",
            instance: {
              name: instanceName,
              status: "exists"
            }
          };
        }
        
        throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Instance creation successful:", data);
      return data;
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Connect to existing instance
  connectToInstance: async (instanceName: string): Promise<any> => {
    console.log(`Connecting to WhatsApp instance: ${instanceName}`);
    
    // For development/demo when direct API access is blocked by CORS
    if (USE_MOCK_DATA) {
      console.log("Using mock data for connectToInstance");
      return {
        status: "success",
        message: "Instance connected successfully (mock)",
        instance: {
          name: instanceName,
          connected: true
        }
      };
    }
    
    try {
      const requestBody = { name: instanceName };
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (USE_BEARER_AUTH) {
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      } else {
        headers['apikey'] = EVOLUTION_API_KEY;
      }
      
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnect, { instanceName });
      
      const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
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
  
  // Get QR code for WhatsApp connection
  getQrCode: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Fetching QR code for instance: ${instanceName}`);
      
      // For development/demo when direct API access is blocked by CORS
      if (USE_MOCK_DATA) {
        console.log("Using mock data for QR code");
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
      
      console.log("QR code endpoint:", `${EVOLUTION_API_URL}${endpoint}`);
      
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
      
      // Check if the response contains the QR code
      if (!data.qrcode && !data.base64 && !data.qr) {
        console.warn("QR code response doesn't contain expected QR data fields");
        console.log("Available fields in response:", Object.keys(data));
        
        // Try to identify any field that might contain the QR code
        const possibleQRFields = Object.keys(data).filter(key => 
          typeof data[key] === 'string' && data[key].length > 100
        );
        
        if (possibleQRFields.length > 0) {
          console.log("Possible QR code fields found:", possibleQRFields);
          data.qrcode = data[possibleQRFields[0]]; // Use the first candidate
        }
      }
      
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
      
      // For development/demo when direct API access is blocked by CORS
      if (USE_MOCK_DATA) {
        // Simulate a connection after a certain number of attempts
        const mockState = Math.random() > 0.7 ? "open" : "connecting";
        console.log(`Using mock data for connection state: ${mockState}`);
        
        return {
          status: "success",
          state: mockState,
          message: `WhatsApp connection state: ${mockState} (mock)`
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
      
      // For development/demo when direct API access is blocked by CORS
      if (USE_MOCK_DATA) {
        console.log("Using mock data for instance info");
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
      
      // For development/demo when direct API access is blocked by CORS
      if (USE_MOCK_DATA) {
        console.log("Using mock data for listing instances");
        return {
          status: "success",
          instances: [
            {
              name: "mock_instance_1",
              status: "connected"
            },
            {
              name: "mock_instance_2",
              status: "disconnected"
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
      
      // For development/demo when direct API access is blocked by CORS
      if (USE_MOCK_DATA) {
        console.log("Using mock data for logout");
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

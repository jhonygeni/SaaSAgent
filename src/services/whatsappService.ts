
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS, USE_MOCK_DATA, MOCK_QR_CODE } from '../constants/api';

interface WhatsAppInstanceRequest {
  instanceName: string;
  token?: string;
  webhook?: string | null;
  webhookByEvents?: boolean;
  qrQuality?: number;
}

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
        instanceName,
        qrQuality: 2, // Medium quality QR code
        webhook: null, // No webhook for now
        webhookByEvents: false
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceCreate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Instance creation response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Instance creation failed with status ${response.status}:`, errorData);
        
        // If instance already exists, don't treat it as an error
        if (response.status === 409) {
          console.log("Instance already exists, proceeding to connect");
          return {
            status: "success",
            message: "Instance already exists (will connect to existing)",
            instance: {
              instanceName,
              status: "exists"
            }
          };
        }
        
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
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
          instanceName,
          connected: true
        }
      };
    }
    
    try {
      const requestBody = { instanceName };
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceConnect}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Instance connection response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Instance connection failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
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
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.qrCode}?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      console.log("QR code response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`QR code retrieval failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
      }
      
      const data = await response.json();
      console.log("QR Code retrieved successfully (data length):", JSON.stringify(data).length);
      
      // Check if the response contains the QR code
      if (!data.qrcode && !data.base64) {
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
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.connectionState}?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      console.log("Connection state response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Connection state check failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
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
            instanceName,
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
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceInfo}?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      console.log("Instance info response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Instance info retrieval failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
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
              instanceName: "mock_instance_1",
              status: "connected"
            },
            {
              instanceName: "mock_instance_2",
              status: "disconnected"
            }
          ]
        };
      }
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instances}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      console.log("List instances response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`List instances failed with status ${response.status}:`, errorData);
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
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
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.instanceLogout}?key=${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      console.log("Logout response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Logout failed with status ${response.status}:`, errorData);
      }
      
      return response.ok;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }
};

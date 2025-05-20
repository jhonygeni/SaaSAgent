
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS } from '../constants/api';

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
      console.log("QR Code retrieved successfully:", data);
      
      // Check if the response contains the QR code
      if (!data.qrcode && !data.base64) {
        console.warn("QR code response doesn't contain expected QR data:", data);
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

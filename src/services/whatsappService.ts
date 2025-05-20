
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS } from '../constants/api';

interface WhatsAppInstanceRequest {
  instanceName: string;
  token?: string;
  qrQuality?: number;
}

// WhatsApp connection service
export const whatsappService = {
  // Create or connect to a WhatsApp instance
  createInstance: async (instanceName: string): Promise<any> => {
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    
    try {
      const requestBody: WhatsAppInstanceRequest = {
        instanceName,
        qrQuality: 2 // Increased QR quality (1-100)
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.connect}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY // Using apikey header instead of authorization
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Instance creation response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Evolution API Error:", response.status, errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Instance created successfully:", data);
      return { ...data, token: EVOLUTION_API_KEY };
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Get QR code for WhatsApp connection
  getQrCode: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Fetching QR code for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/qr?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY // Using apikey header
        }
      });
      
      console.log("QR code response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error getting QR code:", response.status, errorText);
        throw new Error(`Failed to get QR code: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("QR Code retrieved successfully");
      return data;
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  },
  
  // Check connection status
  getStatus: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Checking connection status for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY // Using apikey header
        }
      });
      
      console.log("Status response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Error checking status:", error);
      throw error;
    }
  },
  
  // Get phone information
  getPhoneInfo: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Getting phone info for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/info?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY // Using apikey header
        }
      });
      
      console.log("Phone info response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to get phone info: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Error getting phone info:", error);
      throw error;
    }
  },
  
  // Logout/disconnect WhatsApp
  logout: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Logging out instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/disconnect?key=${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY // Using apikey header
        }
      });
      
      console.log("Logout response status:", response.status);
      
      if (!response.ok) {
        console.error(`Logout failed with status: ${response.status}`);
      }
      
      return response.ok;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }
};

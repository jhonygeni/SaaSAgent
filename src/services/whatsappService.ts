
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS } from '../constants/api';

interface WhatsAppInstanceRequest {
  instanceName: string;
  token?: string;
  qrQuality?: number;
}

interface AuthResponse {
  token: string;
  success: boolean;
}

// WhatsApp connection service
export const whatsappService = {
  // Authenticate with Evolution API
  authenticate: async (): Promise<string> => {
    console.log("Authenticating with Evolution API");
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: EVOLUTION_API_KEY
        })
      });
      
      console.log("Authentication response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Authentication Error:", response.status, errorText);
        throw new Error(`Authentication failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json() as AuthResponse;
      console.log("Authentication successful, token received");
      return data.token;
    } catch (error) {
      console.error("Error authenticating:", error);
      throw error;
    }
  },
  
  // Create or connect to a WhatsApp instance
  createInstance: async (instanceName: string): Promise<any> => {
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    
    try {
      // First authenticate to get a valid token
      const token = await whatsappService.authenticate();
      
      const requestBody: WhatsAppInstanceRequest = {
        instanceName,
        qrQuality: 2 // Increased QR quality (1-100)
      };
      
      console.log("Request payload for instance creation:", JSON.stringify(requestBody));
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.connect}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      return { ...data, token };
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  },
  
  // Get QR code for WhatsApp connection
  getQrCode: async (instanceName: string): Promise<any> => {
    try {
      // First authenticate to get a valid token
      const token = await whatsappService.authenticate();
      
      console.log(`Fetching QR code for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/qr?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
      // First authenticate to get a valid token
      const token = await whatsappService.authenticate();
      
      console.log(`Checking connection status for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
      // First authenticate to get a valid token
      const token = await whatsappService.authenticate();
      
      console.log(`Getting phone info for instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/info?key=${instanceName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
      // First authenticate to get a valid token
      const token = await whatsappService.authenticate();
      
      console.log(`Logging out instance: ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/delete?key=${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
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

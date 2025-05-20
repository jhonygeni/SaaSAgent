
import { EVOLUTION_API_URL, EVOLUTION_API_KEY, ENDPOINTS } from '../constants/api';

interface WhatsAppInstanceRequest {
  instanceName: string;
  token: string;
  qrQuality?: number;
}

// WhatsApp connection service
export const whatsappService = {
  // Create or connect to a WhatsApp instance
  createInstance: async (instanceName: string): Promise<any> => {
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    
    const requestBody: WhatsAppInstanceRequest = {
      instanceName,
      token: EVOLUTION_API_KEY,
      qrQuality: 1 // QR quality (1-100)
    };
    
    console.log("Request payload:", JSON.stringify(requestBody));
    
    const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.connect}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution API Error:", response.status, errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }
    
    return response.json();
  },
  
  // Get QR code for WhatsApp connection
  getQrCode: async (instanceName: string): Promise<any> => {
    const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.qrCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
        'instanceName': instanceName
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Check connection status
  getStatus: async (instanceName: string): Promise<any> => {
    const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.status}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
        'instanceName': instanceName
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Get phone information
  getPhoneInfo: async (instanceName: string): Promise<any> => {
    const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.info}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
        'instanceName': instanceName
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get phone info: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Logout/disconnect WhatsApp
  logout: async (instanceName: string): Promise<any> => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.logout}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify({ instanceName })
      });
      
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

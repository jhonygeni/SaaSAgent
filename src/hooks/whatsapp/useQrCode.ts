
import { useCallback } from 'react';
import whatsappService from '@/services/whatsappService';
import { QrCodeResponse } from '@/services/whatsapp/types';

/**
 * Hook for QR code management
 */
export function useQrCode() {
  // Fetch QR code for WhatsApp instance with correct endpoint
  const fetchQrCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Use the updated QR code endpoint
      console.log(`Fetching QR code for instance: ${instanceName}`);
      const qrData: QrCodeResponse = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      
      // Extract QR code and pairing code from the response
      const qrCode = qrData?.qrcode || qrData?.base64 || qrData?.code;
      
      if (qrCode) {
        console.log("QR code successfully received");
        return qrCode;
      } else {
        console.error("No QR code received in API response:", qrData);
        throw new Error("No QR code received from API");
      }
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  }, []);

  return {
    fetchQrCode
  };
}

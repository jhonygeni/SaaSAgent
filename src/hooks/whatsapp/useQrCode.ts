
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
      console.log(`Fetching QR code for instance: ${instanceName}`);
      
      // Formato consistente para nome da instância
      const formattedName = instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
      console.log(`Using formatted instance name: ${formattedName}`);
      
      // Use o método correto para obter o QR code
      const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
      console.log("QR code response:", qrResponse);
      
      // Check if we got a pairing code
      if (qrResponse?.pairingCode) {
        console.log(`Pairing code received: ${qrResponse.pairingCode}`);
      }
      
      // Handle all possible response formats from the API
      if (qrResponse?.code) {
        console.log("QR code obtained successfully (code)");
        return qrResponse.code;
      }
      
      if (qrResponse?.qrcode) {
        console.log("QR code obtained successfully (qrcode)");
        return qrResponse.qrcode;
      }
      
      if (qrResponse?.base64) {
        console.log("QR code obtained successfully (base64)");
        return qrResponse.base64;
      }
      
      console.warn("QR code not found in API response");
      return null;
    } catch (error) {
      console.error("Error fetching QR code:", error);
      throw error;
    }
  }, []);

  // Fetch just the pairing code for an instance
  const fetchPairingCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      console.log(`Fetching pairing code for instance: ${instanceName}`);
      
      // Formato consistente para nome da instância
      const formattedName = instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
      
      // Get QR response which may contain pairing code
      const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
      
      if (qrResponse?.pairingCode) {
        console.log(`Pairing code retrieved: ${qrResponse.pairingCode}`);
        return qrResponse.pairingCode;
      }
      
      console.warn("Pairing code not found in API response");
      return null;
    } catch (error) {
      console.error("Error fetching pairing code:", error);
      return null;
    }
  }, []);

  return {
    fetchQrCode,
    fetchPairingCode
  };
}

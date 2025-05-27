
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
      const possibleQRProps = ['qrcode', 'base64', 'code', 'qr', 'qrCode', 'data'];
      
      // First check direct properties
      for (const prop of possibleQRProps) {
        if (qrResponse?.[prop]) {
          console.log(`QR code obtained successfully (${prop})`);
          
          // If it's a data object, look for QR inside it
          if (prop === 'data' && typeof qrResponse.data === 'object') {
            for (const innerProp of possibleQRProps) {
              if (qrResponse.data?.[innerProp]) {
                console.log(`QR code found in data.${innerProp}`);
                return qrResponse.data[innerProp];
              }
            }
          } else {
            return qrResponse[prop];
          }
        }
      }

      console.warn("QR code not found in API response. Response keys:", Object.keys(qrResponse || {}));
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

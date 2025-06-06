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
      
      // Use the standard getQrCode method
      const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
      console.log("QR code response:", qrResponse);
      
      // Check if we got an error from normalization
      if (qrResponse?.error) {
        console.error('QR code normalization error:', qrResponse.error);
        throw new Error(qrResponse.error);
      }
      
      // Check if we got a pairing code
      if (qrResponse?.pairingCode) {
        console.log(`Pairing code received: ${qrResponse.pairingCode}`);
      }
      
      // Handle Evolution API v2 response format from /instance/connect/{instance}
      // Expected response: { pairingCode: "WZYEH1YY", code: "2@y8eK+bjtEjUWy9/FOM...", count: 1 }
      
      // Check if we got a pairing code
      if (qrResponse?.pairingCode) {
        console.log(`Pairing code received: ${qrResponse.pairingCode}`);
      }
      
      // Evolution API v2 returns QR code in the 'code' field
      if (qrResponse?.code) {
        const qrData = qrResponse.code;
        if (typeof qrData === 'string' && qrData.length > 0 && qrData.length <= 2000) {
          console.log(`QR code obtained successfully from 'code' field`);
          return qrData;
        }
      }
      
      // Fallback: Handle all possible response formats for backward compatibility
      const possibleQRProps = ['qrcode', 'base64', 'qr', 'qrCode', 'data'];
      let foundValidQr = false;
      
      // First check direct properties
      for (const prop of possibleQRProps) {
        if (qrResponse?.[prop]) {
          console.log(`QR code found in ${prop} property`);
          
          // If it's a data object, look for QR inside it
          if (prop === 'data' && typeof qrResponse.data === 'object') {
            for (const innerProp of ['code', ...possibleQRProps]) {
              if (qrResponse.data?.[innerProp]) {
                console.log(`QR code found in data.${innerProp}`);
                
                // Validate the QR code data before returning
                const qrData = qrResponse.data[innerProp];
                if (typeof qrData === 'string' && qrData.length > 0 && qrData.length <= 2000) {
                  foundValidQr = true;
                  return qrData;
                } else {
                  console.warn(`Invalid QR data from data.${innerProp}:`, typeof qrData, qrData?.length);
                }
              }
            }
          } else {
            // Validate the QR code data before returning
            const qrData = qrResponse[prop];
            if (typeof qrData === 'string' && qrData.length > 0 && qrData.length <= 2000) {
              foundValidQr = true;
              return qrData;
            } else {
              console.warn(`Invalid QR data from ${prop}:`, typeof qrData, qrData?.length);
            }
          }
        }
      }
      
      if (!foundValidQr) {
        const errorMsg = `No valid QR code found in Evolution API v2 response. Expected 'code' field. Response keys: ${Object.keys(qrResponse || {})}`;
        console.error(errorMsg);
      }
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
      
      // Get QR response from /instance/connect/{instance} endpoint
      // Evolution API v2 returns: { pairingCode: "WZYEH1YY", code: "...", count: 1 }
      const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
      
      if (qrResponse?.pairingCode) {
        console.log(`Pairing code retrieved: ${qrResponse.pairingCode}`);
        return qrResponse.pairingCode;
      }
      
      console.warn("Pairing code not found in Evolution API v2 response");
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

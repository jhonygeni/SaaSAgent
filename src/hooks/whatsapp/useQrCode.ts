
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
      
      if (qrResponse?.code) {
        console.log("Código QR obtido com sucesso (code)");
        return qrResponse.code;
      }
      
      if (qrResponse?.qrcode) {
        console.log("Código QR obtido com sucesso (qrcode)");
        return qrResponse.qrcode;
      }
      
      if (qrResponse?.base64) {
        console.log("Código QR obtido com sucesso (base64)");
        return qrResponse.base64;
      }
      
      console.warn("QR code não encontrado na resposta da API");
      return null;
    } catch (error) {
      console.error("Error fetching QR code:", error);
      throw error;
    }
  }, []);

  return {
    fetchQrCode
  };
}

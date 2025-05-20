
import { useState, useCallback, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { useUser } from '../context/UserContext';

export function useWhatsAppConnection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Start connection process
  const startConnection = useCallback(async () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      // Generate instance name based on user ID or use a default
      const instanceName = user?.id || "default_instance";
      console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
      
      // Step 1: Create/Connect to WhatsApp instance
      const data = await whatsappService.createInstance(instanceName);
      console.log("Evolution API response:", data);
      
      // Step 2: Get QR code if successful
      if (data.success || data.status === "created" || data.status === "pending") {
        // Get the QR code 
        const qrData = await whatsappService.getQrCode(instanceName);
        console.log("QR code response:", qrData);
        
        if (qrData.qrcode) {
          setQrCodeData(qrData.qrcode);
          
          // Step 3: Start polling for connection status
          const interval = setInterval(async () => {
            try {
              const statusData = await whatsappService.getStatus(instanceName);
              console.log("Status response:", statusData);
              
              if (statusData.status === "connected") {
                setConnectionStatus("connected");
                clearInterval(interval);
                setPollingInterval(null);
                
                // Get phone number info
                try {
                  const phoneData = await whatsappService.getPhoneInfo(instanceName);
                  console.log("Phone info response:", phoneData);
                  if (phoneData.phone) {
                    completeConnection(phoneData.phone);
                  } else {
                    completeConnection();
                  }
                } catch (error) {
                  console.error("Error getting phone info:", error);
                  completeConnection();
                }
              }
            } catch (error) {
              console.error("Error polling connection status:", error);
            }
          }, 3000);
          
          setPollingInterval(interval);
        } else {
          throw new Error("No QR code received from API");
        }
      } else {
        throw new Error("Failed to create WhatsApp instance");
      }
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error occurred");
      setConnectionStatus("failed");
      toast({
        title: "Erro de conexão",
        description: "Não foi possível iniciar a conexão com o WhatsApp. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Call Evolution API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    try {
      const instanceName = user?.id || "default_instance";
      await whatsappService.logout(instanceName);
    } catch (error) {
      console.error("Error canceling connection:", error);
    }
    
    setConnectionStatus("failed");
    setQrCodeData(null);
    toast({
      title: "Conexão cancelada",
      description: "A conexão com o WhatsApp foi cancelada.",
      variant: "destructive",
    });
  }, [pollingInterval, user, toast]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    setConnectionStatus("connected");
    setQrCodeData(null);
    toast({
      title: "Conexão realizada com sucesso!",
      description: phoneNumber 
        ? `Número ${phoneNumber} conectado.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, [toast]);

  return {
    connectionStatus,
    startConnection,
    cancelConnection,
    completeConnection,
    isLoading,
    qrCodeData,
    connectionError
  };
}

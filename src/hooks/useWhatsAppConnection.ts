
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

  // Get instance name based on user ID
  const getInstanceName = useCallback(() => {
    return user?.id || "default_instance";
  }, [user]);

  // Show error toast
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: "Erro de conexão",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Show success toast
  const showSuccessToast = useCallback((phoneNumber?: string) => {
    toast({
      title: "Conexão realizada com sucesso!",
      description: phoneNumber 
        ? `Número ${phoneNumber} conectado.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, [toast]);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Handle successful connection
  const handleSuccessfulConnection = useCallback(async (instanceName: string) => {
    setConnectionStatus("connected");
    clearPolling();
    
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
  }, [clearPolling]);

  // Start polling for connection status
  const startStatusPolling = useCallback(async (instanceName: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await whatsappService.getStatus(instanceName);
        console.log("Status response:", statusData);
        
        if (statusData.status === "connected") {
          handleSuccessfulConnection(instanceName);
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [handleSuccessfulConnection]);

  // Get QR code for WhatsApp instance
  const fetchQrCode = useCallback(async (instanceName: string) => {
    try {
      const qrData = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      
      if (qrData.qrcode) {
        setQrCodeData(qrData.qrcode);
        startStatusPolling(instanceName);
      } else {
        throw new Error("No QR code received from API");
      }
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  }, [startStatusPolling]);

  // Initialize WhatsApp instance
  const initializeWhatsAppInstance = useCallback(async () => {
    const instanceName = getInstanceName();
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    
    try {
      const data = await whatsappService.createInstance(instanceName);
      console.log("Evolution API response:", data);
      
      if (data.success || data.status === "created" || data.status === "pending") {
        await fetchQrCode(instanceName);
      } else {
        throw new Error("Failed to create WhatsApp instance");
      }
    } catch (error) {
      console.error("Error creating WhatsApp instance:", error);
      throw error;
    }
  }, [getInstanceName, fetchQrCode]);

  // Start connection process
  const startConnection = useCallback(async () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await initializeWhatsAppInstance();
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error occurred");
      setConnectionStatus("failed");
      showErrorToast("Não foi possível iniciar a conexão com o WhatsApp. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [initializeWhatsAppInstance, showErrorToast]);

  // Call Evolution API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    clearPolling();
    
    try {
      const instanceName = getInstanceName();
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
  }, [clearPolling, getInstanceName, toast]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    setConnectionStatus("connected");
    setQrCodeData(null);
    showSuccessToast(phoneNumber);
  }, [showSuccessToast]);

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

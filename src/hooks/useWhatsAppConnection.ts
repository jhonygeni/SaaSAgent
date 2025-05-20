
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
  const [instanceData, setInstanceData] = useState<any>(null);

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
    if (!user?.id) {
      console.warn("User ID not available, using default instance name");
      return "default_instance";
    }
    return `user_${user.id}`;
  }, [user]);

  // Show error toast
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: "Connection Error",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Show success toast
  const showSuccessToast = useCallback((phoneNumber?: string) => {
    toast({
      title: "Connection Successful!",
      description: phoneNumber 
        ? `Connected to number ${phoneNumber}.` 
        : "WhatsApp connected successfully.",
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
      const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
      console.log("Instance info response:", instanceInfo);
      
      // Save instance data for future use
      setInstanceData(instanceInfo);
      
      // Check for phone number information
      let phoneNumber = null;
      if (instanceInfo && instanceInfo.instance && instanceInfo.instance.user) {
        phoneNumber = instanceInfo.instance.user.id?.split('@')[0]; // Extract phone number
      }
      
      completeConnection(phoneNumber);
    } catch (error) {
      console.error("Error getting instance info:", error);
      // Still mark as connected even if we can't get the phone info
      completeConnection();
    }
  }, [clearPolling]);

  // Start polling for connection status
  const startStatusPolling = useCallback(async (instanceName: string) => {
    // Clear any existing polling interval
    clearPolling();
    
    // Debug: List all instances to verify our instance exists
    try {
      const instances = await whatsappService.listInstances();
      console.log("Current instances:", instances);
    } catch (error) {
      console.error("Error listing instances:", error);
    }
    
    const interval = setInterval(async () => {
      try {
        console.log(`Polling connection state for instance: ${instanceName}`);
        const stateData = await whatsappService.getConnectionState(instanceName);
        console.log("Connection state polling response:", stateData);
        
        // Check connection state based on Evolution API response structure
        const state = stateData?.state || stateData?.status;
        
        if (state === "open" || state === "connected") {
          console.log("Connection detected as CONNECTED!");
          handleSuccessfulConnection(instanceName);
        } else if (state === "connecting" || state === "loading") {
          console.log("Still connecting or loading QR code...");
        } else if (state === "close" || state === "disconnected") {
          console.log("Connection is closed or disconnected");
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [handleSuccessfulConnection, clearPolling]);

  // Get QR code for WhatsApp instance
  const fetchQrCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      const qrData = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      
      // Extract QR code based on the API response structure
      // Different APIs might use different field names
      const qrCode = qrData?.qrcode || qrData?.base64 || qrData?.code || qrData?.qr;
      
      if (qrCode) {
        setQrCodeData(qrCode);
        startStatusPolling(instanceName);
        return qrCode;
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
      // First, try to create a new instance
      const createData = await whatsappService.createInstance(instanceName);
      console.log("Instance creation response:", createData);
      
      // Save instance data
      setInstanceData(createData);
      
      // After creation, connect to the instance
      const connectData = await whatsappService.connectToInstance(instanceName);
      console.log("Instance connection response:", connectData);
      
      // Check if we need to generate a QR code
      return await fetchQrCode(instanceName);
    } catch (error: any) {
      console.error("Error initializing WhatsApp instance:", error);
      
      // If we get a specific error about instance already existing, try to connect directly
      if (error.message && error.message.includes("Conflict")) {
        console.log("Instance already exists, attempting to connect directly");
        
        try {
          // Try to connect to existing instance
          const connectData = await whatsappService.connectToInstance(instanceName);
          console.log("Connection to existing instance:", connectData);
          
          // Get QR code for the existing instance
          return await fetchQrCode(instanceName);
        } catch (connectError) {
          console.error("Error connecting to existing instance:", connectError);
          throw connectError;
        }
      }
      
      throw error;
    }
  }, [getInstanceName, fetchQrCode]);

  // Start connection process
  const startConnection = useCallback(async () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    setQrCodeData(null);
    
    try {
      const qrCode = await initializeWhatsAppInstance();
      if (!qrCode) {
        throw new Error("Failed to generate QR code");
      }
      return qrCode;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unknown error occurred";
        
      console.error("Error connecting to WhatsApp:", error);
      setConnectionError(errorMessage);
      setConnectionStatus("failed");
      showErrorToast("Could not initiate connection with WhatsApp. Please try again later.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [initializeWhatsAppInstance, showErrorToast]);

  // Call API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    clearPolling();
    
    try {
      const instanceName = getInstanceName();
      const success = await whatsappService.logout(instanceName);
      if (success) {
        console.log("Successfully logged out instance:", instanceName);
      } else {
        console.warn("Logout may not have succeeded for instance:", instanceName);
      }
    } catch (error) {
      console.error("Error canceling connection:", error);
    }
    
    setConnectionStatus("failed");
    setQrCodeData(null);
    toast({
      title: "Connection Canceled",
      description: "WhatsApp connection was canceled.",
      variant: "destructive",
    });
  }, [clearPolling, getInstanceName, toast]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    setConnectionStatus("connected");
    setQrCodeData(null);
    showSuccessToast(phoneNumber);
  }, [showSuccessToast]);

  // Get current QR code without starting a new connection
  const getCurrentQrCode = useCallback(() => {
    return qrCodeData;
  }, [qrCodeData]);

  // Get the instance name and data - useful for the UI
  const getConnectionInfo = useCallback(() => {
    return {
      instanceName: getInstanceName(),
      instanceData: instanceData
    };
  }, [getInstanceName, instanceData]);

  return {
    connectionStatus,
    startConnection,
    cancelConnection,
    completeConnection,
    isLoading,
    qrCodeData,
    connectionError,
    getCurrentQrCode,
    getConnectionInfo
  };
}

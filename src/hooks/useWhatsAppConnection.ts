import { useState, useCallback, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { useUser } from '../context/UserContext';
import { USE_MOCK_DATA } from '../constants/api';

export function useWhatsAppConnection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

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

  // Update debug info
  const updateDebugInfo = useCallback((newInfo: any = null) => {
    const debugData = {
      instanceName: getInstanceName(),
      instanceData,
      connectionStatus,
      qrCodeData: qrCodeData ? "[QR DATA AVAILABLE]" : null,
      error: connectionError,
      attemptCount,
      mockMode: USE_MOCK_DATA,
      ...newInfo
    };
    setDebugInfo(JSON.stringify(debugData, null, 2));
    console.log("Debug info updated:", debugData);
  }, [getInstanceName, instanceData, connectionStatus, qrCodeData, connectionError, attemptCount]);

  // Handle successful connection
  const handleSuccessfulConnection = useCallback(async (instanceName: string) => {
    setConnectionStatus("connected");
    clearPolling();
    
    try {
      const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
      console.log("Instance info response:", instanceInfo);
      
      // Save instance data for future use
      setInstanceData(instanceInfo);
      updateDebugInfo({ instanceInfo });
      
      // Extract phone number information
      let phoneNumber = null;
      if (USE_MOCK_DATA) {
        phoneNumber = instanceInfo?.instance?.user?.phone || "+5511987654321";
      } else if (instanceInfo && instanceInfo.instance && instanceInfo.instance.user) {
        phoneNumber = instanceInfo.instance.user.id?.split('@')[0]; // Extract phone number
      }
      
      completeConnection(phoneNumber);
    } catch (error) {
      console.error("Error getting instance info:", error);
      // Still mark as connected even if we can't get the phone info
      completeConnection();
    }
  }, [clearPolling, updateDebugInfo]);

  // Start polling for connection status
  const startStatusPolling = useCallback(async (instanceName: string) => {
    // Clear any existing polling interval
    clearPolling();
    
    // Debug: List all instances to verify our instance exists
    try {
      const instances = await whatsappService.listInstances();
      console.log("Current instances:", instances);
      updateDebugInfo({ instances });
    } catch (error) {
      console.error("Error listing instances:", error);
      updateDebugInfo({ listInstancesError: error instanceof Error ? error.message : String(error) });
    }
    
    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 30; // Stop polling after this many attempts (90 seconds with 3-second interval)
    
    const interval = setInterval(async () => {
      pollAttempts++;
      setAttemptCount(pollAttempts);
      
      try {
        console.log(`Polling connection state for instance: ${instanceName} (attempt ${pollAttempts}/${MAX_POLL_ATTEMPTS})`);
        const stateData = await whatsappService.getConnectionState(instanceName);
        console.log("Connection state polling response:", stateData);
        updateDebugInfo({ pollAttempts, stateData });
        
        // Check connection state based on Evolution API response structure
        const state = stateData?.state || stateData?.status;
        
        if (state === "open" || state === "connected") {
          console.log("Connection detected as CONNECTED!");
          handleSuccessfulConnection(instanceName);
        } else if (state === "connecting" || state === "loading") {
          console.log("Still connecting or loading QR code...");
          
          // If using mock data and this is the 5th attempt, simulate success
          if (USE_MOCK_DATA && pollAttempts >= 5) {
            console.log("Mock mode: Simulating successful connection after 5 attempts");
            handleSuccessfulConnection(instanceName);
          }
        } else if (state === "close" || state === "disconnected") {
          console.log("Connection is closed or disconnected");
        }
        
        // Stop polling after max attempts to avoid infinite polling
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn(`Max polling attempts (${MAX_POLL_ATTEMPTS}) reached. Stopping.`);
          clearPolling();
          
          if (connectionStatus !== "connected") {
            setConnectionError("Connection timed out. Please try again.");
            setConnectionStatus("failed");
          }
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
        updateDebugInfo({ 
          pollError: error instanceof Error ? error.message : String(error) 
        });
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [handleSuccessfulConnection, clearPolling, connectionStatus, updateDebugInfo]);

  // Get QR code for WhatsApp instance
  const fetchQrCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      const qrData = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      updateDebugInfo({ qrData });
      
      // Extract QR code based on the updated API response structure
      // This could be in various fields depending on the API version
      const qrCode = qrData?.qrcode || qrData?.base64 || qrData?.code || qrData?.pairingCode;
      
      if (qrCode) {
        setQrCodeData(qrCode);
        startStatusPolling(instanceName);
        return qrCode;
      } else {
        throw new Error("No QR code received from API");
      }
    } catch (error) {
      console.error("Error getting QR code:", error);
      updateDebugInfo({ 
        qrError: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, [startStatusPolling, updateDebugInfo]);

  // Initialize WhatsApp instance - simplified to use the new direct connect/QR endpoint
  const initializeWhatsAppInstance = useCallback(async () => {
    const instanceName = getInstanceName();
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    updateDebugInfo({ action: "initialize", instanceName });
    
    try {
      // First, try to create a new instance
      const createData = await whatsappService.createInstance(instanceName);
      console.log("Instance creation response:", createData);
      
      // Save instance data
      setInstanceData(createData);
      updateDebugInfo({ createData });
      
      // After creation, directly connect to get the QR code using the updated endpoint
      try {
        return await fetchQrCode(instanceName);
      } catch (qrError) {
        console.error("Error getting QR code after instance creation:", qrError);
        updateDebugInfo({
          qrError: qrError instanceof Error ? qrError.message : String(qrError)
        });
        throw qrError;
      }
    } catch (error: any) {
      console.error("Error initializing WhatsApp instance:", error);
      updateDebugInfo({ 
        initError: error instanceof Error ? error.message : String(error)
      });
      
      // If we get a specific error about instance already existing, try to connect directly
      if (error.message && (error.message.includes("Conflict") || error.message.includes("already in use"))) {
        console.log("Instance already exists, attempting to connect directly");
        
        try {
          // Get QR code for the existing instance using the updated endpoint
          return await fetchQrCode(instanceName);
        } catch (connectError) {
          console.error("Error connecting to existing instance:", connectError);
          updateDebugInfo({
            connectError: connectError instanceof Error ? connectError.message : String(connectError)
          });
          throw connectError;
        }
      }
      
      throw error;
    }
  }, [getInstanceName, fetchQrCode, updateDebugInfo]);

  // Start connection process
  const startConnection = useCallback(async () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    setQrCodeData(null);
    setAttemptCount(0);
    updateDebugInfo({ action: "startConnection" });
    
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
      updateDebugInfo({ 
        connectionError: errorMessage,
        connectionStatus: "failed"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [initializeWhatsAppInstance, showErrorToast, updateDebugInfo]);

  // Call API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    clearPolling();
    updateDebugInfo({ action: "cancelConnection" });
    
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
      updateDebugInfo({
        cancelError: error instanceof Error ? error.message : String(error)
      });
    }
    
    setConnectionStatus("failed");
    setQrCodeData(null);
    toast({
      title: "Connection Canceled",
      description: "WhatsApp connection was canceled.",
      variant: "destructive",
    });
  }, [clearPolling, getInstanceName, toast, updateDebugInfo]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    setConnectionStatus("connected");
    setQrCodeData(null);
    showSuccessToast(phoneNumber);
    updateDebugInfo({
      action: "completeConnection",
      phoneNumber,
      connectionStatus: "connected"
    });
  }, [showSuccessToast, updateDebugInfo]);

  // Get current QR code without starting a new connection
  const getCurrentQrCode = useCallback(() => {
    return qrCodeData;
  }, [qrCodeData]);

  // Get the instance name and data - useful for the UI
  const getConnectionInfo = useCallback(() => {
    return {
      instanceName: getInstanceName(),
      instanceData: instanceData,
      debugInfo: debugInfo
    };
  }, [getInstanceName, instanceData, debugInfo]);

  return {
    connectionStatus,
    startConnection,
    cancelConnection,
    completeConnection,
    isLoading,
    qrCodeData,
    connectionError,
    getCurrentQrCode,
    getConnectionInfo,
    debugInfo,
    attemptCount
  };
}

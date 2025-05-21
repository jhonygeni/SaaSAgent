
import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from './types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { 
  USE_MOCK_DATA,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE, 
  AUTO_CLOSE_AFTER_SUCCESS,
  AUTO_CLOSE_DELAY_MS
} from '../constants/api';

// Import our new modular hooks
import { useInstanceManager } from './whatsapp/useInstanceManager';
import { useQrCode } from './whatsapp/useQrCode';
import { useNameValidator } from './whatsapp/useNameValidator';
import { useWhatsAppStatus } from './whatsapp/useWhatsAppStatus';

export function useWhatsAppConnection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  
  // Use our new modular hooks
  const {
    connectionStatus,
    setConnectionStatus,
    qrCodeData,
    setQrCodeData,
    pairingCode,
    setPairingCode,
    connectionError,
    setConnectionError,
    attemptCount,
    setAttemptCount,
    debugInfo,
    updateDebugInfo,
    showErrorToast,
    showSuccessToast,
    clearPolling,
    startStatusPolling,
    startConnectionTimer,
    stopConnectionTimer,
    timeTaken
  } = useWhatsAppStatus();
  
  const { validateInstanceName } = useNameValidator();
  const { fetchQrCode } = useQrCode();
  const {
    instanceData,
    setInstanceData,
    getInstanceName,
    fetchUserInstances,
    createdInstancesRef
  } = useInstanceManager();
  
  // Track connection attempts to avoid consuming credits on retries
  const connectionAttemptsRef = useRef<Record<string, number>>({});
  const consecutiveConnectedStatesRef = useRef<number>(0);
  const lastConnectionStateRef = useRef<string | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // Initialize WhatsApp instance with the correct sequence
  const initializeWhatsAppInstance = useCallback(async (providedName?: string) => {
    const instanceName = getInstanceName(providedName);
    console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
    updateDebugInfo({ action: "initialize", instanceName });
    
    // Track connection attempts to prevent credit consumption on retries
    if (!connectionAttemptsRef.current[instanceName]) {
      connectionAttemptsRef.current[instanceName] = 0;
    }
    connectionAttemptsRef.current[instanceName]++;
    
    // Only consume credits on the first attempt if enabled
    const shouldConsumeCredits = !PREVENT_CREDIT_CONSUMPTION_ON_FAILURE || 
                               connectionAttemptsRef.current[instanceName] <= 1;
    
    console.log(`Attempt #${connectionAttemptsRef.current[instanceName]} for instance ${instanceName}. Credits will${shouldConsumeCredits ? '' : ' not'} be consumed on failure.`);
    
    try {
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Create the instance first
      const instanceData = await whatsappService.createInstance(instanceName);
      console.log("Instance created successfully:", instanceData);
      
      // Store for later use
      setInstanceData(instanceData);
      createdInstancesRef.current.add(instanceName);
      
      // Get the QR code
      return await fetchQrCode(instanceName);
    } catch (error) {
      // Special handling for duplicate instance name errors
      if (error instanceof Error && error.message.includes("already in use")) {
        console.error("Instance name already in use:", error);
        setConnectionError("Este nome de instância já está em uso. Por favor, escolha outro nome.");
        setConnectionStatus("failed");
        throw error;
      }
      
      // All other errors
      console.error("Failed to initialize WhatsApp instance:", error);
      setConnectionError(`Falha ao inicializar instância WhatsApp: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus("failed");
      throw error;
    }
  }, [getInstanceName, updateDebugInfo, fetchQrCode, setInstanceData, setConnectionError, setConnectionStatus]);

  /**
   * Start WhatsApp connection process
   */
  const startConnection = useCallback(async (instanceName?: string): Promise<string | null> => {
    const instanceId = instanceName || getInstanceName();
    
    // Reset state on new connection
    setConnectionStatus("waiting");
    setIsLoading(true);
    setQrCodeData(null);
    setConnectionError(null);
    setPairingCode(null);
    setCreditsConsumed(false);
    setAttemptCount(0);
    consecutiveConnectedStatesRef.current = 0;
    lastConnectionStateRef.current = null;
    updateDebugInfo({
      action: "startConnection",
      instanceId,
      startTime: new Date().toISOString(),
    });
    
    try {
      // Start tracking connection time
      startConnectionTimer();
      
      // Initialize instance and get QR code
      console.log(`Starting WhatsApp connection process for instance: ${instanceId}`);
      const qrCode = await initializeWhatsAppInstance(instanceId);
      
      if (qrCode) {
        setQrCodeData(qrCode);
        // Start polling for connection status
        startStatusPolling(instanceId);
      }
      
      console.log("Connection process started successfully");
      setIsLoading(false);
      
      return qrCode;
    } catch (error) {
      console.error("Error starting WhatsApp connection:", error);
      setIsLoading(false);
      stopConnectionTimer();
      
      // Set error message based on error type
      const errorMessage = error instanceof Error 
        ? error.message
        : "Unknown error occurred while connecting to WhatsApp";
        
      setConnectionError(errorMessage);
      setConnectionStatus("failed");
      
      // Show error to user
      showErrorToast(errorMessage);
      return null;
    }
  }, [getInstanceName, updateDebugInfo, initializeWhatsAppInstance, setQrCodeData, 
      setIsLoading, setConnectionError, setConnectionStatus, setPairingCode, 
      showErrorToast, startConnectionTimer, stopConnectionTimer, startStatusPolling, setAttemptCount]);

  /**
   * Cancel ongoing connection attempt
   */
  const cancelConnection = useCallback(() => {
    // Clear any polling interval
    clearPolling();
    
    // Reset connection state
    setConnectionStatus("waiting");
    setIsLoading(false);
    setQrCodeData(null);
    setConnectionError(null);
    setPairingCode(null);
    consecutiveConnectedStatesRef.current = 0;
    lastConnectionStateRef.current = null;
    
    // No need to logout/disconnect instance - it will time out automatically
    console.log("Connection process canceled by user");
  }, [clearPolling, setConnectionStatus, setIsLoading, setQrCodeData, setConnectionError, setPairingCode]);

  /**
   * Handle connection success
   */
  const completeConnection = useCallback((phoneNumber?: string | null) => {
    setConnectionStatus("connected");
    clearPolling();
    
    // Show a toast notification
    showSuccessToast(phoneNumber || undefined);
    
    // Auto-close after success if enabled
    if (AUTO_CLOSE_AFTER_SUCCESS) {
      console.log(`Auto-close after success is enabled. Will close in ${AUTO_CLOSE_DELAY_MS}ms.`);
    }
    
    console.log("Connection process completed successfully", phoneNumber ? `for number ${phoneNumber}` : "");
  }, [clearPolling, showSuccessToast, setConnectionStatus]);

  /**
   * Get current QR code
   */
  const getCurrentQrCode = useCallback((): string | null => {
    return qrCodeData;
  }, [qrCodeData]);

  /**
   * Get connection info for debugging
   */
  const getConnectionInfo = useCallback(() => {
    return {
      status: connectionStatus,
      instanceData,
      qrCode: qrCodeData ? "Available" : "Not available",
      error: connectionError,
      attemptCount,
      consecutiveConnectedStates: consecutiveConnectedStatesRef.current,
      timeTaken,
    };
  }, [connectionStatus, instanceData, qrCodeData, connectionError, attemptCount, timeTaken]);

  return {
    connectionStatus,
    isLoading,
    qrCodeData,
    connectionError,
    startConnection,
    cancelConnection,
    completeConnection,
    getCurrentQrCode,
    getConnectionInfo,
    debugInfo,
    pairingCode,
    attemptCount,
    validateInstanceName,
    fetchUserInstances
  };
}

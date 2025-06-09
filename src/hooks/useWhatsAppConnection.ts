import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from './whatsapp/types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  USE_MOCK_DATA,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE, 
  AUTO_CLOSE_AFTER_SUCCESS,
  AUTO_CLOSE_DELAY_MS
} from '../constants/api';

// Import our modular hooks
import { useInstanceManager } from './whatsapp/useInstanceManager';
import { useQrCode } from './whatsapp/useQrCode';
import { useNameValidator } from './whatsapp/useNameValidator';
import { useWhatsAppStatus } from './whatsapp/useWhatsAppStatus';

export function useWhatsAppConnection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  
  // Use our modular hooks
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
    timeTaken,
    forceCheckConnection
  } = useWhatsAppStatus();
  
  const { validateInstanceName } = useNameValidator();
  const { fetchQrCode } = useQrCode();
  const {
    instanceData,
    setInstanceData,
    getInstanceName,
    fetchUserInstances,
    createdInstancesRef,
    clearCurrentInstanceName,
    createAndConfigureInstance,
    updateInstanceStatus // <-- add this
  } = useInstanceManager();
  
  // Track connection attempts to avoid consuming credits on retries
  const connectionAttemptsRef = useRef<Record<string, number>>({});
  const lastConnectionStateRef = useRef<string | null>(null);
  const creationInProgressRef = useRef<boolean>(false);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  /**
   * Initialize WhatsApp instance with the correct sequence following API docs
   * IMPORTANT: This function should only be called once per instance name
   */
  const initializeWhatsAppInstance = useCallback(async (providedName?: string): Promise<string | null> => {
    // Prevent multiple simultaneous creation requests
    if (creationInProgressRef.current) {
      console.log("Instance creation already in progress, skipping duplicate request");
      throw new Error("Instance creation already in progress. Please wait for the current operation to complete.");
    }
    
    creationInProgressRef.current = true;
    
    try {
      const instanceName = getInstanceName(providedName);
      console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
      updateDebugInfo({ action: "initialize", instanceName });
      
      // 1. First check if the API is accessible using the fetchInstances endpoint
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Check if we've already created this instance (to prevent duplicates)
      if (createdInstancesRef.current.has(instanceName)) {
        console.warn(`Instance ${instanceName} was already created. Skipping creation step.`);
        
        // Still need to fetch QR code for an existing instance
        return await fetchQrCode(instanceName);
      }
      
      // 2. Create the instance (with webhook included in the payload)
      console.log(`Creating new instance with name: ${instanceName}`);
      // CORREÇÃO: Buscar userId atual para salvar no Supabase
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      const instanceData = await createAndConfigureInstance(instanceName, currentUserId);
      console.log("Instance created successfully:", instanceData);
      
      // Store for later use
      setInstanceData(instanceData);
      createdInstancesRef.current.add(instanceName);

      // 2.5. Connect the instance before fetching QR code (required by Evolution API)
      console.log(`Connecting instance before fetching QR code: ${instanceName}`);
      await whatsappService.secureApiClient.connectInstance(instanceName);
      console.log("Instance connected, proceeding to fetch QR code");
      
      // 3. Get the QR code using connect endpoint (PRIORITY - DO THIS IMMEDIATELY)
      console.log(`Getting QR code for instance: ${instanceName}`);
      const qrCode = await fetchQrCode(instanceName);
      console.log("QR code obtained:", qrCode ? "Success" : "Failed");
      
      // 4. Configure additional webhook settings in background (NON-BLOCKING)
      // This ensures webhook configuration doesn't delay QR code display
      whatsappService.configureWebhookNonBlocking(instanceName);
      console.log("Background webhook configuration initiated for:", instanceName);
      
      return qrCode;
    } catch (error) {
      // Special handling for duplicate instance name errors
      if (error instanceof Error && error.message.includes("already in use")) {
        console.error("Instance name already in use:", error);
        setConnectionError("Este nome de instância já está em uso. Por favor, escolha outro nome.");
        setConnectionStatus("failed");
        clearCurrentInstanceName(); // Clear the name so we'll generate a new one next time
        throw error;
      }
      
      // All other errors
      console.error("Failed to initialize WhatsApp instance:", error);
      setConnectionError(`Falha ao inicializar instância WhatsApp: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus("failed");
      throw error;
    } finally {
      creationInProgressRef.current = false;
    }
  }, [getInstanceName, updateDebugInfo, fetchQrCode, setInstanceData, setConnectionError, setConnectionStatus, clearCurrentInstanceName, createAndConfigureInstance]);

  /**
   * Start WhatsApp connection process following the correct API sequence
   */
  const startConnection = useCallback(async (instanceName?: string): Promise<string | null> => {
    // Reset state on new connection
    setConnectionStatus("waiting");
    setIsLoading(true);
    setQrCodeData(null);
    setConnectionError(null);
    setPairingCode(null);
    setCreditsConsumed(false);
    setAttemptCount(0);
    lastConnectionStateRef.current = null;
    updateDebugInfo({
      action: "startConnection",
      instanceId: instanceName || getInstanceName(),
      startTime: new Date().toISOString(),
    });
    
    try {
      // Start tracking connection time
      startConnectionTimer();
      
      // Initialize instance and get QR code
      const instanceId = instanceName || getInstanceName();
      console.log(`Starting WhatsApp connection process for instance: ${instanceId}`);
      
      // This will create the instance AND get the QR code in one flow
      const qrCode = await initializeWhatsAppInstance(instanceId);
      
      if (qrCode) {
        console.log("🎯 QR code obtained successfully:", qrCode.substring(0, 50) + "...");
        setQrCodeData(qrCode);
        console.log("✅ setQrCodeData called with QR code");
        // Now we're waiting for QR code scan
        setConnectionStatus("waiting_qr");
        console.log("📱 Connection status set to waiting_qr");
        // Start polling for connection status
        startStatusPolling(instanceId);
        console.log("🔄 Status polling started for instance:", instanceId);
      } else {
        console.error("❌ No QR code returned from initializeWhatsAppInstance");
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
    lastConnectionStateRef.current = null;
    
    // Clean up instance tracking
    clearCurrentInstanceName();
    
    // No need to logout/disconnect instance - it will time out automatically
    console.log("Connection process canceled by user");
  }, [clearPolling, setConnectionStatus, setIsLoading, setQrCodeData, setConnectionError, setPairingCode, clearCurrentInstanceName]);

  /**
   * Handle connection success
   */
  const completeConnection = useCallback(async (phoneNumber?: string | null) => {
    setConnectionStatus("connected");
    clearPolling();

    // Mark credits as consumed only on successful connection
    if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE) {
      setCreditsConsumed(true);
      console.log("Credits consumed on successful connection");
    }

    // Show a toast notification
    showSuccessToast(phoneNumber || undefined);

    // Update instance status in Supabase to 'connected'
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      // Get instance name (from ref or instanceData)
      let instanceName = null;
      if (instanceData && instanceData.instance && instanceData.instance.name) {
        instanceName = instanceData.instance.name;
      } else if (typeof getInstanceName === 'function') {
        instanceName = getInstanceName();
      }
      if (instanceName && userId) {
        await updateInstanceStatus(instanceName, "connected", userId);
        console.log(`Instance status updated to 'connected' in Supabase for ${instanceName}`);
      } else {
        console.warn('Could not update instance status: missing instanceName or userId', { instanceName, userId });
      }
    } catch (err) {
      console.error('Failed to update instance status to connected:', err);
    }

    // Auto-close after success if enabled
    if (AUTO_CLOSE_AFTER_SUCCESS) {
      console.log(`Auto-close after success is enabled. Will close in ${AUTO_CLOSE_DELAY_MS}ms.`);
    }

    console.log("Connection process completed successfully", phoneNumber ? `for number ${phoneNumber}` : "");
  }, [clearPolling, showSuccessToast, setConnectionStatus, setCreditsConsumed, instanceData, getInstanceName, updateInstanceStatus]);

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
    fetchUserInstances,
    clearPolling, // Export clearPolling function
    forceCheckConnection // Export new force check function
  };
}

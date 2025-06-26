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
    updateAgentWhatsAppData // <-- add this for simplified architecture
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
   * CORREÇÃO: Verifica instâncias existentes antes de criar nova
   */
  const initializeWhatsAppInstance = useCallback(async (providedName?: string, agentId?: string): Promise<string | null> => {
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
      
      // CORREÇÃO: Verificar se já existe uma instância para este agente
      if (agentId) {
        console.log(`Checking for existing WhatsApp instance for agent: ${agentId}`);
        
        // Use the agentService to check for existing instances
        const agentService = await import('../services/agentService');
        const existingInstance = await agentService.default.checkExistingWhatsAppInstance(agentId);
        
        if (existingInstance.hasInstance && existingInstance.canReuse) {
          console.log(`Found existing instance for agent ${agentId}: ${existingInstance.instanceName} (${existingInstance.status})`);
          
          // If instance exists and can be reused, use it instead of creating new one
          if (existingInstance.status === 'connected') {
            console.log('Instance is already connected, returning existing connection');
            setConnectionStatus('connected');
            setConnectionError(null);
            return null; // Already connected
          } else {
            console.log('Instance exists but is pending, attempting to get QR code for existing instance');
            // Try to get QR code for existing instance
            try {
              return await fetchQrCode(existingInstance.instanceName!);
            } catch (qrError) {
              console.warn('Failed to get QR code for existing instance, will create new one:', qrError);
              // Fall through to create new instance
            }
          }
        }
      }
      
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
  const startConnection = useCallback(async (instanceName?: string, agentId?: string): Promise<string | null> => {
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
      agentId: agentId || 'unknown',
      startTime: new Date().toISOString(),
    });
    
    try {
      // Start tracking connection time
      startConnectionTimer();
      
      // Initialize instance and get QR code
      const instanceId = instanceName || getInstanceName();
      console.log(`Starting WhatsApp connection process for instance: ${instanceId}, agentId: ${agentId}`);
      
      // This will create the instance AND get the QR code in one flow
      // CORREÇÃO: Passar agentId para verificação de instâncias existentes
      const qrCode = await initializeWhatsAppInstance(instanceId, agentId);
      
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

    // SIMPLIFIED: Update agent data directly instead of instance status
    // This eliminates the need for whatsapp_instances table
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      let instanceName = null;
      if (instanceData && instanceData.instance && instanceData.instance.name) {
        instanceName = instanceData.instance.name;
      } else if (typeof getInstanceName === 'function') {
        instanceName = getInstanceName();
      }
      
      if (instanceName && userId) {
        // Find the agent with this instance name and update it
        const { data: agents, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .eq('instance_name', instanceName);
        
        if (!error && agents && agents.length > 0) {
          const agent = agents[0];
          
          const success = await updateAgentWhatsAppData(agent.id, {
            phoneNumber: phoneNumber || undefined,
            connected: true,
            instanceName: instanceName
          });
          
          if (success) {
            console.log(`Agent WhatsApp data updated successfully for ${instanceName}`);
          } else {
            console.warn('Failed to update agent WhatsApp data');
          }
        } else {
          console.warn('No agent found with instance name:', instanceName);
        }
      } else {
        console.warn('Could not update agent: missing instanceName or userId', { instanceName, userId });
      }
    } catch (err) {
      console.error('Failed to update agent WhatsApp data:', err);
    }

    // Auto-close after success if enabled
    if (AUTO_CLOSE_AFTER_SUCCESS) {
      console.log(`Auto-close after success is enabled. Will close in ${AUTO_CLOSE_DELAY_MS}ms.`);
    }

    console.log("Connection process completed successfully", phoneNumber ? `for number ${phoneNumber}` : "");
  }, [clearPolling, showSuccessToast, setConnectionStatus, setCreditsConsumed, instanceData, getInstanceName, updateAgentWhatsAppData]);

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

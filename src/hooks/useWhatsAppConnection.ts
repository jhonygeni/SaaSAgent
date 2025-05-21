
import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { useUser } from '../context/UserContext';
import { 
  USE_MOCK_DATA, 
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE, 
  MAX_CONNECTION_RETRIES,
  ENDPOINTS
} from '../constants/api';

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
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  
  // Track connection attempts to avoid consuming credits on retries
  const connectionAttemptsRef = useRef<Record<string, number>>({});
  const createdInstancesRef = useRef<Set<string>>(new Set());
  const consecutiveConnectedStatesRef = useRef<number>(0);
  const lastConnectionStateRef = useRef<string | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Get instance name based on user ID and provided name
  const getInstanceName = useCallback((providedName?: string) => {
    if (providedName) {
      // Format the name to be valid for instance
      return providedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    if (!user?.id) {
      console.warn("User ID not available, using default instance name");
      return "default_instance";
    }

    // Add random suffix to avoid conflicts
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `user_${user.id.substring(0, 8)}_${randomSuffix}`;
  }, [user]);

  // Validate if an instance name is available and valid
  const validateInstanceName = useCallback(async (instanceName: string): Promise<{valid: boolean, message?: string}> => {
    try {
      if (!instanceName || instanceName.trim() === '') {
        return { valid: false, message: "Nome não pode estar vazio" };
      }
      
      // Format the name to match server-side validation
      const formattedName = instanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      if (formattedName.length < 3) {
        return { valid: false, message: "Nome deve ter pelo menos 3 caracteres" };
      }
      
      if (formattedName.length > 20) {
        return { valid: false, message: "Nome não pode ter mais de 20 caracteres" };
      }
      
      // First check API health to avoid unnecessary API calls
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        return { valid: false, message: "API não está acessível. Verifique sua conexão." };
      }
      
      // Check if name is already in use by listing all instances
      try {
        const instances = await whatsappService.listInstances();
        
        // Better handling of response format - check if instances exists and is an array
        if (instances && instances.instances && Array.isArray(instances.instances)) {
          const existingInstance = instances.instances.find((i: any) => 
            (i.name === formattedName || i.instanceName === formattedName)
          );
            
          if (existingInstance) {
            return { valid: false, message: "Este nome já está em uso" };
          }
        } else {
          console.log("Unexpected instances response format:", instances);
          // Continue anyway if we can't determine instances
        }
      } catch (error) {
        console.error("Error checking instance name availability:", error);
        // Continue anyway, we'll deal with conflicts later if they happen
      }
      
      return { valid: true };
    } catch (error) {
      console.error("Error validating instance name:", error);
      return { valid: false, message: "Erro na validação do nome" };
    }
  }, []);

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
      pairingCode,
      creditsConsumed,
      consecutiveConnectedStates: consecutiveConnectedStatesRef.current,
      lastConnectionState: lastConnectionStateRef.current,
      apiHealth: "checking...",
      ...newInfo
    };
    
    // Check API health in background
    whatsappService.checkApiHealth().then(isHealthy => {
      const updatedDebugData = {
        ...debugData,
        apiHealth: isHealthy ? "healthy" : "unhealthy"
      };
      setDebugInfo(JSON.stringify(updatedDebugData, null, 2));
    }).catch(error => {
      const updatedDebugData = {
        ...debugData,
        apiHealth: "error checking",
        apiHealthError: error instanceof Error ? error.message : String(error)
      };
      setDebugInfo(JSON.stringify(updatedDebugData, null, 2));
    });
    
    console.log("Debug info updated:", debugData);
  }, [getInstanceName, instanceData, connectionStatus, qrCodeData, connectionError, attemptCount, pairingCode, creditsConsumed]);

  // Handle successful connection
  const handleSuccessfulConnection = useCallback(async (instanceName: string) => {
    setConnectionStatus("connected");
    clearPolling();
    
    // Reset consecutive states counter
    consecutiveConnectedStatesRef.current = 0;
    
    // Mark credits as consumed only on successful connection
    if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE && !creditsConsumed) {
      setCreditsConsumed(true);
      console.log("Credits consumed on successful connection");
    }
    
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
  }, [clearPolling, updateDebugInfo, creditsConsumed]);

  // Start polling for connection status - IMPROVED with proper status check
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
        
        // Enhanced status check to handle different response formats
        // The API returns different field names in different contexts, so we check multiple fields
        const state = stateData?.state || stateData?.status;
        lastConnectionStateRef.current = state;
        
        // Check for successful connection states with more certainty
        if (state === "open" || state === "connected" || state === "confirmed") {
          console.log("Connection detected as CONNECTED!");
          
          // Incrementar o contador de estados "conectado" consecutivos
          consecutiveConnectedStatesRef.current += 1;
          
          // Se tivermos pelo menos 2 respostas consecutivas de "conectado", então consideramos a conexão estabelecida
          if (consecutiveConnectedStatesRef.current >= 2) {
            console.log(`Connection confirmed after ${consecutiveConnectedStatesRef.current} consecutive successful responses`);
            handleSuccessfulConnection(instanceName);
            return;
          }
          
          console.log(`Waiting for confirmation... (${consecutiveConnectedStatesRef.current}/2 consecutive connected states)`);
        } else {
          // Reset consecutive counter if not in a connected state
          consecutiveConnectedStatesRef.current = 0;
          
          if (state === "connecting" || state === "loading") {
            console.log("Still connecting or loading QR code...");
            
            // If using mock data and this is the 5th attempt, simulate success
            if (USE_MOCK_DATA && pollAttempts >= 5) {
              console.log("Mock mode: Simulating successful connection after 5 attempts");
              handleSuccessfulConnection(instanceName);
              return;
            }
          } else if (state === "close" || state === "disconnected") {
            console.log("Connection is closed or disconnected");
            
            // If it's disconnected for more than a few attempts, refresh the QR code
            if (pollAttempts > 5 && pollAttempts % 5 === 0) {
              try {
                console.log("Refreshing QR code due to disconnected state");
                const freshQrData = await whatsappService.getQrCode(instanceName);
                
                if (freshQrData?.qrcode) {
                  console.log("New QR code received");
                  setQrCodeData(freshQrData.qrcode);
                  
                  if (freshQrData.pairingCode) {
                    setPairingCode(freshQrData.pairingCode);
                  }
                }
              } catch (error) {
                console.error("Error refreshing QR code:", error);
              }
            }
          }
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
        
        // On authentication errors, stop polling immediately
        if (error instanceof Error && 
            (error.message.includes("Authentication failed") || 
             error.message.includes("403") || 
             error.message.includes("401"))) {
          clearPolling();
          setConnectionError("Authentication failed. Please check your API key and try again.");
          setConnectionStatus("failed");
        }
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [handleSuccessfulConnection, clearPolling, connectionStatus, updateDebugInfo]);

  // Fetch QR code for WhatsApp instance with correct endpoint
  const fetchQrCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Reset consecutive connected states counter
      consecutiveConnectedStatesRef.current = 0;
      lastConnectionStateRef.current = null;
      
      // Use the updated QR code endpoint
      console.log(`Fetching QR code for instance: ${instanceName}`);
      const qrData = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      
      // Extract QR code and pairing code from the response
      const qrCode = qrData?.qrcode || qrData?.base64 || qrData?.code;
      const newPairingCode = qrData?.pairingCode;
      
      if (qrCode) {
        console.log("QR code successfully received");
        setQrCodeData(qrCode);
        if (newPairingCode) {
          setPairingCode(newPairingCode);
        }
        startStatusPolling(instanceName);
        return qrCode;
      } else {
        console.error("No QR code received in API response:", qrData);
        throw new Error("No QR code received from API");
      }
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  }, [startStatusPolling]);

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
      
      // Create the instance
      const instanceData = await whatsappService.createInstance(instanceName, user?.id);
      console.log("Instance created successfully:", instanceData);
      
      // Store for later use
      setInstanceData(instanceData);
      createdInstancesRef.current.add(instanceName);
      
      // Get the QR code using GET method (IMPORTANT!)
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
  }, [getInstanceName, user, updateDebugInfo, fetchQrCode]);

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
      // Initialize instance and get QR code
      console.log(`Starting WhatsApp connection process for instance: ${instanceId}`);
      console.log(`Using API endpoint: ${ENDPOINTS.instanceConnectQR.replace("{instanceName}", instanceId)}`);
      const qrCode = await initializeWhatsAppInstance(instanceId);
      
      console.log("Connection process started successfully");
      setIsLoading(false);
      
      return qrCode;
    } catch (error) {
      console.error("Error starting WhatsApp connection:", error);
      setIsLoading(false);
      
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
  }, [getInstanceName, updateDebugInfo, initializeWhatsAppInstance, showErrorToast]);

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
  }, [clearPolling]);

  /**
   * Handle connection success
   */
  const completeConnection = useCallback((phoneNumber?: string | null) => {
    setConnectionStatus("connected");
    clearPolling();
    
    // Show a toast notification
    showSuccessToast(phoneNumber || undefined);
    
    console.log("Connection process completed successfully", phoneNumber ? `for number ${phoneNumber}` : "");
  }, [clearPolling, showSuccessToast]);

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
    };
  }, [connectionStatus, instanceData, qrCodeData, connectionError, attemptCount]);

  // Fetch user's existing instances
  const fetchUserInstances = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log("No user ID available, cannot fetch instances");
        return [];
      }
      
      // Check API health first
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        console.error("API is not healthy, cannot fetch instances");
        return [];
      }
      
      // Use fetchInstances method to get all instances
      const data = await whatsappService.fetchInstances();
      console.log("Fetched user instances:", data);
      return data?.instances || [];
    } catch (error) {
      console.error("Error fetching user instances:", error);
      return [];
    }
  }, [user]);

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

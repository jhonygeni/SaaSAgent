import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useToast } from './use-toast';
import { useUser } from '../context/UserContext';
import { USE_MOCK_DATA, PREVENT_CREDIT_CONSUMPTION_ON_FAILURE, MAX_CONNECTION_RETRIES } from '../constants/api';

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
        
        // Fix: Better handling of response format - check if instances exists and is an array
        if (instances && instances.instances && Array.isArray(instances.instances)) {
          const existingInstance = instances.instances.find((i: any) => 
            i.name === formattedName || i.instanceName === formattedName
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
        
        if (state === "open" || state === "connected" || state === "confirmed") {
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

  // Fetch QR code for WhatsApp instance - FIXED to use GET method
  const fetchQrCode = useCallback(async (instanceName: string): Promise<string | null> => {
    try {
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Use GET method to connect and get QR code
      const qrData = await whatsappService.getQrCode(instanceName);
      console.log("QR code response:", qrData);
      
      // Extract QR code and pairing code from the response
      const qrCode = qrData?.qrcode || qrData?.base64 || qrData?.code;
      const newPairingCode = qrData?.pairingCode;
      
      if (qrCode) {
        setQrCodeData(qrCode);
        if (newPairingCode) {
          setPairingCode(newPairingCode);
        }
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
      
      // Check if we've already created this instance to avoid duplicate creation
      const isNewInstance = !createdInstancesRef.current.has(instanceName);
      
      // 1. First, create a new instance using POST to /instance/create (only if it's a new instance)
      let createData;
      if (isNewInstance) {
        console.log("Step 1: Creating instance...");
        try {
          createData = await whatsappService.createInstance(instanceName);
          console.log("Instance creation response:", createData);
          
          // Add to our tracking set
          createdInstancesRef.current.add(instanceName);
          
          // Save instance data
          setInstanceData(createData);
          updateDebugInfo({ createData });
        } catch (createError: any) {
          console.error("Error creating instance:", createError);
          
          // If instance already exists, we can proceed to get QR code
          if (createError.message && createError.message.includes("already in use")) {
            console.log("Instance already exists, will proceed to get QR code");
          } else {
            throw createError;
          }
        }
      } else {
        console.log("Instance already created in this session, skipping creation step");
      }
      
      // 2. After creation, immediately connect to get the QR code
      console.log("Step 2: Getting QR code...");
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
      
      // Special handling for authentication errors
      if (error.message && (error.message.includes("Authentication failed") || 
                           error.message.includes("403") || 
                           error.message.includes("401"))) {
        throw new Error("Authentication failed. Please check your API key and try again.");
      }
      
      // If we get a specific error about instance already existing, try to connect directly
      if (error.message && (error.message.includes("Conflict") || error.message.includes("already in use"))) {
        console.log("Instance already exists, attempting to connect directly");
        
        try {
          // Get QR code for the existing instance 
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

  // Start connection process with a specific instance name
  const startConnection = useCallback(async (providedName?: string) => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    setQrCodeData(null);
    setPairingCode(null);
    setAttemptCount(0);
    setCreditsConsumed(false); // Reset credit consumption tracking
    updateDebugInfo({ action: "startConnection", providedName });
    
    // Limit retries to prevent excessive API calls
    let attempts = 0;
    const maxAttempts = MAX_CONNECTION_RETRIES;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Connection attempt ${attempts}/${maxAttempts}`);
      
      try {
        const qrCode = await initializeWhatsAppInstance(providedName);
        if (!qrCode) {
          throw new Error("Failed to generate QR code");
        }
        return qrCode;
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Unknown error occurred";
          
        console.error(`Error connecting to WhatsApp (attempt ${attempts}/${maxAttempts}):`, error);
        
        // If it's the last attempt, show the error and mark as failed
        if (attempts >= maxAttempts) {
          setConnectionError(errorMessage);
          setConnectionStatus("failed");
          showErrorToast("Could not initiate connection with WhatsApp. Please try again later.");
          updateDebugInfo({ 
            connectionError: errorMessage,
            connectionStatus: "failed",
            attempts
          });
          return null;
        } else {
          // For authentication errors, fail immediately (no retry)
          if (errorMessage.includes("Authentication failed") || 
              errorMessage.includes("403") || 
              errorMessage.includes("401")) {
            setConnectionError(errorMessage);
            setConnectionStatus("failed");
            showErrorToast("Authentication failed. Please check your API key and try again.");
            updateDebugInfo({ 
              connectionError: errorMessage,
              connectionStatus: "failed",
              attempts
            });
            return null;
          }
          
          // Otherwise wait and retry
          console.log(`Retrying in ${attempts * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }
    
    return null;
  }, [initializeWhatsAppInstance, showErrorToast, updateDebugInfo]);

  // Call API to cancel the connection process - NEVER use during agent creation
  const cancelConnection = useCallback(async () => {
    clearPolling();
    updateDebugInfo({ action: "cancelConnection" });
    
    // We're not calling logout during agent creation
    // The server will automatically clean up abandoned instances
    
    setConnectionStatus("failed");
    setQrCodeData(null);
    setPairingCode(null);
    toast({
      title: "Connection Canceled",
      description: "WhatsApp connection was canceled.",
      variant: "destructive",
    });
  }, [clearPolling, toast, updateDebugInfo]);

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

  // Get current pairing code if available
  const getCurrentPairingCode = useCallback(() => {
    return pairingCode;
  }, [pairingCode]);

  // Get the instance name and data - useful for the UI
  const getConnectionInfo = useCallback(() => {
    return {
      instanceName: getInstanceName(),
      instanceData: instanceData,
      debugInfo: debugInfo,
      pairingCode: pairingCode
    };
  }, [getInstanceName, instanceData, debugInfo, pairingCode]);

  // New method to fetch all instances related to the current user
  const fetchUserInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Use the new fetchInstances method
      const data = await whatsappService.fetchInstances();
      return data?.instances || [];
    } catch (error) {
      console.error("Error fetching user instances:", error);
      showErrorToast("Could not retrieve WhatsApp instances.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  return {
    connectionStatus,
    startConnection,
    cancelConnection,
    completeConnection,
    isLoading,
    qrCodeData,
    pairingCode,
    connectionError,
    getCurrentQrCode,
    getConnectionInfo,
    debugInfo,
    attemptCount,
    validateInstanceName,
    fetchUserInstances
  };
}

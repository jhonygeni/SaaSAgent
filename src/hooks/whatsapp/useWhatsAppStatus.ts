import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '@/types';
import whatsappService from '@/services/whatsappService';
import { useToast } from '../use-toast';
import { USE_MOCK_DATA, MAX_POLLING_ATTEMPTS, STATUS_POLLING_INTERVAL_MS, CONSECUTIVE_SUCCESS_THRESHOLD } from '@/constants/api';
import { ConnectionStateResponse, QrCodeResponse, InstanceInfo } from '@/services/whatsapp/types';

/**
 * Hook for managing WhatsApp connection status
 */
export function useWhatsAppStatus() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  
  const connectionStartTime = useRef<number | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const consecutiveSuccessCount = useRef(0);
  const currentInstanceNameRef = useRef<string | null>(null);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, []);
  
  // Show error toast
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: "Erro de Conexão",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Show success toast
  const showSuccessToast = useCallback((phoneNumber?: string) => {
    toast({
      title: "Conexão bem-sucedida!",
      description: phoneNumber 
        ? `Conectado ao número ${phoneNumber}.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, [toast]);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      currentInstanceNameRef.current = null;
      console.log("Polling de status interrompido.");
    }
  }, []);

  // Start connection time tracking
  const startConnectionTimer = useCallback(() => {
    connectionStartTime.current = Date.now();
  }, []);

  // Stop connection time tracking and calculate duration
  const stopConnectionTimer = useCallback(() => {
    if (connectionStartTime.current) {
      const duration = (Date.now() - connectionStartTime.current) / 1000; // Convert to seconds
      setTimeTaken(duration);
      return duration;
    }
    return null;
  }, []);

  // Update debug info
  const updateDebugInfo = useCallback((newInfo: any = null) => {
    const debugData = {
      connectionStatus,
      qrCodeData: qrCodeData ? "[QR DATA AVAILABLE]" : null,
      error: connectionError,
      attemptCount,
      mockMode: USE_MOCK_DATA,
      pairingCode,
      creditsConsumed,
      consecutiveSuccessCount: consecutiveSuccessCount.current,
      connectionTime: connectionStartTime.current 
        ? `${((Date.now() - connectionStartTime.current) / 1000).toFixed(1)}s` 
        : null,
      apiHealth: "checking...",
      currentInstance: currentInstanceNameRef.current,
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
  }, [connectionStatus, qrCodeData, connectionError, attemptCount, pairingCode, creditsConsumed]);

  /**
   * Start polling for connection status following the API docs
   * This should only poll /instance/connectionState/{instance} endpoint
   */
  const startStatusPolling = useCallback((instanceName: string) => {
    // Store the instance name we're polling for - with consistent formatting
    const formattedName = instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
    currentInstanceNameRef.current = formattedName;
    
    // Clear any existing polling
    clearPolling();
    
    console.log(`Starting status polling for instance: ${formattedName}`);
    consecutiveSuccessCount.current = 0;
    let pollCount = 0;
    
    if (!connectionStartTime.current) {
      startConnectionTimer();
    }
    
    pollingInterval.current = setInterval(async () => {
      if (currentInstanceNameRef.current !== formattedName) {
        // The instance we're polling for has changed, stop this polling
        clearPolling();
        return;
      }
      
      pollCount++;
      setAttemptCount(pollCount);
      
      try {
        console.log(`Polling connection state (attempt ${pollCount}/${MAX_POLLING_ATTEMPTS})`);
        
        // IMPORTANT: This is the ONLY API call we should be making in this polling loop
        // according to the API documentation
        const stateData: ConnectionStateResponse = await whatsappService.getConnectionState(formattedName);
        console.log(`Connection state for ${formattedName}:`, stateData);
        
        updateDebugInfo({ 
          pollCount, 
          instanceName: formattedName,
          connectionState: stateData?.state || stateData?.instance?.state || stateData?.status,
          consecutiveSuccessCount: consecutiveSuccessCount.current
        });
        
        // Check for successful connection states - handle both formats from API:
        // 1. { state: "open" } or { status: "open" }
        // 2. { instance: { state: "open" } }
        const connectionState = stateData?.state || 
                              (stateData?.instance?.state) || 
                              stateData?.status;
                              
        console.log(`Current connection state: ${connectionState}`);
        
        const isConnected = 
          connectionState === "open" || 
          connectionState === "connected" || 
          connectionState === "confirmed";
        
        if (isConnected) {
          console.log(`Conexão bem-sucedida detectada (${consecutiveSuccessCount.current + 1}/${CONSECUTIVE_SUCCESS_THRESHOLD})`);
          consecutiveSuccessCount.current++;
          
          // Only mark as connected after consecutive successful checks
          if (consecutiveSuccessCount.current >= CONSECUTIVE_SUCCESS_THRESHOLD) {
            clearPolling();
            setConnectionStatus("connected");
            const duration = stopConnectionTimer();
            console.log(`Conexão confirmada após ${duration?.toFixed(1)}s`);
            
            // Get additional instance info
            try {
              const instanceInfo: InstanceInfo = await whatsappService.getInstanceInfo(formattedName);
              console.log("Info da instância:", instanceInfo);
              
              // Extract phone number (if available)
              const phoneNumber = instanceInfo?.instance?.user?.id?.split('@')[0];
              
              // Display success message
              showSuccessToast(phoneNumber);
              
              return phoneNumber;
            } catch (error) {
              console.error("Falha ao obter informações da instância:", error);
              // Still mark as connected even if we can't get additional info
              showSuccessToast();
              return null;
            }
          }
        } else {
          // Reset consecutive success count if not connected
          consecutiveSuccessCount.current = 0;
          
          // Only refresh QR code if the connection is actually broken/disconnected
          if ((connectionState === "disconnected" || connectionState === "close") && 
              pollCount > 5 && pollCount % 5 === 0) {
            try {
              console.log("Atualizando QR code para instância existente...");
              const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
              
              // Check all possible QR code fields
              if (qrResponse?.qrcode || qrResponse?.base64 || qrResponse?.code) {
                setQrCodeData(qrResponse.qrcode || qrResponse.base64 || qrResponse.code);
                
                if (qrResponse.pairingCode) {
                  setPairingCode(qrResponse.pairingCode);
                }
              }
            } catch (qrError) {
              console.error("Falha ao atualizar QR code:", qrError);
            }
          }
        }
        
        // Stop polling after max attempts
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          clearPolling();
          if (connectionStatus !== "connected") {
            // If we had some successful checks but not enough consecutive ones
            if (consecutiveSuccessCount.current > 0) {
              console.log("Tivemos algumas verificações bem-sucedidas, tratando como conectado");
              setConnectionStatus("connected");
              showSuccessToast();
              stopConnectionTimer();
            } else {
              setConnectionError("Tempo de conexão esgotado. Por favor, tente novamente.");
              setConnectionStatus("failed");
            }
          }
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        updateDebugInfo({ 
          pollError: errorMessage,
          consecutiveSuccessCount: consecutiveSuccessCount.current 
        });
        
        // Stop polling on auth errors
        if (errorMessage.includes("401") || 
            errorMessage.includes("403") || 
            errorMessage.includes("Authentication")) {
          clearPolling();
          setConnectionError(`Erro de autenticação: ${errorMessage}`);
          setConnectionStatus("failed");
        }
      }
    }, STATUS_POLLING_INTERVAL_MS);
    
    // Return the polling interval identifier
    return pollingInterval.current;
  }, [clearPolling, connectionStatus, showSuccessToast, startConnectionTimer, stopConnectionTimer, updateDebugInfo]);

  return {
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
    creditsConsumed,
    setCreditsConsumed,
    showErrorToast,
    showSuccessToast,
    clearPolling,
    startStatusPolling,
    startConnectionTimer,
    stopConnectionTimer,
    timeTaken
  };
}

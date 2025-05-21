
import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '@/types';
import { whatsappService } from '@/services/whatsappService';
import { useToast } from '../use-toast';
import { USE_MOCK_DATA, MAX_POLLING_ATTEMPTS, STATUS_POLLING_INTERVAL_MS, CONSECUTIVE_SUCCESS_THRESHOLD } from '@/constants/api';

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
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
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

  // Start polling for connection status
  const startStatusPolling = useCallback((instanceName: string) => {
    clearPolling();
    
    console.log(`Starting status polling for instance: ${instanceName}`);
    consecutiveSuccessCount.current = 0;
    let pollCount = 0;
    
    if (!connectionStartTime.current) {
      startConnectionTimer();
    }
    
    pollingInterval.current = setInterval(async () => {
      pollCount++;
      setAttemptCount(pollCount);
      
      try {
        console.log(`Polling connection state (attempt ${pollCount}/${MAX_POLLING_ATTEMPTS})`);
        const stateData = await whatsappService.getConnectionState(instanceName);
        console.log("Connection state:", stateData);
        
        updateDebugInfo({ 
          pollCount, 
          connectionState: stateData?.state || stateData?.status,
          consecutiveSuccessCount: consecutiveSuccessCount.current
        });
        
        // Check for successful connection states
        if (stateData?.state === "open" || 
            stateData?.state === "connected" || 
            stateData?.state === "confirmed" ||
            stateData?.status === "connected" ||
            stateData?.status === "open") {
          
          console.log(`Connection appears successful (${consecutiveSuccessCount.current + 1}/${CONSECUTIVE_SUCCESS_THRESHOLD})`);
          consecutiveSuccessCount.current++;
          
          // Only mark as connected after consecutive successful checks
          if (consecutiveSuccessCount.current >= CONSECUTIVE_SUCCESS_THRESHOLD) {
            clearPolling();
            setConnectionStatus("connected");
            const duration = stopConnectionTimer();
            console.log(`Connection confirmed after ${duration?.toFixed(1)}s`);
            
            // Get additional instance info
            try {
              const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
              const phoneNumber = instanceInfo?.instance?.user?.id?.split('@')[0];
              showSuccessToast(phoneNumber);
            } catch (error) {
              console.error("Failed to get instance info:", error);
              showSuccessToast();
            }
          }
        } else {
          // Reset consecutive success count if not connected
          consecutiveSuccessCount.current = 0;
          
          // If QR code has expired, try to refresh it
          if ((stateData?.state === "disconnected" || stateData?.state === "close") && 
              pollCount > 5 && pollCount % 5 === 0) {
            try {
              console.log("Refreshing QR code...");
              const qrResponse = await whatsappService.getQrCode(instanceName);
              if (qrResponse?.qrcode || qrResponse?.base64) {
                setQrCodeData(qrResponse.qrcode || qrResponse.base64);
                if (qrResponse.pairingCode) {
                  setPairingCode(qrResponse.pairingCode);
                }
              }
            } catch (qrError) {
              console.error("Failed to refresh QR code:", qrError);
            }
          }
        }
        
        // Stop polling after max attempts
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          clearPolling();
          if (connectionStatus !== "connected") {
            setConnectionError("Tempo de conexão esgotado. Por favor, tente novamente.");
            setConnectionStatus("failed");
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

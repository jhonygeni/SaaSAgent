
import { useState, useCallback } from 'react';
import { ConnectionStatus } from '@/types';
import { whatsappService } from '@/services/whatsappService';
import { useToast } from '../use-toast';
import { USE_MOCK_DATA } from '@/constants/api';

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
  };
}

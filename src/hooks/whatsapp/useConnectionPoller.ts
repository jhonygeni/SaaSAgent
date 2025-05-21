
import { useState, useCallback, useEffect, useRef } from 'react';
import { whatsappService } from '@/services/whatsappService';
import { UseWhatsAppStatus } from './types';
import { USE_MOCK_DATA, PREVENT_CREDIT_CONSUMPTION_ON_FAILURE } from '@/constants/api';

/**
 * Hook for polling WhatsApp connection status
 */
export function useConnectionPoller(
  status: Pick<UseWhatsAppStatus, 'setQrCodeData' | 'setPairingCode' | 'setConnectionStatus' | 'setConnectionError' | 'updateDebugInfo' | 'setAttemptCount' | 'setCreditsConsumed'>
) {
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Handle successful connection
  const handleSuccessfulConnection = useCallback(async (instanceName: string) => {
    status.setConnectionStatus("connected");
    clearPolling();
    
    // Mark credits as consumed only on successful connection
    if (PREVENT_CREDIT_CONSUMPTION_ON_FAILURE) {
      status.setCreditsConsumed(true);
      console.log("Credits consumed on successful connection");
    }
    
    try {
      const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
      console.log("Instance info response:", instanceInfo);
      
      status.updateDebugInfo({ instanceInfo });
      
      // Extract phone number information
      let phoneNumber = null;
      if (USE_MOCK_DATA) {
        phoneNumber = instanceInfo?.instance?.user?.phone || "+5511987654321";
      } else if (instanceInfo && instanceInfo.instance && instanceInfo.instance.user) {
        phoneNumber = instanceInfo.instance.user.id?.split('@')[0]; // Extract phone number
      }
      
      return phoneNumber;
    } catch (error) {
      console.error("Error getting instance info:", error);
      return null;
    }
  }, [clearPolling, status]);

  // Start polling for connection status
  const startStatusPolling = useCallback(async (instanceName: string) => {
    // Clear any existing polling interval
    clearPolling();
    
    // Debug: List all instances to verify our instance exists
    try {
      const instances = await whatsappService.listInstances();
      console.log("Current instances:", instances);
      status.updateDebugInfo({ instances });
    } catch (error) {
      console.error("Error listing instances:", error);
      status.updateDebugInfo({ listInstancesError: error instanceof Error ? error.message : String(error) });
    }
    
    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 30; // Stop polling after this many attempts (90 seconds with 3-second interval)
    
    const interval = setInterval(async () => {
      pollAttempts++;
      status.setAttemptCount(pollAttempts);
      
      try {
        console.log(`Polling connection state for instance: ${instanceName} (attempt ${pollAttempts}/${MAX_POLL_ATTEMPTS})`);
        const stateData = await whatsappService.getConnectionState(instanceName);
        console.log("Connection state polling response:", stateData);
        status.updateDebugInfo({ pollAttempts, stateData });
        
        // Enhanced status check to handle different response formats
        // The API returns different field names in different contexts, so we check multiple fields
        const state = stateData?.state || stateData?.status;
        
        if (state === "open" || state === "connected" || state === "confirmed") {
          console.log("Connection detected as CONNECTED!");
          const phoneNumber = await handleSuccessfulConnection(instanceName);
          return phoneNumber;
        } else if (state === "connecting" || state === "loading") {
          console.log("Still connecting or loading QR code...");
          
          // If using mock data and this is the 5th attempt, simulate success
          if (USE_MOCK_DATA && pollAttempts >= 5) {
            console.log("Mock mode: Simulating successful connection after 5 attempts");
            const phoneNumber = await handleSuccessfulConnection(instanceName);
            return phoneNumber;
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
                status.setQrCodeData(freshQrData.qrcode);
                
                if (freshQrData.pairingCode) {
                  status.setPairingCode(freshQrData.pairingCode);
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
          
          status.setConnectionError("Connection timed out. Please try again.");
          status.setConnectionStatus("failed");
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
        status.updateDebugInfo({ 
          pollError: error instanceof Error ? error.message : String(error) 
        });
        
        // On authentication errors, stop polling immediately
        if (error instanceof Error && 
            (error.message.includes("Authentication failed") || 
             error.message.includes("403") || 
             error.message.includes("401"))) {
          clearPolling();
          status.setConnectionError("Authentication failed. Please check your API key and try again.");
          status.setConnectionStatus("failed");
        }
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [handleSuccessfulConnection, clearPolling, status]);

  return {
    startStatusPolling,
    clearPolling
  };
}

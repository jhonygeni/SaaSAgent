import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";
import { 
  USE_MOCK_DATA, 
  EVOLUTION_API_URL, 
  AUTO_CLOSE_AFTER_SUCCESS, 
  AUTO_CLOSE_DELAY_MS 
} from "@/constants/api";
import whatsappService from "@/services/whatsappService";
import { InstancesListResponse } from "@/services/whatsapp/types";

// Import our refactored components
import { LoadingState } from "./whatsapp/LoadingState";
import { QrCodeState } from "./whatsapp/QrCodeState";
import { SuccessState } from "./whatsapp/SuccessState";
import { ErrorState } from "./ErrorState";
import { DebugPanel } from "./whatsapp/DebugPanel";
import { CustomNameForm } from "./whatsapp/CustomNameForm";
import { ApiHealthBadge } from "./whatsapp/ApiHealthBadge";
import { ApiHealthWarning } from "./whatsapp/ApiHealthWarning";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  agentId?: string | null;
}

export function WhatsAppConnectionDialog({
  open,
  onOpenChange,
  onComplete,
  agentId
}: WhatsAppConnectionDialogProps) {
  const { 
    connectionStatus, 
    startConnection, 
    cancelConnection, 
    completeConnection, 
    isLoading, 
    qrCodeData,
    pairingCode,
    connectionError,
    getConnectionInfo,
    debugInfo,
    attemptCount,
    validateInstanceName
  } = useConnection();
  
  const { toast } = useToast();
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(process.env.NODE_ENV !== "production");
  const [apiHealthStatus, setApiHealthStatus] = useState<"unknown" | "healthy" | "unhealthy">("unknown");
  const [retryCount, setRetryCount] = useState(0);
  const [lastInstanceName, setLastInstanceName] = useState<string | null>(null);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(AUTO_CLOSE_AFTER_SUCCESS);
  const [instances, setInstances] = useState<any[]>([]);
  const [dialogCloseTriggered, setDialogCloseTriggered] = useState(false);
  
  // Check API health when dialog opens
  useEffect(() => {
    if (open) {
      checkApiHealth();
      fetchInstances();
      setDialogCloseTriggered(false); // Reset the dialog close trigger
    }
  }, [open]);
  
  // Check API health by using the fetchInstances endpoint
  const checkApiHealth = async () => {
    try {
      console.log("Checking API health using fetchInstances endpoint...");
      setApiHealthStatus("unknown");
      const isHealthy = await whatsappService.checkApiHealth();
      console.log("API health check result:", isHealthy);
      setApiHealthStatus(isHealthy ? "healthy" : "unhealthy");
    } catch (error) {
      console.error("API health check failed:", error);
      setApiHealthStatus("unhealthy");
    }
  };
  
  // Fetch existing instances
  const fetchInstances = async () => {
    try {
      console.log("Fetching instances...");
      const response: InstancesListResponse = await whatsappService.fetchInstances();
      console.log("Instances fetched:", response);
      if (response && response.instances && Array.isArray(response.instances)) {
        setInstances(response.instances);
      }
    } catch (error) {
      console.error("Failed to fetch instances:", error);
    }
  };
  
  // Normalize instance name for consistent API calls
  const sanitizeInstanceName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
  };
  
  // Start connection process when dialog opens and API is healthy
  useEffect(() => {
    const initiateConnection = async () => {
      // Guard conditions to prevent starting a new connection when one is already in progress
      if (
        !open || 
        hasInitiatedConnection || 
        connectionStatus !== "waiting" || 
        qrCodeData || 
        isLoading
      ) {
        return;
      }
      
      // Don't auto-start if API is unhealthy
      if (apiHealthStatus === "unhealthy") {
        console.log("API is unhealthy, skipping automatic connection start");
        return;
      }
      
      console.log("Starting WhatsApp connection process automatically");
      setHasInitiatedConnection(true);
      
      try {
        // Create a more unique instance name to avoid conflicts
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 6);
        
        // If we have an agentId, use it for the instance name
        const instanceBase = agentId ? `a_${agentId.substring(0, 6)}` : 'agent';
        const instanceName = `${instanceBase}_${timestamp}_${randomStr}`;
        
        // Normalize the instance name before using it
        const sanitizedName = sanitizeInstanceName(instanceName);
        console.log(`Using sanitized instance name: ${sanitizedName} (from ${instanceName})`);
        setLastInstanceName(sanitizedName);
        
        // Start the connection with the sanitized instance name - this follows the correct API flow
        await startConnection(sanitizedName);
      } catch (error) {
        console.error("Failed to start connection:", error);
      }
    };
    
    // Delay slightly to ensure API health check completes first
    const timer = setTimeout(initiateConnection, 800);
    return () => clearTimeout(timer);
  }, [open, hasInitiatedConnection, connectionStatus, qrCodeData, isLoading, startConnection, agentId, apiHealthStatus]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitiatedConnection(false);
      setRetryCount(0);
      setLastInstanceName(null);
      
      // Cancel connection if dialog is closed and connection is not successful
      if (connectionStatus !== "connected") {
        cancelConnection();
      }
    }
  }, [open, cancelConnection, connectionStatus]);

  // CRITICAL FIX: Handle connection success and auto-close dialog
  useEffect(() => {
    if (connectionStatus === "connected" && !dialogCloseTriggered) {
      console.log("Connection successful, completing connection and showing toast notification");
      
      // Call completeConnection to register the success
      completeConnection();
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
      // Show success toast
      toast({
        title: "WhatsApp Conectado",
        description: "Seu WhatsApp foi conectado com sucesso! O pop-up será fechado automaticamente.",
      });
      
      setDialogCloseTriggered(true);
      
      // Auto-close the dialog after successful connection with a delay
      if (autoCloseEnabled) {
        console.log(`Auto-closing dialog in ${AUTO_CLOSE_DELAY_MS}ms after successful connection`);
        const timer = setTimeout(() => {
          console.log("Auto-closing dialog now");
          onOpenChange(false);
        }, AUTO_CLOSE_DELAY_MS);
        
        return () => clearTimeout(timer);
      }
    }
  }, [connectionStatus, completeConnection, onComplete, autoCloseEnabled, onOpenChange, dialogCloseTriggered, toast]);

  // Handle dialog close
  const handleDialogClose = useCallback((isOpen: boolean) => {
    if (!isOpen && connectionStatus !== "connected") {
      console.log("Dialog closed, canceling connection");
      cancelConnection();
    }
    onOpenChange(isOpen);
  }, [cancelConnection, connectionStatus, onOpenChange]);

  // Handle custom instance name submit
  const handleCustomNameSubmit = async (customInstanceName: string) => {
    setHasInitiatedConnection(true);
    
    // Normalize the custom name before using it
    const sanitizedName = sanitizeInstanceName(customInstanceName);
    setLastInstanceName(sanitizedName);
    
    await startConnection(sanitizedName);
  };

  // Handle retry button click - create new unique instance name
  const handleRetry = async () => {
    setHasInitiatedConnection(true);
    setRetryCount(prevCount => prevCount + 1);
    
    try {
      // Check API health first
      await checkApiHealth();
      
      // Create a new unique instance name for the retry to avoid conflict
      // NEVER reuse previous instance names
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 6);
      const retryNum = retryCount + 1;
      
      // If we have an agentId, use it for the instance name
      const instanceBase = agentId ? `a_${agentId.substring(0, 6)}` : 'retry';
      const instanceName = `${instanceBase}_${timestamp}_${randomStr}_r${retryNum}`;
      
      // Normalize the instance name
      const sanitizedName = sanitizeInstanceName(instanceName);
      console.log(`Retry #${retryNum}: Using new sanitized instance name: ${sanitizedName}`);
      setLastInstanceName(sanitizedName);
      
      // Start the connection process with the new sanitized instance name
      await startConnection(sanitizedName);
    } catch (error) {
      console.error("Failed to retry connection:", error);
      // Let the error handling in startConnection show the error
    }
  };

  // Toggle debug information
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  // Toggle auto-close feature
  const toggleAutoClose = () => {
    setAutoCloseEnabled(!autoCloseEnabled);
  };

  // Get connection info
  const connectionInfo = getConnectionInfo();
  const instanceInfo = connectionInfo?.instanceData;
  const phoneNumber = instanceInfo?.instance?.user?.id?.split('@')[0];
  const timeTaken = connectionInfo?.timeTaken;

  // Force close dialog button for users if auto-close fails
  const handleForceClose = () => {
    console.log("User manually closing dialog");
    onOpenChange(false);
  };

  // Add an update to the WhatsAppConnectionDialog component to show connection status
  // and auto-close on successful connection
  // Importantly - make sure we're regularly updating the UI with the latest status
  // This code would go in the component itself

  // Add better status display and ensure auto-close works correctly
  useEffect(() => {
    // Auto-close dialog after successful connection
    if (connectionStatus === "connected" && AUTO_CLOSE_AFTER_SUCCESS) {
      console.log("Connection successful, auto-closing dialog...");
      const timer = setTimeout(() => {
        if (onOpenChange) onOpenChange(false);
      }, AUTO_CLOSE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, onOpenChange]);

  // Add better status display within the component's render method
  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Conectando...";
      case "connected":
        return "Conexão bem-sucedida!";
      case "disconnected":
        return "Desconectado";
      case "failed":
        return "Falha na conexão";
      default:
        return "Aguardando conexão...";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center">
            <DialogTitle>Conectar ao WhatsApp</DialogTitle>
            <ApiHealthBadge status={apiHealthStatus} />
          </div>
          <DialogDescription>
            Escaneie o QR code com seu WhatsApp para conectar.
            {USE_MOCK_DATA && (
              <div className="mt-1 text-xs p-1 bg-yellow-50 text-yellow-700 rounded">
                WARNING: Running in mock mode - real API calls are disabled
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {apiHealthStatus === "unhealthy" && (
          <ApiHealthWarning onRetryClick={checkApiHealth} />
        )}

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {connectionStatus === "failed" && connectionError?.includes("already in use") && (
            <CustomNameForm 
              onSubmit={handleCustomNameSubmit}
              validateName={validateInstanceName}
              isLoading={isLoading}
            />
          )}

          {isLoading && (
            <LoadingState status={connectionStatus} attemptCount={attemptCount} />
          )}

          {!isLoading && connectionStatus === "waiting" && qrCodeData && (
            <QrCodeState 
              qrCodeData={qrCodeData} 
              pairingCode={pairingCode} 
              attemptCount={attemptCount} 
            />
          )}

          {!isLoading && connectionStatus === "connected" && (
            <SuccessState 
              phoneNumber={phoneNumber} 
              instanceName={lastInstanceName || undefined}
              timeTaken={timeTaken}
            />
          )}

          {!isLoading && connectionStatus === "failed" && !connectionError?.includes("already in use") && (
            <ErrorState 
              errorMessage={connectionError} 
              isAuthError={!!connectionError?.includes("Authentication failed")} 
            />
          )}

          {showDebugInfo && (
            <DebugPanel 
              debugInfo={debugInfo}
              connectionInfo={getConnectionInfo()}
              showDebugInfo={showDebugInfo}
              toggleDebugInfo={toggleDebugInfo}
              apiHealthStatus={apiHealthStatus}
              lastInstanceName={lastInstanceName}
              instances={instances}
            />
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          <div className="flex flex-col space-y-2 w-full sm:w-auto mb-3 sm:mb-0">
            {connectionStatus !== "connected" && (
              <Button 
                variant="outline" 
                onClick={() => handleDialogClose(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            )}
            
            {process.env.NODE_ENV !== "production" && (
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="auto-close" 
                  checked={autoCloseEnabled} 
                  onChange={toggleAutoClose}
                  className="w-4 h-4"
                />
                <label htmlFor="auto-close" className="text-xs text-muted-foreground">
                  Fechar automaticamente
                </label>
              </div>
            )}
          </div>
          
          {connectionStatus === "waiting" && qrCodeData && (
            <Button 
              onClick={handleRetry} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? "Carregando..." : "Gerar novo código"}
            </Button>
          )}
          
          {connectionStatus === "failed" && !connectionError?.includes("already in use") && (
            <Button 
              onClick={handleRetry}
              className="w-full sm:w-auto"
              disabled={apiHealthStatus === "unhealthy"}
            >
              Tentar novamente
            </Button>
          )}
          
          {connectionStatus === "connected" && (
            <Button 
              onClick={handleForceClose}
              className="w-full"
            >
              Continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

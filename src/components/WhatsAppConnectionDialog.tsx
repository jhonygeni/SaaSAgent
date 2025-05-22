
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button-extensions";
import { useConnection } from "@/context/ConnectionContext";
import { useAgent } from "@/context/AgentContext";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { 
  USE_MOCK_DATA, 
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE, 
  AUTO_CLOSE_AFTER_SUCCESS, 
  AUTO_CLOSE_DELAY_MS,
  MAX_POLLING_ATTEMPTS
} from "@/constants/api";
import whatsappService from "@/services/whatsappService";
import { InstancesListResponse } from "@/services/whatsapp/types";
import { ConnectionStatus } from "@/hooks/whatsapp/types";

// Import our refactored components
import { LoadingState } from "./whatsapp/LoadingState";
import { QrCodeState } from "./whatsapp/QrCodeState";
import { SuccessState } from "./whatsapp/SuccessState";
import { ErrorState } from "./whatsapp/ErrorState";
import { DebugPanel } from "./whatsapp/DebugPanel";
import { CustomNameForm } from "./whatsapp/CustomNameForm";
import { ApiHealthWarning } from "./whatsapp/ApiHealthWarning";
import { ApiHealthBadge } from "./whatsapp/ApiHealthBadge";

// Props for the WhatsAppConnectionDialog
interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (phoneNumber?: string) => void;
  agentId?: string | null;
  instanceName?: string; // Add instanceName prop
}

export function WhatsAppConnectionDialog({
  open,
  onOpenChange,
  onComplete,
  agentId,
  instanceName: initialInstanceName
}: WhatsAppConnectionDialogProps) {
  // Get contexts and hooks
  const { 
    connectionStatus, 
    startConnection, 
    cancelConnection, 
    completeConnection,
    qrCodeData, 
    isLoading, 
    connectionError,
    pairingCode,
    validateInstanceName,
    fetchUserInstances,
    debugInfo,
    attemptCount,
    clearPolling
  } = useConnection();
  
  const { updateAgentById } = useAgent();
  const { toast } = useToast();
  const { user } = useUser();
  
  // Local state
  const [showDebug, setShowDebug] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customInstanceName, setCustomInstanceName] = useState<string | null>(null);
  const [showCustomNameForm, setShowCustomNameForm] = useState(false);
  const [userInstances, setUserInstances] = useState<any[]>([]);
  const [apiHealth, setApiHealth] = useState<"healthy" | "unhealthy" | "unknown">("unknown");
  const [modalState, setModalState] = useState<"loading" | "qr_code" | "error" | "success" | "custom_name">("loading");

  // Cleanup polling when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // Also cleanup polling when dialog closes
  useEffect(() => {
    if (!open) {
      clearPolling();
    }
  }, [open, clearPolling]);

  // Load existing instances and check API health when the dialog opens
  useEffect(() => {
    const checkApiAndLoadInstances = async () => {
      // Check API health
      try {
        const isHealthy = await whatsappService.checkApiHealth();
        setApiHealth(isHealthy ? "healthy" : "unhealthy");
        
        if (!isHealthy && open) {
          toast({
            title: "⚠️ API Indisponível",
            description: "A API do WhatsApp parece estar offline. A conexão pode não funcionar corretamente.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("API health check failed:", error);
        setApiHealth("unhealthy");
      }
      
      // Load user instances
      try {
        const instances = await fetchUserInstances();
        console.log("Existing user instances:", instances);
        setUserInstances(instances || []);
      } catch (error) {
        console.error("Failed to fetch user instances:", error);
      }
    };
    
    if (open) {
      checkApiAndLoadInstances();
    }
  }, [open, fetchUserInstances, toast]);
  
  // Update modal state based on connection status
  useEffect(() => {
    if (connectionStatus === "waiting" || connectionStatus === "connecting") {
      setModalState("loading");
    } else if (connectionStatus === "waiting_qr" || (connectionStatus === "connecting" && qrCodeData)) {
      setModalState("qr_code");
    } else if (connectionStatus === "connected") {
      setModalState("success");
    } else if (connectionStatus === "failed") {
      setModalState("error");
    }
  }, [connectionStatus, qrCodeData]);
  
  // Handle the connection process when the dialog opens
  useEffect(() => {
    if (open && connectionStatus === "waiting" && !isLoading && !isSubmitting && !showCustomNameForm) {
      console.log("Dialog opened, auto-starting connection with instance name:", initialInstanceName);
      
      const initConnection = async () => {
        try {
          setIsSubmitting(true);
          setModalState("loading");
          // If we have an initial instance name, use it; otherwise, generate one
          const instanceNameToUse = initialInstanceName || customInstanceName || null;
          await startConnection(instanceNameToUse);
          console.log("Connection initiated");
        } catch (error) {
          console.error("Error initiating connection:", error);
          if (error instanceof Error && error.message.includes("already in use")) {
            setShowCustomNameForm(true);
            setModalState("custom_name");
          } else {
            setModalState("error");
          }
        } finally {
          setIsSubmitting(false);
        }
      };
      
      initConnection();
    }
  }, [open, connectionStatus, isLoading, startConnection, initialInstanceName, customInstanceName, isSubmitting, showCustomNameForm]);

  // Update agent status when connection status changes to connected
  useEffect(() => {
    const handleConnectionStateChange = async () => {
      if (connectionStatus === "connected" && agentId) {
        try {
          // Get the phone number from instance info
          const instanceNameToUse = initialInstanceName || customInstanceName || undefined;
          if (instanceNameToUse) {
            const instanceInfo = await whatsappService.getInstanceInfo(instanceNameToUse);
            
            if (instanceInfo?.instance?.user?.phone) {
              setPhoneNumber(instanceInfo.instance.user.phone);
              
              // Update agent with phone number
              await updateAgentById(agentId, {
                connected: true,
                status: "ativo",
                phoneNumber: instanceInfo.instance.user.phone,
                instanceName: instanceNameToUse
              });
              
              // Call onComplete if provided
              if (onComplete) {
                onComplete(instanceInfo.instance.user.phone);
              }
            }
          }
        } catch (error) {
          console.error("Error updating agent with phone number:", error);
        }
      }
    };
    
    handleConnectionStateChange();
  }, [connectionStatus, agentId, updateAgentById, onComplete, initialInstanceName, customInstanceName]);
  
  // Auto-close dialog on success if enabled
  useEffect(() => {
    if (connectionStatus === "connected" && AUTO_CLOSE_AFTER_SUCCESS) {
      const timer = setTimeout(() => {
        if (onOpenChange) onOpenChange(false);
      }, AUTO_CLOSE_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, onOpenChange]);

  // Handle form submission for custom instance name
  const handleCustomNameSubmit = async (name: string) => {
    try {
      setIsSubmitting(true);
      setCustomInstanceName(name);
      setModalState("loading");
      await startConnection(name);
      setShowCustomNameForm(false);
      console.log("Connection initiated with custom name");
    } catch (error) {
      console.error("Error starting connection with custom name:", error);
      
      if (error instanceof Error && error.message.includes("already in use")) {
        toast({
          title: "Nome já em uso",
          description: "Este nome de instância já está sendo usado. Por favor, escolha outro nome.",
          variant: "destructive",
        });
        setShowCustomNameForm(true);
        setModalState("custom_name");
      } else {
        setModalState("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle connection cancellation
  const handleCancel = () => {
    console.log("Cancelling connection and closing dialog");
    cancelConnection();
    clearPolling();
    onOpenChange(false);
  };

  // Handle dialog close
  const handleClose = () => {
    console.log("User manually closing dialog");
    clearPolling();
    onOpenChange(false);
  };

  // Handle API health check retry
  const handleApiHealthRetry = async () => {
    try {
      const isHealthy = await whatsappService.checkApiHealth();
      setApiHealth(isHealthy ? "healthy" : "unhealthy");
      
      toast({
        title: isHealthy ? "API Disponível" : "API Indisponível",
        description: isHealthy 
          ? "A API do WhatsApp está online e respondendo corretamente."
          : "A API do WhatsApp ainda parece estar offline.",
        variant: isHealthy ? "default" : "destructive",
      });
    } catch (error) {
      console.error("API health check retry failed:", error);
      setApiHealth("unhealthy");
      
      toast({
        title: "Falha na verificação",
        description: "Não foi possível verificar o status da API do WhatsApp.",
        variant: "destructive",
      });
    }
  };

  // Add better status display within the component's render method
  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Conectando...";
      case "waiting_qr":
        return "Aguardando escaneamento do QR code...";
      case "connected":
        return "Conexão estabelecida com sucesso!";
      case "failed":
        return "Falha na conexão";
      case "disconnected":
        return "Desconectado";
      case "waiting":
      default:
        return "Aguardando...";
    }
  };

  // Handle retry for error state
  const handleRetry = async () => {
    try {
      setModalState("loading");
      clearPolling(); // Ensure no leftover polling
      await handleCustomNameSubmit(customInstanceName || (initialInstanceName || ""));
    } catch (error) {
      console.error("Error during retry:", error);
      setModalState("error");
    }
  };

  // Render the dialog content based on the current state
  const renderDialogContent = () => {
    // Show custom name form if needed
    if (showCustomNameForm || modalState === "custom_name") {
      return (
        <CustomNameForm 
          onSubmit={handleCustomNameSubmit} 
          isLoading={isSubmitting} 
          existingInstances={userInstances}
        />
      );
    }
    
    // Loading state
    if ((isLoading || isSubmitting || modalState === "loading") && 
        modalState !== "qr_code" && 
        modalState !== "error" && 
        modalState !== "success") {
      return (
        <LoadingState 
          status={connectionStatus} 
          attemptCount={attemptCount}
          maxAttempts={MAX_POLLING_ATTEMPTS}
        />
      );
    }
    
    // QR Code state
    if ((qrCodeData && modalState === "qr_code") || 
        (qrCodeData && connectionStatus === "waiting_qr")) {
      return (
        <QrCodeState 
          qrCodeData={qrCodeData}
          pairingCode={pairingCode}
          attemptCount={attemptCount} 
        />
      );
    }
    
    // Error state
    if (connectionError || modalState === "error" || connectionStatus === "failed") {
      const isTimeout = connectionError?.includes("Timeout") || 
                        connectionError?.includes("tempo esgotado") || 
                        attemptCount >= MAX_POLLING_ATTEMPTS;
      
      return (
        <ErrorState 
          errorMessage={connectionError || "Falha na conexão"} 
          onRetry={handleRetry}
          isTimeout={isTimeout}
        />
      );
    }
    
    // Success state
    if (modalState === "success" || connectionStatus === "connected") {
      return <SuccessState phoneNumber={phoneNumber} />;
    }
    
    // Default waiting state
    return (
      <LoadingState 
        message="Iniciando processo de conexão..." 
        status="waiting" 
        attemptCount={0} 
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        clearPolling(); // Ensure polling is cleared when dialog is closed
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Conectar ao WhatsApp</DialogTitle>
            <ApiHealthBadge status={apiHealth} />
          </div>
          <DialogDescription>
            Conecte seu agente ao WhatsApp para começar a receber mensagens.
          </DialogDescription>
        </DialogHeader>
        
        {/* API Health Warning */}
        {apiHealth === "unhealthy" && <ApiHealthWarning onRetryClick={handleApiHealthRetry} />}
        
        {/* Current Status */}
        <div className="text-center font-medium mb-4">
          <div className="text-sm mb-1 text-muted-foreground">Status:</div>
          <div className="text-base">
            {getStatusText()}
          </div>
        </div>
        
        {/* Main Dialog Content */}
        <div className="flex flex-col items-center justify-center py-4">
          {renderDialogContent()}
        </div>
        
        {/* Debug Panel (collapsible) */}
        <div className="mt-4 border-t pt-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-muted-foreground hover:text-primary flex items-center"
          >
            {showDebug ? "Ocultar detalhes técnicos" : "Mostrar detalhes técnicos"}
          </button>
          
          {showDebug && (
            <DebugPanel 
              debugInfo={debugInfo || ""} 
              showDebugInfo={true} 
              connectionInfo={{
                connectionStatus,
                isLoading,
                hasQrCode: !!qrCodeData,
                modalState
              }} 
              apiHealthStatus={apiHealth} 
              lastInstanceName={initialInstanceName || customInstanceName || ""}
              toggleDebugInfo={() => setShowDebug(!showDebug)}
            />
          )}
        </div>
        
        {/* Dialog Footer */}
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          {connectionStatus === "connected" && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

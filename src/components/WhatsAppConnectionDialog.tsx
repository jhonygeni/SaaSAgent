
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
  AUTO_CLOSE_DELAY_MS 
} from "@/constants/api";
import whatsappService from "@/services/whatsappService";
import { InstancesListResponse } from "@/services/whatsapp/types";
import { ConnectionStatus } from "@/types";

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
    attemptCount
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
  
  // Handle the connection process when the dialog opens
  useEffect(() => {
    if (open && connectionStatus === "waiting" && !isLoading && !isSubmitting) {
      console.log("Dialog opened, auto-starting connection with instance name:", initialInstanceName);
      
      const initConnection = async () => {
        try {
          setIsSubmitting(true);
          // If we have an initial instance name, use it; otherwise, generate one
          const instanceNameToUse = initialInstanceName || customInstanceName || null;
          await startConnection(instanceNameToUse);
          console.log("Connection initiated");
        } catch (error) {
          console.error("Error initiating connection:", error);
          if (error instanceof Error && error.message.includes("already in use")) {
            setShowCustomNameForm(true);
          }
        } finally {
          setIsSubmitting(false);
        }
      };
      
      initConnection();
    }
  }, [open, connectionStatus, isLoading, startConnection, initialInstanceName, customInstanceName, isSubmitting]);

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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle connection cancellation
  const handleCancel = () => {
    console.log("Cancelling connection and closing dialog");
    cancelConnection();
    onOpenChange(false);
  };

  // Handle dialog close
  const handleClose = () => {
    console.log("User manually closing dialog");
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
      await handleCustomNameSubmit(customInstanceName || (initialInstanceName || ""));
    } catch (error) {
      console.error("Error during retry:", error);
    }
  };

  // Render the dialog content based on the current state
  const renderDialogContent = () => {
    // Show custom name form if needed
    if (showCustomNameForm) {
      return (
        <CustomNameForm 
          onSubmit={handleCustomNameSubmit} 
          isLoading={isSubmitting} 
          existingInstances={userInstances}
        />
      );
    }
    
    // Loading state
    if (isLoading || isSubmitting) {
      return (
        <LoadingState 
          status={connectionStatus} 
          attemptCount={attemptCount} 
        />
      );
    }
    
    // QR Code state
    if (qrCodeData && connectionStatus !== "connected") {
      return (
        <QrCodeState 
          qrCodeData={qrCodeData}
          pairingCode={pairingCode}
          attemptCount={attemptCount} 
        />
      );
    }
    
    // Error state
    if (connectionError || connectionStatus === "failed") {
      return (
        <ErrorState 
          errorMessage={connectionError || "Falha na conexão"} 
          onRetry={handleRetry}
        />
      );
    }
    
    // Success state
    if (connectionStatus === "connected") {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              connectionInfo={{connectionStatus, isLoading, hasQrCode: !!qrCodeData}} 
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

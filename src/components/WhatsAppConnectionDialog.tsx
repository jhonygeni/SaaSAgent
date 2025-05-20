
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Smartphone, CheckCircle, AlertCircle, QrCode, Copy } from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";
import { toast } from "@/hooks/use-toast";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function WhatsAppConnectionDialog({
  open,
  onOpenChange,
  onComplete,
}: WhatsAppConnectionDialogProps) {
  const { 
    connectionStatus, 
    startConnection, 
    cancelConnection, 
    isLoading, 
    qrCodeData,
    connectionError,
    getConnectionInfo
  } = useConnection();
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false);

  // Start connection process when dialog opens
  useEffect(() => {
    const initiateConnection = async () => {
      if (open && !hasInitiatedConnection && connectionStatus === "waiting" && !qrCodeData && !isLoading) {
        console.log("Starting WhatsApp connection process automatically");
        setHasInitiatedConnection(true);
        await startConnection();
      }
    };
    
    initiateConnection();
  }, [open, hasInitiatedConnection, connectionStatus, qrCodeData, isLoading, startConnection]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitiatedConnection(false);
    }
  }, [open]);

  // Handle dialog close
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && connectionStatus !== "connected") {
      console.log("Dialog closed, canceling connection");
      cancelConnection();
    }
    onOpenChange(isOpen);
  };

  // Handle completion
  useEffect(() => {
    if (connectionStatus === "connected" && onComplete) {
      console.log("Connection complete, calling onComplete callback");
      onComplete();
    }
  }, [connectionStatus, onComplete]);

  // Handle retry button click
  const handleRetry = async () => {
    setHasInitiatedConnection(true);
    await startConnection();
  };

  // Copy instance info to clipboard
  const copyInstanceInfo = () => {
    const { instanceName, token } = getConnectionInfo();
    const infoText = `Instance Name: ${instanceName}\nAccess Token: ${token || "Not available"}`;
    
    navigator.clipboard.writeText(infoText)
      .then(() => {
        toast({
          title: "Copiado!",
          description: "Informações da instância copiadas para a área de transferência.",
          variant: "default",
        });
      })
      .catch((err) => {
        console.error("Failed to copy instance info:", err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar as informações para a área de transferência.",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Conecte seu WhatsApp para que o agente possa enviar e receber mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                Iniciando conexão com o WhatsApp...
              </p>
            </div>
          )}

          {!isLoading && connectionStatus === "waiting" && qrCodeData && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                {/* Render the QR code as an image using the base64 data */}
                <img 
                  src={`data:image/png;base64,${qrCodeData}`}
                  alt="WhatsApp QR Code"
                  className="w-[200px] h-[200px]"
                />
              </div>
              <div className="flex flex-col items-center space-y-2 max-w-xs text-center">
                <Smartphone className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium">Escaneie o código QR</p>
                <p className="text-xs text-muted-foreground">
                  Abra o WhatsApp no seu celular, acesse Configurações &gt; Aparelhos Conectados,
                  e escaneie o código QR acima.
                </p>
              </div>
              
              {/* Connection details for debugging */}
              <div className="w-full border rounded-md p-3 bg-muted/50 mt-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Detalhes da conexão</p>
                  <Button variant="ghost" size="sm" onClick={copyInstanceInfo}>
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="text-xs">Copiar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instance Name: {getConnectionInfo().instanceName}
                </p>
              </div>
            </div>
          )}

          {!isLoading && connectionStatus === "connected" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">WhatsApp conectado com sucesso!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu agente já pode enviar e receber mensagens.
                </p>
              </div>
              
              {/* Connection details */}
              <div className="w-full border rounded-md p-3 bg-green-50 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Detalhes da conexão</p>
                  <Button variant="ghost" size="sm" onClick={copyInstanceInfo}>
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="text-xs">Copiar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instance Name: {getConnectionInfo().instanceName}
                </p>
              </div>
            </div>
          )}

          {!isLoading && connectionStatus === "failed" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Falha na conexão</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {connectionError || "Não foi possível conectar ao WhatsApp. Tente novamente."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          {connectionStatus !== "connected" && (
            <Button 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
              className="w-full sm:w-auto mb-3 sm:mb-0"
            >
              Cancelar
            </Button>
          )}
          
          {connectionStatus === "waiting" && qrCodeData && (
            <Button 
              onClick={handleRetry} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {isLoading ? "Aguardando..." : "Gerar novo código"}
            </Button>
          )}
          
          {connectionStatus === "failed" && (
            <Button 
              onClick={handleRetry}
              className="w-full sm:w-auto"
            >
              Tentar novamente
            </Button>
          )}
          
          {connectionStatus === "connected" && (
            <Button 
              onClick={() => handleDialogClose(false)}
              className="w-full"
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

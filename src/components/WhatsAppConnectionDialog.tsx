
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";

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
    connectionError
  } = useConnection();

  // Start connection process when dialog opens
  useEffect(() => {
    if (open && connectionStatus === "waiting" && !qrCodeData && !isLoading) {
      console.log("Starting WhatsApp connection process automatically");
      startConnection();
    }
  }, [open, connectionStatus, qrCodeData, isLoading, startConnection]);

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
              onClick={() => startConnection()} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Aguardando..." : "Gerar novo código"}
            </Button>
          )}
          
          {connectionStatus === "failed" && (
            <Button 
              onClick={() => startConnection()}
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

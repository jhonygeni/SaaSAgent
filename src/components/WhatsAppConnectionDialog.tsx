
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button-extensions";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";
import { useToast } from "@/hooks/use-toast";
import QRCodeReact from "qrcode.react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppConnectionDialog({
  open,
  onOpenChange,
}: WhatsAppConnectionDialogProps) {
  const { connectionStatus, startConnection, cancelConnection, completeConnection, isLoading } = useConnection();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [qrCode, setQrCode] = useState("");

  // Generate a mock QR code for demonstration
  useEffect(() => {
    if (open && connectionStatus === "waiting") {
      // In a real implementation, this would be fetched from the Evolution API
      setQrCode("https://evolution-api.com/connect/12345");
    }
  }, [open, connectionStatus]);

  // Start connection process when the dialog opens
  useEffect(() => {
    if (open) {
      startConnection();
    }
  }, [open, startConnection]);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    cancelConnection();
    setShowCancelConfirm(false);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    startConnection();
  };

  const handleComplete = () => {
    // Simulate connection success
    completeConnection("+55 11 99999-9999");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          // Prevent closing when clicking outside during loading
          if (isLoading) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              {connectionStatus === "waiting" && "Escaneie o QR code abaixo com seu WhatsApp para conectar seu agente."}
              {connectionStatus === "connected" && "Seu WhatsApp foi conectado com sucesso."}
              {connectionStatus === "failed" && "Não foi possível conectar ao WhatsApp."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4 p-8">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center text-sm text-muted-foreground">
                  Conectando ao servidor...
                </p>
              </div>
            ) : connectionStatus === "waiting" ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeReact value={qrCode} size={200} />
                </div>
                <div className="text-center space-y-2 max-w-xs">
                  <p className="text-sm font-medium">Como conectar:</p>
                  <ol className="text-sm text-muted-foreground space-y-2 text-left list-decimal pl-5">
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Toque em Menu ou Configurações e selecione WhatsApp Web</li>
                    <li>Aponte seu celular para esta tela para escanear o QR code</li>
                  </ol>
                </div>
              </div>
            ) : connectionStatus === "connected" ? (
              <div className="flex flex-col items-center space-y-4 p-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center">
                  Seu WhatsApp foi conectado com sucesso! Você já pode começar a usar seu agente.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-center">
                  Não foi possível conectar ao WhatsApp. Por favor, tente novamente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {connectionStatus === "waiting" && (
              <>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleComplete} 
                  disabled={isLoading}
                  className="mb-2 sm:mb-0"
                >
                  Conectado? Clique aqui
                </Button>
              </>
            )}
            
            {connectionStatus === "connected" && (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Continuar
              </Button>
            )}
            
            {connectionStatus === "failed" && (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleRetry}
                  loading={isLoading}
                  className="mb-2 sm:mb-0"
                >
                  Tentar novamente
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a conexão com o WhatsApp? Você poderá conectar novamente mais tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

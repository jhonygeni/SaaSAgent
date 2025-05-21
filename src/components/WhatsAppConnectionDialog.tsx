
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
import { 
  Loader2, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  RefreshCw,
  Bug,
  ArrowRight
} from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";
import { toast } from "@/hooks/use-toast";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";
import { USE_MOCK_DATA } from "@/constants/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    isLoading, 
    qrCodeData,
    connectionError,
    getConnectionInfo,
    debugInfo,
    attemptCount,
    validateInstanceName
  } = useConnection();
  
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(process.env.NODE_ENV !== "production");
  const [customInstanceName, setCustomInstanceName] = useState("");
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameValidated, setNameValidated] = useState(false);
  
  // Effect to validate instance name when it changes
  useEffect(() => {
    if (customInstanceName.trim()) {
      const validate = async () => {
        setIsValidatingName(true);
        try {
          const formattedName = customInstanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const result = await validateInstanceName(formattedName);
          setNameValidated(result.valid);
          setNameError(result.valid ? null : result.message || "Nome inválido");
        } catch (error) {
          console.error("Error validating name:", error);
          setNameValidated(false);
          setNameError("Erro na validação");
        } finally {
          setIsValidatingName(false);
        }
      };
      
      const debounceValidate = setTimeout(validate, 500);
      return () => clearTimeout(debounceValidate);
    } else {
      setNameValidated(false);
      setNameError(null);
    }
  }, [customInstanceName, validateInstanceName]);
  
  // Start connection process when dialog opens
  useEffect(() => {
    const initiateConnection = async () => {
      if (open && !hasInitiatedConnection && connectionStatus === "waiting" && !qrCodeData && !isLoading) {
        console.log("Starting WhatsApp connection process automatically");
        setHasInitiatedConnection(true);
        try {
          // If we have an agentId, use it for the instance name
          const instanceNameSuffix = agentId ? `_${agentId.substring(0, 8)}` : '';
          const result = await startConnection(`agent${instanceNameSuffix}`);
          if (result) {
            console.log("Connection started successfully, QR code received");
          } else {
            console.error("Failed to start connection - no QR code received");
            toast({
              title: "Connection Error",
              description: "Failed to generate WhatsApp QR code. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to start connection:", error);
        }
      }
    };
    
    initiateConnection();
  }, [open, hasInitiatedConnection, connectionStatus, qrCodeData, isLoading, startConnection, agentId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitiatedConnection(false);
      setCustomInstanceName("");
      setNameValidated(false);
      setNameError(null);
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

  // Handle custom instance name submit
  const handleCustomNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customInstanceName.trim()) {
      setNameError("Por favor, informe um nome para a instância");
      return;
    }
    
    if (isValidatingName) {
      return; // Don't proceed if still validating
    }
    
    if (nameError) {
      toast({
        title: "Erro de Validação",
        description: nameError,
        variant: "destructive",
      });
      return;
    }
    
    setHasInitiatedConnection(true);
    try {
      const formattedName = customInstanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const result = await startConnection(formattedName);
      
      if (result) {
        console.log("Connection with custom name started successfully");
      } else {
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar com o nome fornecido. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error with custom name connection:", error);
      toast({
        title: "Erro de Conexão",
        description: error.message || "Erro desconhecido ao conectar",
        variant: "destructive",
      });
    }
  };

  // Handle retry button click
  const handleRetry = async () => {
    setHasInitiatedConnection(true);
    try {
      // If we have an agentId, use it for the instance name
      const instanceNameSuffix = agentId ? `_${agentId.substring(0, 8)}` : '';
      const result = await startConnection(`agent${instanceNameSuffix}`);
      if (result) {
        console.log("Connection retry initiated successfully");
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to generate WhatsApp QR code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to retry connection:", error);
      toast({
        title: "Connection Error",
        description: "Failed to initiate connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy instance info to clipboard
  const copyInstanceInfo = () => {
    const { instanceName, instanceData } = getConnectionInfo();
    const infoText = `Instance Name: ${instanceName}\nInstance Data: ${JSON.stringify(instanceData || {}, null, 2)}`;
    
    navigator.clipboard.writeText(infoText)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Instance information copied to clipboard.",
          variant: "default",
        });
      })
      .catch((err) => {
        console.error("Failed to copy instance info:", err);
      });
  };
  
  // Toggle debug information
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  // Copy debug info to clipboard
  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(debugInfo)
        .then(() => {
          toast({
            title: "Debug Info Copied",
            description: "Debug information copied to clipboard.",
            variant: "default",
          });
        })
        .catch((err) => {
          console.error("Failed to copy debug info:", err);
        });
    }
  };

  // Get dialog title based on whether we're connecting a specific agent
  const getDialogTitle = () => {
    if (agentId) {
      return "Conectar Agente ao WhatsApp";
    }
    return "Conectar WhatsApp";
  };

  // Get dialog description based on whether we're connecting a specific agent
  const getDialogDescription = () => {
    if (agentId) {
      return "Conecte seu agente ao WhatsApp para que ele possa enviar e receber mensagens.";
    }
    return "Conecte seu WhatsApp para que o agente possa enviar e receber mensagens.";
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
            {USE_MOCK_DATA && (
              <div className="mt-1 text-xs p-1 bg-yellow-50 text-yellow-700 rounded">
                WARNING: Running in mock mode - real API calls are disabled
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {connectionStatus === "failed" && connectionError?.includes("already in use") && (
            <form onSubmit={handleCustomNameSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-instance-name">Nome da Instância</Label>
                <div className="relative">
                  <Input
                    id="custom-instance-name"
                    placeholder="Digite um nome único para sua instância"
                    value={customInstanceName}
                    onChange={(e) => setCustomInstanceName(e.target.value)}
                    className={nameError ? "border-red-300 pr-10" : ""}
                  />
                  {isValidatingName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {nameError && !isValidatingName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                  {nameValidated && !nameError && !isValidatingName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>O nome da instância anterior já está em uso. Por favor, escolha outro nome para continuar.</p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!nameValidated || isValidatingName || isLoading}
                loading={isLoading}
              >
                Conectar com Novo Nome
              </Button>
            </form>
          )}

          {isLoading && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                {connectionStatus === "waiting" ? "Criando instância WhatsApp..." : "Inicializando conexão WhatsApp..."}
              </p>
              {attemptCount > 0 && (
                <p className="text-xs text-muted-foreground">Tentativa {attemptCount}</p>
              )}
            </div>
          )}

          {!isLoading && connectionStatus === "waiting" && qrCodeData && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QrCodeDisplay 
                  value={qrCodeData}
                  size={200}
                />
              </div>
              <div className="flex flex-col items-center space-y-2 max-w-xs text-center">
                <Smartphone className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium">Escaneie este código QR</p>
                <p className="text-xs text-muted-foreground">
                  Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos Conectados,
                  e escaneie o código QR acima.
                </p>
              </div>
              
              {attemptCount > 0 && (
                <div className="w-full text-center">
                  <p className="text-xs text-muted-foreground">
                    Aguardando conexão... (Tentativa {attemptCount})
                  </p>
                </div>
              )}
              
              {showDebugInfo && (
                <div className="w-full border rounded-md p-3 bg-muted/50 mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Detalhes da conexão</p>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={toggleDebugInfo} title="Esconder informações de debug">
                        <Bug className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyInstanceInfo} title="Copiar informações da conexão">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Instância: {getConnectionInfo().instanceName}
                  </p>
                  
                  {debugInfo && (
                    <div className="mt-2 p-2 bg-muted rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium">Informações de Debug</p>
                        <Button variant="ghost" size="sm" onClick={copyDebugInfo} className="h-5 w-5 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                        {debugInfo}
                      </pre>
                    </div>
                  )}
                </div>
              )}
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
                  Seu agente agora pode enviar e receber mensagens.
                </p>
              </div>
              
              {showDebugInfo && (
                <div className="w-full border rounded-md p-3 bg-green-50 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Detalhes da conexão</p>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={toggleDebugInfo} title="Esconder informações de debug">
                        <Bug className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyInstanceInfo} title="Copiar informações da conexão">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Instância: {getConnectionInfo().instanceName}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLoading && connectionStatus === "failed" && !connectionError?.includes("already in use") && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Falha na conexão</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {connectionError || "Não foi possível conectar à API do WhatsApp. Por favor, tente novamente."}
                </p>
              </div>
              
              {showDebugInfo && (
                <div className="w-full border rounded-md p-3 bg-red-50/50 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Detalhes do erro</p>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={toggleDebugInfo} title="Esconder informações de debug">
                        <Bug className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyDebugInfo} title="Copiar informações de debug">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {debugInfo && (
                    <div className="mt-2 p-2 bg-muted rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium">Informações de Debug</p>
                        <Button variant="ghost" size="sm" onClick={copyDebugInfo} className="h-5 w-5 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                        {debugInfo}
                      </pre>
                    </div>
                  )}
                </div>
              )}
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
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? "Carregando..." : "Gerar novo código"}
            </Button>
          )}
          
          {connectionStatus === "failed" && !connectionError?.includes("already in use") && (
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
              Continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

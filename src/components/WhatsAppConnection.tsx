import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "@/context/ConnectionContext";
import { useAgent } from "@/context/AgentContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Check, X, RefreshCw, Smartphone, QrCode } from "lucide-react";

// Mock QR Code Image (In real implementation, this would be dynamically generated)
const MOCK_QR_CODE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAA9klEQVRYw+2WMQ7DIAxFDUydo1yAa+T+V+gCHIe1akaT/y1Rh4QftiPZz/LXB8PDw8PDw8P/jt/evy9uaNi6r7vYoe6V9XsNOa11eM2l+1A7aL3EkFNdWLvqzPqAtyldqfCr6owO6YJ13erAho13MTY49IE9N1z0OTvvaFaWvjI2WHy4nbVBJzZu4KyomoWv4g+PGDfIwS/XzOrgN4s/5HA3k1/F9WNidt7RLDHAVXzG+KvsLrzSgfXPxngD6/+qYdXpkk5rl8Y53TRLkVvfb+LZ+DFtEeuqfmH8OvPD5Vczf4pnMTtnvVmPLOr9Znbun31HKTw8PPzv+AcAAP//oMvuAhp65jAAAAAASUVORK5CYII=";

export function WhatsAppConnection() {
  const [qrCode, setQrCode] = useState(MOCK_QR_CODE_URL);
  const [showConnected, setShowConnected] = useState(false);
  const { connectionStatus, completeConnection, cancelConnection, isLoading } = useConnection();
  const { updateAgent, currentAgent, agents, updateAgentById } = useAgent();
  const navigate = useNavigate();
  
  // In a real implementation, we would poll a backend API to check for connection status
  useEffect(() => {
    if (connectionStatus === "waiting") {
      const timer = setTimeout(() => {
        // Simulate successful connection after 10 seconds
        if (Math.random() > 0.2) { // 80% success rate for demo
          setShowConnected(true);
          const mockPhoneNumber = `+55 11 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`;
          
          // Mark the agent as connected
          if (agents.length > 0) {
            const latestAgent = agents[agents.length - 1];
            updateAgentById(latestAgent.id!, {
              connected: true,
              phoneNumber: mockPhoneNumber,
              status: "ativo"
            });
          }
          
          completeConnection(mockPhoneNumber);
        } else {
          // Simulate failure
          cancelConnection();
        }
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  const handleRefreshQR = () => {
    // In a real implementation, we would request a new QR code from the backend
    toast({
      title: "QR Code atualizado",
      description: "Um novo QR code foi gerado.",
    });
    // For demo, we'll just simulate a new QR code
    setQrCode(`${MOCK_QR_CODE_URL}?refresh=${Date.now()}`);
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto py-12 max-w-md text-center">
      <h2 className="text-3xl font-bold mb-6">Conectar WhatsApp</h2>
      
      {connectionStatus === "waiting" && !showConnected && (
        <div className="space-y-8">
          <div className="flex items-center justify-center flex-col">
            <div className="rounded-lg overflow-hidden border shadow-lg mb-4">
              {isLoading ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted">
                  <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={qrCode}
                  alt="QR Code para conexão do WhatsApp"
                  className="w-[200px] h-[200px]"
                />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshQR}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar QR Code
            </Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Como conectar</h3>
            <ol className="text-left space-y-3">
              <li className="flex items-start gap-2">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <p>Abra o WhatsApp no seu celular</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <p>Toque em Menu ou Configurações e selecione "Aparelhos conectados"</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <p>Toque em "Conectar dispositivo"</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <span className="text-xs font-medium text-primary">4</span>
                </div>
                <p>Escaneie o QR code acima</p>
              </li>
            </ol>
          </div>
          
          <div className="text-muted-foreground text-sm">
            <p>Aguardando conexão com o WhatsApp...</p>
          </div>
        </div>
      )}
      
      <Dialog open={showConnected} onOpenChange={setShowConnected}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Check className="h-6 w-6 text-success-500" />
              <span>Conexão realizada com sucesso!</span>
            </DialogTitle>
            <DialogDescription>
              Seu agente de IA já está funcionando e pronto para atender pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-success-500" />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleFinish} size="lg">
              Ir para o Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {connectionStatus === "failed" && (
        <div className="space-y-6 border rounded-lg p-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <X className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">Falha na conexão</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível conectar ao WhatsApp. Por favor, tente novamente.
            </p>
            {/* <Button onClick={() => window.location.reload()}> // REMOVIDO para evitar reload automático */}
          </div>
        </div>
      )}
    </div>
  );
}

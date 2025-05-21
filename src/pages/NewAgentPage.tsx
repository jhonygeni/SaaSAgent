
import { useState, useEffect } from "react";
import { NewAgentForm } from "@/components/NewAgentForm";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useConnection } from "@/context/ConnectionContext";
import { USE_MOCK_DATA, EVOLUTION_API_URL } from "@/constants/api";
import { toast } from "@/hooks/use-toast";
import { useAgent } from "@/context/AgentContext";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types";

const NewAgentPage = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { connectionStatus, qrCodeData, startConnection, cancelConnection } = useConnection();
  const { addAgent } = useAgent();
  const navigate = useNavigate();

  // Log important connection state changes
  useEffect(() => {
    console.log("NewAgentPage - Connection status:", connectionStatus, "QR code available:", !!qrCodeData);
    
    // Show warning if in mock mode
    if (USE_MOCK_DATA) {
      toast({
        title: "⚠️ Modo Demo Ativo",
        description: "Executando em modo de demonstração. Nenhuma conexão real com WhatsApp será feita. NUNCA use isto em produção!",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [connectionStatus, qrCodeData]);

  const handleAgentCreated = (agent: Agent) => {
    console.log("Agent created, showing connection dialog");
    // Log API connection details
    console.log(`Using Evolution API at: ${EVOLUTION_API_URL}, Mock mode: ${USE_MOCK_DATA ? 'ON' : 'OFF'}`);
    
    // Save the agent first, regardless of connection status
    const savedAgent = {
      ...agent,
      connected: false,
      status: "pendente"
    };
    
    // Add the agent to the agent context
    addAgent(savedAgent);
    
    // Show the connection dialog
    setShowConnectionDialog(true);
  };

  // Handle connection dialog close
  const handleConnectionDialogClose = (isOpen) => {
    setShowConnectionDialog(isOpen);
    
    if (!isOpen) {
      // Dialog was closed, navigate to dashboard regardless of connection state
      if (connectionStatus !== "connected") {
        // Connection was not successful, but we proceed anyway
        toast({
          title: "Agente criado sem conexão WhatsApp",
          description: "Você pode conectar o WhatsApp posteriormente no painel de controle.",
          variant: "default",
        });
        cancelConnection();
      } else {
        toast({
          title: "Agente criado com sucesso!",
          description: "Seu agente está pronto para usar com o WhatsApp conectado.",
          variant: "default",
        });
      }
      
      // Navigate to dashboard in both cases
      navigate("/dashboard");
    }
  };

  // For testing in development, can be removed in production
  const handleTestConnection = async () => {
    console.log("Manual test of connection requested");
    try {
      const qrCode = await startConnection();
      if (qrCode) {
        console.log("QR Code received successfully");
        setShowConnectionDialog(true);
      } else {
        console.error("Failed to get QR code");
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível inicializar a conexão WhatsApp.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error starting connection:", error);
      
      // Special handling for duplicate name errors
      if (error.message && error.message.includes("already in use")) {
        toast({
          title: "Nome Duplicado",
          description: "Este nome já está em uso. Abra o diálogo de conexão para usar um nome diferente.",
          variant: "destructive",
        });
        setShowConnectionDialog(true);
      } else {
        toast({
          title: "Erro de Conexão",
          description: `Falha ao conectar à API do WhatsApp: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <NewAgentForm onAgentCreated={handleAgentCreated} />
        <WhatsAppConnectionDialog 
          open={showConnectionDialog} 
          onOpenChange={handleConnectionDialogClose}
        />
        
        {/* Debug section for development, can be removed in production */}
        {process.env.NODE_ENV !== "production" && (
          <div className="container mx-auto mt-8 p-4 border border-dashed rounded-md">
            <h3 className="text-lg font-medium mb-2">Ferramentas de Desenvolvimento</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleTestConnection}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Testar Conexão WhatsApp
              </button>
              <button 
                onClick={() => setShowConnectionDialog(true)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Mostrar Diálogo de Conexão
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Modo API:</strong> {USE_MOCK_DATA ? "⚠️ Dados Simulados (Demo)" : "✓ Chamadas de API Reais"}</p>
              <p><strong>URL da API:</strong> {EVOLUTION_API_URL}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewAgentPage;

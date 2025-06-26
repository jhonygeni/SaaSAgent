
import { useState, useEffect } from "react";
import { ImprovedAgentForm } from "@/components/ImprovedAgentForm";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useConnection } from "@/context/ConnectionContext";
import { USE_MOCK_DATA, EVOLUTION_API_URL } from "@/constants/api";
import { useToast } from "@/hooks/use-toast";
import { useAgent } from "@/context/AgentContext";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { ErrorState } from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button-extensions";

const NewAgentPage = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { connectionStatus, qrCodeData, startConnection, cancelConnection } = useConnection();
  const { addAgent, updateAgentById } = useAgent();
  const navigate = useNavigate();
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const [pageError, setPageError] = useState<string | null>(null);

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
    
    // Update the agent status when connection status changes to connected
    if (connectionStatus === "connected" && createdAgent?.id) {
      console.log("WhatsApp connection successful, updating agent status");
      updateAgentById(createdAgent.id, {
        connected: true,
        status: "ativo"
      });
    }
  }, [connectionStatus, qrCodeData, createdAgent, updateAgentById, toast]);

  const handleAgentCreated = async (agent: Agent, connect: boolean = true) => {
    console.log("Agent created, handling persistence and connection");
    
    // Verify that agent has a valid ID
    if (!agent || !agent.id) {
      console.error("Received agent without a valid ID", agent);
      setPageError("Erro: O agente foi criado sem um ID válido.");
      toast({
        title: "Erro ao processar agente",
        description: "Ocorreu um erro ao processar o agente criado. ID não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    // Log API connection details
    console.log(`Using Evolution API at: ${EVOLUTION_API_URL}, Mock mode: ${USE_MOCK_DATA ? 'ON' : 'OFF'}`);
    
    try {
      // The agent is already saved in the database in the updated NewAgentForm component
      // Store the created agent for reference in the connection flow
      setCreatedAgent(agent);
      
      if (connect) {
        // Show the connection dialog for WhatsApp integration
        setShowConnectionDialog(true);
      } else {
        // No connection requested, navigate to dashboard
        toast({
          title: "Agente criado com sucesso",
          description: "O agente foi criado com sucesso. Você pode conectá-lo ao WhatsApp posteriormente.",
          variant: "default",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error in agent creation flow:", error);
      setPageError(`Erro ao criar agente: ${error.message}`);
      toast({
        title: "Erro ao criar agente",
        description: "Ocorreu um erro durante a criação do agente.",
        variant: "destructive",
      });
    }
  };

  // Handle connection dialog close
  const handleConnectionDialogClose = (isOpen: boolean) => {
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
      // Generate a unique test instance name
      const testInstanceName = `test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`Using test instance name: ${testInstanceName}`);
      
      // Start the connection (no agentId for test connection)
      await startConnection(testInstanceName);
      
      // Show the connection dialog after the connection attempt
      console.log("QR Code request complete");
      setShowConnectionDialog(true);
    } catch (error: any) {
      console.error("Error starting connection:", error);
      setPageError(`Erro ao iniciar conexão: ${error.message}`);
      
      // Special handling for duplicate instance name errors
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

  // Handle page error retry
  const handleRetry = () => {
    setPageError(null);
    window.location.reload();
  };

  if (pageError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Erro na Página</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorState 
              errorMessage={pageError}
              isAuthError={false}
              onRetry={handleRetry}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <ImprovedAgentForm onAgentCreated={handleAgentCreated} />
        <WhatsAppConnectionDialog 
          open={showConnectionDialog} 
          onOpenChange={handleConnectionDialogClose}
          agentId={createdAgent?.id}
          instanceName={createdAgent?.instanceName}
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

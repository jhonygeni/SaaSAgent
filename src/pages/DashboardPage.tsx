
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { useAgent } from "@/context/AgentContext";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useToast } from "@/hooks/use-toast";
import { useConnection } from "@/context/ConnectionContext";
import { AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Define the global window interface to include our editAgent function
declare global {
  interface Window {
    editAgent: (agentId: string) => void;
    showWhatsAppConnect: (agentId?: string) => void;
  }
}

const DashboardPage = () => {
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectingAgentId, setConnectingAgentId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const { setSelectedAgentForEdit, updateAgentById, agents } = useAgent();
  const { connectionStatus } = useConnection();
  const { toast } = useToast();
  
  // Make the editAgent function globally available
  useEffect(() => {
    try {
      window.editAgent = (agentId: string) => {
        console.log("Edit agent function called with ID:", agentId);
        setEditAgentId(agentId);
        setEditDialogOpen(true);
      };
      
      window.showWhatsAppConnect = (agentId?: string) => {
        console.log("Show WhatsApp connect dialog called", agentId ? `for agent ${agentId}` : "generally");
        if (agentId) {
          setConnectingAgentId(agentId);
        } else {
          setConnectingAgentId(null);
        }
        setConnectDialogOpen(true);
      };
  
      return () => {
        // Clean up
        delete window.editAgent;
        delete window.showWhatsAppConnect;
      };
    } catch (error) {
      console.error("Error setting up global functions:", error);
      setPageError("Erro ao inicializar funções na página.");
    }
  }, []);

  // Check if there are any agents that need WhatsApp connection - with error handling
  useEffect(() => {
    try {
      const checkForAgentsNeedingConnection = () => {
        // Only proceed if we have the connection status and it's not in a pending state
        if (connectionStatus && connectionStatus !== "connected" && connectionStatus !== "failed" && connectionStatus !== "waiting") {
          if (agents && agents.length > 0) {
            const needsConnection = agents.some(agent => !agent.connected && 
              (agent.status === "pendente" || agent.status === "ativo"));
            if (needsConnection) {
              setConnectDialogOpen(true);
            }
          }
        }
      };
      
      checkForAgentsNeedingConnection();
    } catch (error) {
      console.error("Error checking for agents needing connection:", error);
      // Don't show an error toast for this non-critical functionality
    }
  }, [agents, connectionStatus]);

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    toast({
      title: "Agente atualizado com sucesso!",
      description: "Todas as alterações foram salvas.",
    });
    
    try {
      // Check if the agent needs WhatsApp connection after edit
      if (editAgentId) {
        const agent = agents.find(a => a.id === editAgentId);
        if (agent && !agent.connected) {
          setConnectingAgentId(editAgentId);
          setConnectDialogOpen(true);
        }
      }
    } catch (error) {
      console.error("Error in edit completion handler:", error);
    }
  };

  const handleConnectionComplete = () => {
    try {
      // Update agent with connected status if needed
      if (connectingAgentId) {
        updateAgentById(connectingAgentId, { connected: true, status: "ativo" });
        setConnectingAgentId(null);
      }
    } catch (error) {
      console.error("Error updating agent connection status:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível atualizar o status de conexão do agente.",
        variant: "destructive",
      });
    }
  };

  // If there's a critical page error, display it
  if (pageError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Erro no Dashboard</span>
            </CardTitle>
            <CardDescription>
              Ocorreu um erro ao carregar o dashboard. Por favor, tente recarregar a página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{pageError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Recarregar página
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <Dashboard />
      </main>
      
      <EditAgentDialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditAgentId(null);
        }}
        agentId={editAgentId}
      />
      
      <WhatsAppConnectionDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onComplete={handleConnectionComplete}
        agentId={connectingAgentId}
      />
    </div>
  );
};

export default DashboardPage;

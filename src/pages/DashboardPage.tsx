
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { useAgent } from "@/context/AgentContext";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useToast } from "@/hooks/use-toast";
import { useConnection } from "@/context/ConnectionContext";

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
  const { setSelectedAgentForEdit, updateAgentById, agents } = useAgent();
  const { connectionStatus } = useConnection();
  const { toast } = useToast();
  
  // Make the editAgent function globally available
  useEffect(() => {
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
  }, []);

  // Check if there are any agents that need WhatsApp connection
  useEffect(() => {
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
  }, [agents, connectionStatus]);

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    toast({
      title: "Agente atualizado com sucesso!",
      description: "Todas as alterações foram salvas.",
    });
    
    // Check if the agent needs WhatsApp connection after edit
    if (editAgentId) {
      const agent = agents.find(a => a.id === editAgentId);
      if (agent && !agent.connected) {
        setConnectingAgentId(editAgentId);
        setConnectDialogOpen(true);
      }
    }
  };

  const handleConnectionComplete = () => {
    // Update agent with connected status if needed
    if (connectingAgentId) {
      updateAgentById(connectingAgentId, { connected: true, status: "ativo" });
      setConnectingAgentId(null);
    }
  };

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

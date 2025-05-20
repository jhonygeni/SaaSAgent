
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { useAgent } from "@/context/AgentContext";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useToast } from "@/hooks/use-toast";

// Define the global window interface to include our editAgent function
declare global {
  interface Window {
    editAgent: (agentId: string) => void;
  }
}

const DashboardPage = () => {
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const { setSelectedAgentForEdit, updateAgentById } = useAgent();
  const { toast } = useToast();
  
  // Make the editAgent function globally available
  // This allows the Edit button in AgentList to trigger the dialog
  useEffect(() => {
    window.editAgent = (agentId: string) => {
      console.log("Edit agent function called with ID:", agentId);
      setEditAgentId(agentId);
      setEditDialogOpen(true);
    };

    return () => {
      // Clean up
      delete window.editAgent;
    };
  }, []);

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    toast({
      title: "Agente atualizado com sucesso!",
      description: "Todas as alterações foram salvas.",
    });
    // Check if the agent needs WhatsApp connection after edit
    const needsConnection = false; // This would be determined by agent state
    if (needsConnection) {
      setConnectDialogOpen(true);
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
        onComplete={() => {
          // Update agent with connected status if needed
          if (editAgentId) {
            updateAgentById(editAgentId, { connected: true });
          }
        }}
      />
    </div>
  );
};

export default DashboardPage;

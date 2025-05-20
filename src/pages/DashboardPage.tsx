
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { useAgent } from "@/context/AgentContext";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";

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
  const { setSelectedAgentForEdit } = useAgent();
  
  // Make the editAgent function globally available
  window.editAgent = (agentId: string) => {
    console.log("Edit agent function called with ID:", agentId);
    setEditAgentId(agentId);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    // Optionally show the connect dialog after edit
    // setConnectDialogOpen(true);
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
      />
    </div>
  );
};

export default DashboardPage;

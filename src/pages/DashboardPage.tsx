
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { useAgent } from "@/context/AgentContext";

// Define the global window interface to include our editAgent function
declare global {
  interface Window {
    editAgent: (agentId: string) => void;
  }
}

const DashboardPage = () => {
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { setSelectedAgentForEdit } = useAgent();
  
  // Make the editAgent function globally available
  window.editAgent = (agentId: string) => {
    setEditAgentId(agentId);
    setEditDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <Dashboard />
      </main>
      
      <EditAgentDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        agentId={editAgentId}
      />
    </div>
  );
};

export default DashboardPage;

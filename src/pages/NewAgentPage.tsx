
import { useState } from "react";
import { NewAgentForm } from "@/components/NewAgentForm";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useConnection } from "@/context/ConnectionContext";

const NewAgentPage = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  // We're using useConnection here which requires ConnectionProvider
  // This works because App.tsx wraps the Routes with ConnectionProvider
  const { connectionStatus } = useConnection();

  const handleAgentCreated = () => {
    setShowConnectionDialog(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <NewAgentForm onAgentCreated={handleAgentCreated} />
        <WhatsAppConnectionDialog 
          open={showConnectionDialog} 
          onOpenChange={setShowConnectionDialog} 
        />
      </main>
    </div>
  );
};

export default NewAgentPage;

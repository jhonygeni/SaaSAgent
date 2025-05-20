
import { useState, useEffect } from "react";
import { NewAgentForm } from "@/components/NewAgentForm";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useConnection } from "@/context/ConnectionContext";

const NewAgentPage = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  // We're using useConnection here which requires ConnectionProvider
  // This works because App.tsx wraps the Routes with ConnectionProvider
  const { connectionStatus, qrCodeData } = useConnection();

  // Log important connection state changes
  useEffect(() => {
    console.log("NewAgentPage - Connection status:", connectionStatus, "QR code available:", !!qrCodeData);
  }, [connectionStatus, qrCodeData]);

  const handleAgentCreated = () => {
    console.log("Agent created, showing connection dialog");
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

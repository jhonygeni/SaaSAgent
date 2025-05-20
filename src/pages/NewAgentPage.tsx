
import { useState, useEffect } from "react";
import { NewAgentForm } from "@/components/NewAgentForm";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
import { useConnection } from "@/context/ConnectionContext";
import { USE_MOCK_DATA, EVOLUTION_API_URL } from "@/constants/api";
import { toast } from "@/hooks/use-toast";

const NewAgentPage = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  // We're using useConnection here which requires ConnectionProvider
  // This works because App.tsx wraps the Routes with ConnectionProvider
  const { connectionStatus, qrCodeData, startConnection } = useConnection();

  // Log important connection state changes
  useEffect(() => {
    console.log("NewAgentPage - Connection status:", connectionStatus, "QR code available:", !!qrCodeData);
    
    // Show warning if in mock mode
    if (USE_MOCK_DATA) {
      toast({
        title: "⚠️ Demo Mode Warning",
        description: "Running in demo mode. No real WhatsApp connections will be made. This should NEVER be used in production!",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [connectionStatus, qrCodeData]);

  const handleAgentCreated = () => {
    console.log("Agent created, showing connection dialog");
    // Log API connection details
    console.log(`Using Evolution API at: ${EVOLUTION_API_URL}, Mock mode: ${USE_MOCK_DATA ? 'ON' : 'OFF'}`);
    setShowConnectionDialog(true);
  };

  // For testing in development, can be removed in production
  const handleTestConnection = () => {
    console.log("Manual test of connection requested");
    startConnection().then(qrCode => {
      if (qrCode) {
        console.log("QR Code received successfully");
        setShowConnectionDialog(true);
      } else {
        console.error("Failed to get QR code");
        toast({
          title: "Connection Error",
          description: "Failed to initialize WhatsApp connection.",
          variant: "destructive",
        });
      }
    }).catch(error => {
      console.error("Error starting connection:", error);
      toast({
        title: "Connection Error",
        description: `Failed to connect to WhatsApp API: ${error.message}`,
        variant: "destructive",
      });
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <NewAgentForm onAgentCreated={handleAgentCreated} />
        <WhatsAppConnectionDialog 
          open={showConnectionDialog} 
          onOpenChange={setShowConnectionDialog} 
        />
        
        {/* Debug section for development, can be removed in production */}
        {process.env.NODE_ENV !== "production" && (
          <div className="container mx-auto mt-8 p-4 border border-dashed rounded-md">
            <h3 className="text-lg font-medium mb-2">Development Tools</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleTestConnection}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Test WhatsApp Connection
              </button>
              <button 
                onClick={() => setShowConnectionDialog(true)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Show Connection Dialog
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>API Mode:</strong> {USE_MOCK_DATA ? "⚠️ Mock Data (Demo)" : "✓ Real API Calls"}</p>
              <p><strong>API URL:</strong> {EVOLUTION_API_URL}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewAgentPage;

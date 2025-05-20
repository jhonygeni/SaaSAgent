
import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { ConnectionStatus } from "../types";
import { toast } from "@/hooks/use-toast";
import { useUser } from "./UserContext";

// Evolution API constants
const EVOLUTION_API_URL = "https://cloudsaas.geni.chat";
const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  startConnection: () => void;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  isLoading: boolean;
  qrCodeData: string | null;
  connectionError: string | null;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Integration with Evolution API 2.2.3
  const startConnection = useCallback(async () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      // Call Evolution API to start connection and get QR code
      const response = await fetch(`${EVOLUTION_API_URL}/api/instance/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify({
          instanceName: user?.id || "default_instance", // Use user ID as instance name or default
          qrQuality: 1, // QR quality (1-100)
          waitForLogin: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.qrcode) {
        setQrCodeData(data.qrcode);
        
        // Start polling for connection status
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${EVOLUTION_API_URL}/api/instance/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
                'instanceName': user?.id || "default_instance"
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              if (statusData.status === "connected") {
                setConnectionStatus("connected");
                clearInterval(interval);
                setPollingInterval(null);
                
                // Get phone number info
                const phoneInfoResponse = await fetch(`${EVOLUTION_API_URL}/api/instance/info`, {
                  headers: {
                    'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
                    'instanceName': user?.id || "default_instance"
                  }
                });
                
                if (phoneInfoResponse.ok) {
                  const phoneData = await phoneInfoResponse.json();
                  if (phoneData.phone) {
                    completeConnection(phoneData.phone);
                  } else {
                    completeConnection();
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error polling connection status:", error);
          }
        }, 3000);
        
        setPollingInterval(interval);
      } else {
        throw new Error("No QR code received from API");
      }
    } catch (error) {
      console.error("Error connecting to WhatsApp:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown error occurred");
      setConnectionStatus("failed");
      toast({
        title: "Erro de conexão",
        description: "Não foi possível iniciar a conexão com o WhatsApp. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Call Evolution API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    try {
      await fetch(`${EVOLUTION_API_URL}/api/instance/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify({
          instanceName: user?.id || "default_instance"
        })
      });
    } catch (error) {
      console.error("Error canceling connection:", error);
    }
    
    setConnectionStatus("failed");
    setQrCodeData(null);
    toast({
      title: "Conexão cancelada",
      description: "A conexão com o WhatsApp foi cancelada.",
      variant: "destructive",
    });
  }, [pollingInterval, user]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    // This function is called after we've verified the connection is established
    setConnectionStatus("connected");
    setQrCodeData(null);
    toast({
      title: "Conexão realizada com sucesso!",
      description: phoneNumber 
        ? `Número ${phoneNumber} conectado.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        startConnection,
        cancelConnection,
        completeConnection,
        isLoading,
        qrCodeData,
        connectionError,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}

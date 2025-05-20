
import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { ConnectionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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
      // Note: Based on the 404 errors, we need to confirm the exact endpoint
      // For now, trying a different endpoint path based on Evolution API 2.2.3 convention
      console.log("Attempting to connect with Evolution API at:", `${EVOLUTION_API_URL}/instance/connect`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify({
          instanceName: user?.id || "default_instance", // Use user ID as instance name or default
          token: EVOLUTION_API_KEY,
          qrQuality: 1, // QR quality (1-100)
          waitForLogin: true
        })
      });
      
      if (!response.ok) {
        console.error("Evolution API Error:", response.status, response.statusText);
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Evolution API response:", data);
      
      if (data.qrcode) {
        setQrCodeData(data.qrcode);
        
        // Start polling for connection status
        const interval = setInterval(async () => {
          try {
            // Note: Confirming the correct status endpoint
            const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
                'instanceName': user?.id || "default_instance"
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log("Status response:", statusData);
              
              if (statusData.status === "connected") {
                setConnectionStatus("connected");
                clearInterval(interval);
                setPollingInterval(null);
                
                // Get phone number info
                const phoneInfoResponse = await fetch(`${EVOLUTION_API_URL}/instance/info`, {
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
  }, [user, toast]);

  // Call Evolution API to cancel the connection process
  const cancelConnection = useCallback(async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/logout`, {
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
  }, [pollingInterval, user, toast]);

  // Update connection status to connected
  const completeConnection = useCallback((phoneNumber?: string) => {
    setConnectionStatus("connected");
    setQrCodeData(null);
    toast({
      title: "Conexão realizada com sucesso!",
      description: phoneNumber 
        ? `Número ${phoneNumber} conectado.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, [toast]);

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

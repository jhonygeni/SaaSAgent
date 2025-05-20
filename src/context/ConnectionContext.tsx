
import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { ConnectionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "./UserContext";

// Evolution API constants
const EVOLUTION_API_URL = "https://cloudsaas.geni.chat";
const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";

// Correct API endpoints
const ENDPOINTS = {
  // These are example endpoints - replace with actual endpoints from your documentation
  connect: "/instance/create", // Example: Create a new WhatsApp instance/session
  qrCode: "/instance/qr", // Example: Generate QR code
  status: "/instance/status", // Example: Check connection status
  info: "/instance/info", // Example: Get connected phone info
  logout: "/instance/logout" // Example: Disconnect WhatsApp
};

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
      // Generate instance name based on user ID or use a default
      const instanceName = user?.id || "default_instance";
      console.log(`Starting WhatsApp connection for instance: ${instanceName}`);
      
      // Step 1: Create/Connect to WhatsApp instance
      console.log(`Calling Evolution API at: ${EVOLUTION_API_URL}${ENDPOINTS.connect}`);
      
      // Log exact request for debugging
      const requestBody = {
        instanceName,
        token: EVOLUTION_API_KEY,
        qrQuality: 1 // QR quality (1-100)
      };
      console.log("Request payload:", JSON.stringify(requestBody));
      
      const response = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.connect}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Evolution API Error:", response.status, errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Evolution API response:", data);
      
      // Step 2: Get QR code if successful
      if (data.success || data.status === "created" || data.status === "pending") {
        // Get the QR code 
        const qrResponse = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.qrCode}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
            'instanceName': instanceName
          }
        });
        
        if (!qrResponse.ok) {
          throw new Error(`Failed to get QR code: ${qrResponse.status}`);
        }
        
        const qrData = await qrResponse.json();
        console.log("QR code response:", qrData);
        
        if (qrData.qrcode) {
          setQrCodeData(qrData.qrcode);
          
          // Step 3: Start polling for connection status
          const interval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.status}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
                  'instanceName': instanceName
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
                  const phoneInfoResponse = await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.info}`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
                      'instanceName': instanceName
                    }
                  });
                  
                  if (phoneInfoResponse.ok) {
                    const phoneData = await phoneInfoResponse.json();
                    console.log("Phone info response:", phoneData);
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
      } else {
        throw new Error("Failed to create WhatsApp instance");
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
      const instanceName = user?.id || "default_instance";
      
      await fetch(`${EVOLUTION_API_URL}${ENDPOINTS.logout}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`
        },
        body: JSON.stringify({
          instanceName
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

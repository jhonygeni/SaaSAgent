
import { createContext, useState, useContext, ReactNode } from "react";
import { ConnectionStatus } from "../types";
import { toast } from "@/hooks/use-toast";

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  startConnection: () => void;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  isLoading: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [isLoading, setIsLoading] = useState(false);

  const startConnection = () => {
    setConnectionStatus("waiting");
    setIsLoading(true);
    
    // Simulate API connection process
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const cancelConnection = () => {
    setConnectionStatus("failed");
    toast({
      title: "Conexão cancelada",
      description: "A conexão com o WhatsApp foi cancelada.",
      variant: "destructive",
    });
  };

  const completeConnection = (phoneNumber?: string) => {
    setConnectionStatus("connected");
    toast({
      title: "Conexão realizada com sucesso!",
      description: phoneNumber 
        ? `Número ${phoneNumber} conectado.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  };

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        startConnection,
        cancelConnection,
        completeConnection,
        isLoading,
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

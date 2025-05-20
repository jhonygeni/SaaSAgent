
import { createContext, useContext, ReactNode, useEffect } from "react";
import { ConnectionStatus } from "../types";
import { useWhatsAppConnection } from "../hooks/useWhatsAppConnection";

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  startConnection: () => Promise<string | null>;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  isLoading: boolean;
  qrCodeData: string | null;
  connectionError: string | null;
  getConnectionInfo: () => { 
    instanceName: string; 
    instanceData: any;
    debugInfo: string | null;
  };
  debugInfo: string | null;
  attemptCount: number;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const connection = useWhatsAppConnection();
  
  // For debugging purposes, log context changes
  useEffect(() => {
    console.log("ConnectionContext status updated:", connection.connectionStatus);
  }, [connection.connectionStatus]);

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus: connection.connectionStatus,
        startConnection: connection.startConnection,
        cancelConnection: connection.cancelConnection,
        completeConnection: connection.completeConnection,
        isLoading: connection.isLoading,
        qrCodeData: connection.qrCodeData,
        connectionError: connection.connectionError,
        getConnectionInfo: connection.getConnectionInfo,
        debugInfo: connection.debugInfo,
        attemptCount: connection.attemptCount
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

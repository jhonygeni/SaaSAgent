
import { createContext, useContext, ReactNode } from "react";
import { ConnectionStatus } from "../types";
import { useWhatsAppConnection } from "../hooks/useWhatsAppConnection";

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
  const connection = useWhatsAppConnection();

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


import { createContext, useContext, ReactNode } from "react";
import { ConnectionStatus } from "@/types";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  startConnection: (instanceName?: string) => Promise<string | null>;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  isLoading: boolean;
  qrCodeData: string | null;
  pairingCode: string | null;
  connectionError: string | null; 
  getCurrentQrCode: () => string | null;
  getConnectionInfo: () => any;
  debugInfo: string | null;
  attemptCount: number;
  validateInstanceName: (name: string) => Promise<{valid: boolean, message?: string}>;
  fetchUserInstances: () => Promise<any[]>; // New method to fetch user instances
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const connection = useWhatsAppConnection();

  return (
    <ConnectionContext.Provider value={connection}>
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};

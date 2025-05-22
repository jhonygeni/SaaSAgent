
import { createContext, useContext, ReactNode } from "react";
import { ConnectionStatus } from "@/hooks/whatsapp/types";
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
  fetchUserInstances: () => Promise<any[]>;
  clearPolling: () => void; // Add clearPolling function
}

// Create a default context value to prevent errors when used outside provider
const defaultConnectionContext: ConnectionContextType = {
  connectionStatus: "waiting",
  startConnection: async () => null,
  cancelConnection: () => {},
  completeConnection: () => {},
  isLoading: false,
  qrCodeData: null,
  pairingCode: null,
  connectionError: null,
  getCurrentQrCode: () => null,
  getConnectionInfo: () => ({}),
  debugInfo: null,
  attemptCount: 0,
  validateInstanceName: async () => ({ valid: false, message: "Provider not initialized" }),
  fetchUserInstances: async () => [],
  clearPolling: () => {}, // Add default implementation
};

const ConnectionContext = createContext<ConnectionContextType>(defaultConnectionContext);

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
  
  // No need to throw an error - we have default values now
  return context;
};

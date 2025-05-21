
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';
import { ConnectionStatus } from '../types';
import { toast } from '@/hooks/use-toast';
import { useUser } from './UserContext';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionContextType {
  connectionStatus: ConnectionStatus;
  qrCodeData: string | null;
  startConnection: (instanceName?: string) => Promise<string | null>;
  checkConnectionStatus: () => Promise<ConnectionStatus>;
  disconnect: () => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('waiting');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>('');
  const { user } = useUser();

  // Check if we already have an instance in Supabase
  useEffect(() => {
    if (user?.id) {
      checkExistingInstance();
    }
  }, [user?.id]);

  const checkExistingInstance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Error checking for existing instances:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const instance = data[0];
        console.log("Found existing instance:", instance);
        setInstanceName(instance.name);
        
        // Check connection status of existing instance
        if (instance.status === 'connected') {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error("Error in checkExistingInstance:", error);
    }
  };

  const startConnection = async (customInstanceName?: string): Promise<string | null> => {
    try {
      setConnectionStatus('waiting');
      
      // Default instance name uses the user ID if available
      const defaultInstanceName = user?.id ? `user_${user.id}` : `instance_${Date.now()}`;
      const nameToUse = customInstanceName || instanceName || defaultInstanceName;
      
      console.log(`Starting connection with instance name: ${nameToUse}`);
      
      // Create a new WhatsApp instance
      const instanceResult = await whatsappService.createInstance(nameToUse, user?.id);
      
      if (!instanceResult || !instanceResult.instance) {
        console.error("Failed to create instance, response:", instanceResult);
        setConnectionStatus('failed');
        return null;
      }
      
      setInstanceName(instanceResult.instance.instanceName);
      
      // Get QR code for instance
      let qrCode = instanceResult.qrcode;
      
      if (!qrCode) {
        console.log("QR code not in instance creation response, fetching it separately");
        try {
          const qrResult = await whatsappService.getQrCode(instanceResult.instance.instanceName);
          qrCode = qrResult.qrcode || qrResult.base64 || qrResult.qr;
        } catch (qrError) {
          console.error("Error getting QR code:", qrError);
        }
      }
      
      if (qrCode) {
        setQrCodeData(qrCode);
        console.log("QR code received, ready for scanning");
        return qrCode;
      } else {
        console.error("Failed to get QR code");
        setConnectionStatus('failed');
        return null;
      }
    } catch (error: any) {
      console.error("Error starting connection:", error);
      setConnectionStatus('failed');
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to establish WhatsApp connection",
        variant: "destructive",
      });
      
      return null;
    }
  };

  const checkConnectionStatus = async (): Promise<ConnectionStatus> => {
    if (!instanceName) {
      return 'waiting';
    }
    
    try {
      const statusResult = await whatsappService.getConnectionState(instanceName);
      
      if (statusResult && statusResult.state) {
        console.log("Connection state:", statusResult.state);
        
        if (statusResult.state === 'open' || statusResult.state === 'connected') {
          setConnectionStatus('connected');
          
          // Update instance status in Supabase
          if (user?.id) {
            await supabase
              .from('whatsapp_instances')
              .update({ status: 'connected' })
              .eq('name', instanceName)
              .eq('user_id', user.id);
          }
          
          return 'connected';
        } else if (statusResult.state === 'connecting') {
          setConnectionStatus('waiting');
          return 'waiting';
        } else {
          setConnectionStatus('failed');
          return 'failed';
        }
      }
      
      return connectionStatus;
    } catch (error) {
      console.error("Error checking connection status:", error);
      return 'failed';
    }
  };

  const disconnect = async (): Promise<boolean> => {
    if (!instanceName) {
      return false;
    }
    
    try {
      const logoutResult = await whatsappService.logout(instanceName);
      
      if (logoutResult) {
        setConnectionStatus('waiting');
        setQrCodeData(null);
        
        // Update instance status in Supabase
        if (user?.id) {
          await supabase
            .from('whatsapp_instances')
            .update({ status: 'disconnected' })
            .eq('name', instanceName)
            .eq('user_id', user.id);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error disconnecting:", error);
      return false;
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        qrCodeData,
        startConnection,
        checkConnectionStatus,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}

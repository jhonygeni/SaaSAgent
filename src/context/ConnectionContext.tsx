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
  isLoading: boolean;
  cancelConnection: () => Promise<void>;
  completeConnection: (phoneNumber?: string) => void;
  connectionError: string | null;
  getConnectionInfo: () => { instanceName: string; instanceData: any; debugInfo: string | null };
  debugInfo: string | null;
  attemptCount: number;
  validateInstanceName: (name: string) => Promise<{ valid: boolean; message?: string }>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('waiting');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const { user } = useUser();

  // Check if we already have an instance in Supabase
  useEffect(() => {
    if (user?.id) {
      checkExistingInstance();
    }
  }, [user?.id]);

  // Check for existing agent instances for the current user
  const checkExistingInstance = async () => {
    if (!user?.id) return;
    
    try {
      // Query the agents table instead of whatsapp_instances
      const { data, error } = await supabase
        .from('agents')
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
        console.log("Found existing agent instance:", instance);
        setInstanceName(instance.instance_name);
        
        // Check connection status of existing instance
        if (instance.status === 'connected') {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error("Error in checkExistingInstance:", error);
    }
  };

  // Validate if an instance name is available
  const validateInstanceName = async (name: string): Promise<{ valid: boolean; message?: string }> => {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: "Nome da instância é obrigatório" };
    }
    
    // Format the name - lowercase, no spaces, only alphanumeric and underscore
    const formattedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    try {
      // Check if name already exists in our database
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('instance_name', formattedName);
      
      if (error) {
        console.error("Error checking instance name:", error);
        return { valid: false, message: "Erro ao validar o nome da instância" };
      }
      
      if (data && data.length > 0) {
        return { 
          valid: false, 
          message: `O nome "${formattedName}" já está sendo usado. Por favor, escolha outro nome.` 
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error("Error in validateInstanceName:", error);
      return { valid: false, message: "Erro ao validar o nome da instância" };
    }
  };

  const startConnection = async (customInstanceName?: string): Promise<string | null> => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      setConnectionStatus('waiting');
      
      // Default instance name uses the user ID if available
      const defaultInstanceName = user?.id ? `user_${user.id}` : `instance_${Date.now()}`;
      let nameToUse = customInstanceName || instanceName || defaultInstanceName;
      
      // Format the instance name - lowercase, no spaces, only alphanumeric and underscore
      nameToUse = nameToUse.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      console.log(`Starting connection with instance name: ${nameToUse}`);
      
      // Validate the instance name before proceeding
      const validation = await validateInstanceName(nameToUse);
      if (!validation.valid) {
        console.error("Invalid instance name:", validation.message);
        setConnectionStatus('failed');
        setConnectionError(validation.message || "O nome da instância é inválido");
        
        toast({
          title: "Erro de Nome",
          description: validation.message || "O nome da instância é inválido",
          variant: "destructive",
        });
        
        return null;
      }
      
      // Create a new WhatsApp instance
      const instanceResult = await whatsappService.createInstance(nameToUse, user?.id);
      
      if (!instanceResult || !instanceResult.instance) {
        console.error("Failed to create instance, response:", instanceResult);
        setConnectionStatus('failed');
        setConnectionError("Falha ao criar instância do WhatsApp");
        return null;
      }
      
      setInstanceName(instanceResult.instance.instanceName);
      setInstanceData(instanceResult);
      
      // Store the complete instance data in the new agents table
      if (user?.id) {
        const { error } = await supabase.from('agents').insert({
          user_id: user.id,
          instance_name: instanceResult.instance.instanceName,
          instance_id: instanceResult.instance.instanceId,
          integration: instanceResult.instance.integration,
          status: instanceResult.instance.status || 'created',
          hash: instanceResult.hash,
          webhook_wa_business: instanceResult.instance.webhookWaBusiness,
          access_token_wa_business: instanceResult.instance.accessTokenWaBusiness,
          settings: instanceResult.settings || {},
        });
        
        if (error) {
          console.error("Error storing agent data in Supabase:", error);
        }
      }
      
      // Get QR code for instance
      let qrCode = instanceResult.qrcode;
      let pairingCode = instanceResult.pairingCode;
      
      if (!qrCode) {
        console.log("QR code not in instance creation response, fetching it separately");
        try {
          const qrResult = await whatsappService.getQrCode(instanceResult.instance.instanceName);
          qrCode = qrResult.qrcode || qrResult.base64 || qrResult.code || null;
          pairingCode = qrResult.pairingCode;
          
          // Update debug info with pairing code if available
          if (pairingCode) {
            setDebugInfo(prev => {
              const prevObj = JSON.parse(prev || '{}');
              return JSON.stringify({
                ...prevObj,
                pairingCode
              });
            });
          }
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
        setConnectionError("Failed to get QR code");
        return null;
      }
    } catch (error: any) {
      console.error("Error starting connection:", error);
      
      // Handle duplicate instance name error specifically
      if (error.message && error.message.includes("already in use")) {
        const errorMessage = "Este nome já está sendo usado. Por favor, escolha outro nome.";
        setConnectionStatus('failed');
        setConnectionError(errorMessage);
        
        toast({
          title: "Nome Duplicado",
          description: errorMessage,
          variant: "destructive",
        });
        
        return null;
      }
      
      // Handle other errors
      setConnectionStatus('failed');
      setConnectionError(error.message || "Falha ao estabelecer conexão com WhatsApp");
      
      toast({
        title: "Erro de Conexão",
        description: error.message || "Falha ao estabelecer conexão com WhatsApp",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
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
          
          // Update agent status in Supabase
          if (user?.id) {
            await supabase
              .from('agents')
              .update({ status: 'connected' })
              .eq('instance_name', instanceName)
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
        setConnectionError(null);
        
        // Update agent status in Supabase
        if (user?.id) {
          await supabase
            .from('agents')
            .update({ status: 'disconnected' })
            .eq('instance_name', instanceName)
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

  const cancelConnection = async (): Promise<void> => {
    try {
      if (instanceName) {
        await whatsappService.logout(instanceName);
      }
      setConnectionStatus('waiting');
      setQrCodeData(null);
      setConnectionError(null);
    } catch (error) {
      console.error("Error in cancelConnection:", error);
    }
  };

  const completeConnection = (phoneNumber?: string): void => {
    setConnectionStatus('connected');
    
    // Update agent status in Supabase if user exists
    if (user?.id && instanceName) {
      supabase
        .from('agents')
        .update({ 
          status: 'connected',
          phone_number: phoneNumber || null
        })
        .eq('instance_name', instanceName)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating agent status:", error);
          }
        });
    }
    
    // Show success toast if phone number is available
    if (phoneNumber) {
      toast({
        title: "Conexão Bem-Sucedida",
        description: `Conectado ao número WhatsApp: ${phoneNumber}`,
      });
    }
  };

  const getConnectionInfo = () => {
    return {
      instanceName,
      instanceData,
      debugInfo
    };
  };

  // Update debug info when relevant state changes
  useEffect(() => {
    const newDebugInfo = {
      connectionStatus,
      instanceName,
      hasQrCode: !!qrCodeData,
      error: connectionError,
      attemptCount,
      userId: user?.id || null
    };
    
    setDebugInfo(JSON.stringify(newDebugInfo, null, 2));
  }, [connectionStatus, instanceName, qrCodeData, connectionError, attemptCount, user?.id]);

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        qrCodeData,
        startConnection,
        checkConnectionStatus,
        disconnect,
        isLoading,
        cancelConnection,
        completeConnection,
        connectionError,
        getConnectionInfo,
        debugInfo,
        attemptCount,
        validateInstanceName
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

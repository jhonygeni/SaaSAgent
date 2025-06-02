import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '@/hooks/whatsapp/types';
import whatsappService from '@/services/whatsappService';
import { useToast } from '../use-toast';
import { USE_MOCK_DATA, MAX_POLLING_ATTEMPTS, STATUS_POLLING_INTERVAL_MS, CONSECUTIVE_SUCCESS_THRESHOLD } from '@/constants/api';
import { ConnectionStateResponse, QrCodeResponse, InstanceInfo } from '@/services/whatsapp/types';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { UsageStatsData } from '@/hooks/useUsageStats';

/**
 * Hook for managing WhatsApp connection status
 */
export function useWhatsAppStatus() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const [qrCodeData, setQrCodeDataInternal] = useState<string | null>(null);
  
  // Wrapper para debug do setQrCodeData
  const setQrCodeData = useCallback((data: string | null) => {
    console.log("🔧 setQrCodeData called with:", data ? `QR data (${data.length} chars)` : "null");
    setQrCodeDataInternal(data);
  }, []);
  
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  
  const connectionStartTime = useRef<number | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const consecutiveSuccessCount = useRef(0);
  const currentInstanceNameRef = useRef<string | null>(null);
  
  const { user } = useUser();
  const [data, setData] = useState<UsageStatsData[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, []);
  
  // Show error toast
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: "Erro de Conexão",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Show success toast
  const showSuccessToast = useCallback((phoneNumber?: string) => {
    toast({
      title: "Conexão bem-sucedida!",
      description: phoneNumber 
        ? `Conectado ao número ${phoneNumber}.` 
        : "WhatsApp conectado com sucesso.",
      variant: "default",
    });
  }, [toast]);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      currentInstanceNameRef.current = null;
      console.log("Polling de status interrompido.");
    }
  }, []);

  // Start connection time tracking
  const startConnectionTimer = useCallback(() => {
    connectionStartTime.current = Date.now();
  }, []);

  // Stop connection time tracking and calculate duration
  const stopConnectionTimer = useCallback(() => {
    if (connectionStartTime.current) {
      const duration = (Date.now() - connectionStartTime.current) / 1000; // Convert to seconds
      setTimeTaken(duration);
      return duration;
    }
    return null;
  }, []);

  // Update debug info
  const updateDebugInfo = useCallback((newInfo: any = null) => {
    const debugData = {
      connectionStatus,
      qrCodeData: qrCodeData ? "[QR DATA AVAILABLE]" : null,
      error: connectionError,
      attemptCount,
      mockMode: USE_MOCK_DATA,
      pairingCode,
      creditsConsumed,
      consecutiveSuccessCount: consecutiveSuccessCount.current,
      connectionTime: connectionStartTime.current 
        ? `${((Date.now() - connectionStartTime.current) / 1000).toFixed(1)}s` 
        : null,
      apiHealth: "checking...",
      currentInstance: currentInstanceNameRef.current,
      ...newInfo
    };
    
    // Check API health in background with throttling to reduce excessive calls
    const lastHealthCheckKey = 'lastApiHealthCheck';
    const lastHealthCheck = sessionStorage.getItem(lastHealthCheckKey);
    const now = Date.now();
    
    // Only check API health once every 30 seconds to reduce spam
    if (!lastHealthCheck || (now - parseInt(lastHealthCheck)) > 30000) {
      sessionStorage.setItem(lastHealthCheckKey, now.toString());
      
      whatsappService.checkApiHealth().then(isHealthy => {
        const updatedDebugData = {
          ...debugData,
          apiHealth: isHealthy ? "healthy" : "unhealthy"
        };
        setDebugInfo(JSON.stringify(updatedDebugData, null, 2));
      }).catch(error => {
        const updatedDebugData = {
          ...debugData,
          apiHealth: "error checking",
          apiHealthError: error instanceof Error ? error.message : String(error)
        };
        setDebugInfo(JSON.stringify(updatedDebugData, null, 2));
      });
    } else {
      // Use cached health status
      setDebugInfo(JSON.stringify(debugData, null, 2));
    }
    
    console.log("Debug info updated:", debugData);
  }, [connectionStatus, qrCodeData, connectionError, attemptCount, pairingCode, creditsConsumed]);

  /**
   * Start polling for connection status following the API docs
   * This should only poll /instance/connectionState/{instance} endpoint
   */
  const startStatusPolling = useCallback((instanceName: string) => {
    // Store the instance name we're polling for - with consistent formatting
    const formattedName = instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
    currentInstanceNameRef.current = formattedName;
    
    // Clear any existing polling
    clearPolling();
    
    console.log(`Starting status polling for instance: ${formattedName}`);
    consecutiveSuccessCount.current = 0;
    let pollCount = 0;
    
    if (!connectionStartTime.current) {
      startConnectionTimer();
    }
    
    pollingInterval.current = setInterval(async () => {
      if (currentInstanceNameRef.current !== formattedName) {
        // The instance we're polling for has changed, stop this polling
        clearPolling();
        return;
      }
      
      pollCount++;
      setAttemptCount(pollCount);
      
      try {
        console.log(`Polling connection state (attempt ${pollCount}/${MAX_POLLING_ATTEMPTS})`);
        
        // IMPORTANT: This is the ONLY API call we should be making in this polling loop
        // according to the API documentation
        const stateData: ConnectionStateResponse = await whatsappService.getConnectionState(formattedName);
        console.log(`Connection state for ${formattedName}:`, stateData);
        
        updateDebugInfo({ 
          pollCount, 
          instanceName: formattedName,
          connectionState: stateData?.state || 
                         (stateData?.instance?.state) || 
                         stateData?.status,
          consecutiveSuccessCount: consecutiveSuccessCount.current
        });
        
        // Check for successful connection states - handle all possible formats from API:
        // 1. { state: "open" }
        // 2. { status: "open" }
        // 3. { instance: { state: "open" } }
        const connectionState = stateData?.state || 
                              (stateData?.instance?.state) || 
                              stateData?.status;
                              
        console.log(`Current connection state: ${connectionState}`);
        
        // Check for waiting_qr state
        if (connectionState === "waiting_qr" || (stateData.qrCode && stateData.qrCode.length > 0)) {
          console.log("QR code is ready to be scanned");
          clearPolling();
          setConnectionStatus("waiting_qr");
          
          // If there's a qrCode in the response, use it
          if (stateData.qrCode) {
            setQrCodeData(stateData.qrCode);
          }
          
          // Still try to get a QR code if none is provided in the state response
          if (!stateData.qrCode) {
            try {
              const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
              if (qrResponse?.qrcode || qrResponse?.base64 || qrResponse?.code) {
                setQrCodeData(qrResponse.qrcode || qrResponse.base64 || qrResponse.code);
                
                if (qrResponse.pairingCode) {
                  setPairingCode(qrResponse.pairingCode);
                }
              }
            } catch (qrError) {
              console.error("Failed to get QR code:", qrError);
              setConnectionStatus("failed");
              setConnectionError("Failed to get QR code. Please try again.");
            }
          }
          
          return;
        }
        
        // Check for error or already_exists states
        if (connectionState === "error" || 
            connectionState === "already_exists" || 
            stateData.error === true || 
            stateData.message?.toLowerCase().includes("error")) {
          console.log("Connection error detected");
          clearPolling();
          setConnectionStatus("failed");
          setConnectionError(stateData.message || "Connection error occurred. Please try again.");
          return;
        }
        
        const isConnected = 
          connectionState === "open" || 
          connectionState === "connected" || 
          connectionState === "confirmed";
        
        if (isConnected) {
          console.log(`Conexão bem-sucedida detectada (${consecutiveSuccessCount.current + 1}/${CONSECUTIVE_SUCCESS_THRESHOLD})`);
          consecutiveSuccessCount.current++;
          
          // Only mark as connected after consecutive successful checks
          if (consecutiveSuccessCount.current >= CONSECUTIVE_SUCCESS_THRESHOLD) {
            clearPolling();
            setConnectionStatus("connected");
            const duration = stopConnectionTimer();
            console.log(`Conexão confirmada após ${duration?.toFixed(1)}s`);
            
            // Get additional instance info
            try {
              const instanceInfo: InstanceInfo = await whatsappService.getInstanceInfo(formattedName);
              console.log("Info da instância:", instanceInfo);
              
              // Extract phone number (if available)
              const phoneNumber = instanceInfo?.instance?.user?.id?.split('@')[0];
              
              // Display success message
              showSuccessToast(phoneNumber);
              
              return phoneNumber;
            } catch (error) {
              console.error("Falha ao obter informações da instância:", error);
              // Still mark as connected even if we can't get additional info
              showSuccessToast();
              return null;
            }
          }
        } else {
          // Reset consecutive success count if not connected
          consecutiveSuccessCount.current = 0;
          
          // Only refresh QR code if the connection is actually broken/disconnected
          if ((connectionState === "disconnected" || connectionState === "close") && 
              pollCount > 5 && pollCount % 5 === 0) {
            try {
              console.log("Atualizando QR code para instância existente...");
              const qrResponse: QrCodeResponse = await whatsappService.getQrCode(formattedName);
              
              // Check all possible QR code fields
              if (qrResponse?.qrcode || qrResponse?.base64 || qrResponse?.code) {
                setQrCodeData(qrResponse.qrcode || qrResponse.base64 || qrResponse.code);
                setConnectionStatus("waiting_qr");
                clearPolling(); // Stop polling once we have a QR code
                
                if (qrResponse.pairingCode) {
                  setPairingCode(qrResponse.pairingCode);
                }
                
                return;
              }
            } catch (qrError) {
              console.error("Falha ao atualizar QR code:", qrError);
            }
          }
        }
        
        // Stop polling after max attempts
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          clearPolling();
          if (connectionStatus !== "connected") {
            // If we had some successful checks but not enough consecutive ones
            if (consecutiveSuccessCount.current > 0) {
              console.log("Tivemos algumas verificações bem-sucedidas, tratando como conectado");
              setConnectionStatus("connected");
              showSuccessToast();
              stopConnectionTimer();
            } else {
              setConnectionError("Tempo de conexão esgotado. Por favor, tente novamente.");
              setConnectionStatus("failed");
            }
          }
        }
      } catch (error) {
        console.error("Error polling connection status:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        updateDebugInfo({ 
          pollError: errorMessage,
          consecutiveSuccessCount: consecutiveSuccessCount.current 
        });
        
        // Stop polling on auth errors
        if (errorMessage.includes("401") || 
            errorMessage.includes("403") || 
            errorMessage.includes("Authentication")) {
          clearPolling();
          setConnectionError(`Erro de autenticação: ${errorMessage}`);
          setConnectionStatus("failed");
        }
        
        // Stop polling after max attempts regardless of errors
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          clearPolling();
          setConnectionError("Timeout: please try again.");
          setConnectionStatus("failed");
        }
      }
    }, STATUS_POLLING_INTERVAL_MS);
    
    // Return the polling interval identifier
    return pollingInterval.current;
  }, [clearPolling, connectionStatus, showSuccessToast, startConnectionTimer, stopConnectionTimer, updateDebugInfo]);

  // Função para verificar o estado atual da conexão
  const checkCurrentConnectionState = useCallback(async (instanceName: string) => {
    try {
      const stateData = await whatsappService.getConnectionState(instanceName);
      const state = stateData?.state || 
                   stateData?.status || 
                   stateData?.instance?.state || 
                   stateData?.instance?.status;
                   
      if (state === 'connected' || state === 'open') {
        setIsConnected(true);
        return true;
      } else {
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar estado da conexão:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Função para buscar dados iniciais
  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 [REALTIME] Carregando dados iniciais...');

      // Primeiro, buscar instâncias do usuário para verificar conexão
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .single();

      if (instances) {
        await checkCurrentConnectionState(instances.name);
      }

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data: usageData, error: usageError } = await supabase
        .from('usage_stats')
        .select('date, messages_sent, messages_received')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (usageError) {
        console.error('❌ [REALTIME] Erro ao carregar dados:', usageError);
        setError(usageError.message);
        return;
      }

      // Processar dados para os últimos 7 dias
      const last7Days: string[] = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      const processedData: UsageStatsData[] = last7Days.map((dateString) => {
        const date = new Date(dateString);
        const dayName = dayNames[date.getDay()];
        const realData = usageData?.find(item => item.date === dateString);
        
        return {
          dia: dayName,
          enviadas: realData?.messages_sent || 0,
          recebidas: realData?.messages_received || 0,
          date: dateString
        };
      });

      setData(processedData);
      
      const total = processedData.reduce(
        (sum, day) => sum + day.enviadas + day.recebidas, 
        0
      );
      setTotalMessages(total);
      setLastUpdate(new Date());

      console.log('✅ [REALTIME] Dados iniciais carregados:', {
        dias: processedData.length,
        totalMensagens: total
      });

    } catch (err) {
      console.error('❌ [REALTIME] Erro geral:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, checkCurrentConnectionState]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 [REALTIME] Configurando subscription para atualizações...');

    // Primeiro, buscar instância atual
    const fetchCurrentInstance = async () => {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .single();

      if (instance) {
        await checkCurrentConnectionState(instance.name);
      }
    };

    fetchCurrentInstance();

    // Inscrever-se para atualizações na tabela usage_stats
    const subscription = supabase
      .channel('usage_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'usage_stats',
          filter: `user_id=eq.${user.id}` // Filtrar apenas para o usuário atual
        },
        async (payload) => {
          console.log('📨 [REALTIME] Recebida atualização:', payload);
          setLastUpdate(new Date());
          
          // Recarregar dados após qualquer mudança
          await fetchInitialData();
        }
      )
      .subscribe((status) => {
        console.log('🔌 [REALTIME] Status da subscription:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Carregar dados iniciais
    fetchInitialData();

    // Cleanup
    return () => {
      console.log('🔌 [REALTIME] Limpando subscription...');
      subscription.unsubscribe();
      setIsConnected(false);
    };
  }, [user?.id, fetchInitialData, checkCurrentConnectionState]);

  return {
    connectionStatus,
    setConnectionStatus,
    qrCodeData,
    setQrCodeData,
    pairingCode,
    setPairingCode,
    connectionError,
    setConnectionError,
    attemptCount,
    setAttemptCount,
    debugInfo,
    updateDebugInfo,
    creditsConsumed,
    setCreditsConsumed,
    showErrorToast,
    showSuccessToast,
    clearPolling,
    startStatusPolling,
    startConnectionTimer,
    stopConnectionTimer,
    timeTaken,
    data,
    totalMessages,
    isLoading,
    error,
    lastUpdate,
    isConnected
  };
}

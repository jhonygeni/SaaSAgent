import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '@/hooks/whatsapp/types';
import whatsappService from '@/services/whatsappService';
import { useToast } from '../use-toast';
import { USE_MOCK_DATA, MAX_POLLING_ATTEMPTS, STATUS_POLLING_INTERVAL_MS } from '@/constants/api';

const MAX_QR_ATTEMPTS = 5; // Máximo de tentativas para obter QR code

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
  const currentInstanceNameRef = useRef<string | null>(null);
  const isPollingActiveRef = useRef<boolean>(false); // Prevent multiple polling instances
  
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
      console.log("🛑 CLEARING POLLING INTERVAL - Stopping all polling activity");
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      currentInstanceNameRef.current = null;
      isPollingActiveRef.current = false; // Reset polling flag
      console.log("✅ Polling cleared successfully");
    } else {
      console.log("ℹ️ No active polling to clear");
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
    // Prevent multiple polling instances
    if (isPollingActiveRef.current) {
      console.log(`⚠️ Polling already active for instance. Ignoring duplicate start request.`);
      return;
    }
    
    // Store the instance name we're polling for - with consistent formatting
    const formattedName = instanceName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
    currentInstanceNameRef.current = formattedName;
    
    // CRITICAL: Clear any existing polling to prevent memory leaks and race conditions
    clearPolling();
    clearPolling();
    
    // Set polling active flag
    isPollingActiveRef.current = true;
    
    console.log(`🚀 STARTING STATUS POLLING for instance: ${formattedName}`);
    console.log(`📊 Polling configuration: MAX_ATTEMPTS=${MAX_POLLING_ATTEMPTS}, INTERVAL=${STATUS_POLLING_INTERVAL_MS}ms`);
    let pollCount = 0;
    
    // Safety mechanism: Force stop polling after maximum time (2 minutes)
    const MAX_POLLING_TIME_MS = 120000; // 2 minutes absolute maximum
    const pollingStartTime = Date.now();
    
    if (!connectionStartTime.current) {
      startConnectionTimer();
    }
    
    pollingInterval.current = setInterval(async () => {
      // Safety check: Stop if instance name changed
      if (currentInstanceNameRef.current !== formattedName) {
        console.log(`🔄 Instance name changed, stopping polling for ${formattedName}`);
        clearPolling();
        return;
      }
      
      // Safety check: Force stop after maximum time to prevent infinite loops
      const elapsedTime = Date.now() - pollingStartTime;
      if (elapsedTime > MAX_POLLING_TIME_MS) {
        console.log(`⏰ FORCE STOPPING: Maximum polling time (${MAX_POLLING_TIME_MS/1000}s) exceeded`);
        clearPolling();
        setConnectionError("Tempo limite de conexão excedido. Tente novamente.");
        setConnectionStatus("failed");
        return;
      }
      
      pollCount++;
      setAttemptCount(pollCount);
      try {
        const stateData: ConnectionStateResponse = await whatsappService.getConnectionState(formattedName);
        
        // Evolution API v2 returns: { "instance": { "instanceName": "name", "state": "open" } }
        // ENHANCED: More robust state detection for different API response formats
        const connectionState = stateData?.instance?.state || stateData?.state || stateData?.status;
        
        // ENHANCED: Also check for other possible connection indicators
        const alternativeState = stateData?.instance?.status || stateData?.status;
        const isInstanceConnected = false; // Simplified - use state strings for connection detection
        const hasUserInfo = false; // Simplified - focus on state-based detection
        
        updateDebugInfo({ 
          pollCount, 
          instanceName: formattedName,
          connectionState,
          alternativeState,
          fullApiResponse: stateData
        });
        
        console.log(`📊 Poll ${pollCount}/${MAX_POLLING_ATTEMPTS}: Connection state = "${connectionState}" | Alt state = "${alternativeState}"`);
        console.log(`🕐 Elapsed time: ${Math.round(elapsedTime/1000)}s / ${MAX_POLLING_TIME_MS/1000}s`);
        
        // ENHANCED: More comprehensive success detection logic
        // Check multiple indicators of successful connection
        const isConnectedByState = connectionState === "open" || connectionState === "connected" || connectionState === "confirmed";
        const isConnectedByAltState = alternativeState === "open" || alternativeState === "connected" || alternativeState === "confirmed";
        
        const isConnected = isConnectedByState || isConnectedByAltState;
        
        if (isConnected) {
          // Enhanced logging to show which condition triggered success detection
          const successReasons = [];
          if (isConnectedByState) successReasons.push(`main state="${connectionState}"`);
          if (isConnectedByAltState) successReasons.push(`alt state="${alternativeState}"`);
          
          console.log(`✅ SUCCESS STATE DETECTED! Reasons: [${successReasons.join(', ')}]`);
          console.log(`🛑 STOPPING POLLING IMMEDIATELY - Connection confirmed after ${pollCount} attempts`);
          console.log(`📋 Success details:`, {
            primaryState: connectionState,
            alternativeState,
            detectionReasons: successReasons
          });
          
          // CRITICAL: Clear polling FIRST to prevent any race conditions
          clearPolling();
          
          // Set success state
          setConnectionStatus("connected");
          const duration = stopConnectionTimer();
          showSuccessToast();
          console.log(`🎉 Connection completed successfully after ${duration}s and ${pollCount} polling attempts`);
          
          // IMPORTANT: Return immediately to exit the interval callback
          return;
        }
        
        // Estados terminais: erro ou falha
        // Check for various error conditions that should stop polling
        const isErrorState = connectionState === "close" || 
                           connectionState === "error" || 
                           connectionState === "failed" ||
                           connectionState === "disconnected" ||
                           alternativeState === "close" ||
                           alternativeState === "error" ||
                           alternativeState === "disconnected" ||
                           stateData?.error === true || 
                           (stateData?.message && stateData.message.toLowerCase().includes("error"));
        
        if (isErrorState) {
          console.log(`❌ Terminal error state detected: primary="${connectionState}", alt="${alternativeState}"`);
          clearPolling(); // Ensure polling stops
          setConnectionStatus("failed");
          const errorMessage = stateData?.message || `Connection failed with state: ${connectionState}`;
          setConnectionError(errorMessage);
          return; // Exit immediately
        }
        
        // ENHANCED: Log current state for debugging when not connected yet
        if (pollCount % 3 === 0) { // Log every 3rd attempt to reduce spam
          console.log(`🔍 Debug state (poll ${pollCount}):`, {
            primaryState: connectionState,
            alternativeState,
            isInstanceConnected,
            hasUserInfo,
            fullResponse: JSON.stringify(stateData, null, 2)
          });
        }
        
        // Se atingir máximo de tentativas de polling
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          console.log(`⏰ STOPPING: Max polling attempts reached (${pollCount}/${MAX_POLLING_ATTEMPTS})`);
          clearPolling(); // Ensure polling stops
          setConnectionError("Tempo de conexão esgotado. Por favor, tente novamente.");
          setConnectionStatus("failed");
          return; // Exit immediately
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateDebugInfo({ pollError: errorMessage });
        console.log(`⚠️ Polling error: ${errorMessage}`);
        
        if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Authentication")) {
          console.log(`🔒 Authentication error detected - stopping polling`);
          clearPolling();
          setConnectionError(`Erro de autenticação: ${errorMessage}`);
          setConnectionStatus("failed");
          return;
        }
        
        if (pollCount >= MAX_POLLING_ATTEMPTS) {
          console.log(`⏰ Max polling attempts reached after error (${MAX_POLLING_ATTEMPTS})`);
          clearPolling();
          setConnectionError("Timeout: please try again.");
          setConnectionStatus("failed");
          return;
        }
      }
    }, STATUS_POLLING_INTERVAL_MS);
    
    // Return the polling interval identifier
    return pollingInterval.current;
  }, []); // Removido dependências que causavam loop infinito - as funções são estáveis

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
  }, []); // Removido dependências para evitar loop infinito

  // Função para buscar dados iniciais
  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 [REALTIME] Carregando dados iniciais...');

      // Primeiro, buscar instâncias do usuário para verificar conexão
      // Fix para 406 error: buscar todas as instâncias do usuário e filtrar por status no cliente
      const { data: allInstances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id);

      // Filtrar instâncias conectadas no lado do cliente para evitar 406 error
      const instances = allInstances?.filter(instance => instance.status === 'connected') || [];

      if (instances && instances.length > 0) {
        await checkCurrentConnectionState(instances[0].name);
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
  }, [user?.id]); // Removido checkCurrentConnectionState das dependências para evitar loop

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 [REALTIME] Configurando subscription para atualizações...');

    // Primeiro, buscar instância atual
    const fetchCurrentInstance = async () => {
      try {
        // Fix para 406 error: buscar todas as instâncias do usuário e filtrar por status no cliente
        const { data: allInstances } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('user_id', user.id);

        // Filtrar instâncias conectadas no lado do cliente para evitar 406 error
        const connectedInstances = allInstances?.filter(instance => instance.status === 'connected') || [];
        const instance = connectedInstances.length > 0 ? connectedInstances[0] : null;

        if (instance) {
          await checkCurrentConnectionState(instance.name);
        }
      } catch (error) {
        console.error('❌ [REALTIME] Erro ao buscar instância atual:', error);
      }
    };

    // Carregar dados iniciais uma vez
    fetchInitialData();
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
          
          // Recarregar dados após qualquer mudança (sem causar loop)
          try {
            await fetchInitialData();
          } catch (error) {
            console.error('❌ [REALTIME] Erro ao recarregar dados:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 [REALTIME] Status da subscription:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup
    return () => {
      console.log('🔌 [REALTIME] Limpando subscription...');
      subscription.unsubscribe();
      setIsConnected(false);
    };
  }, [user?.id]); // Removido fetchInitialData e checkCurrentConnectionState das dependências para evitar loop

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

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
   * EMERGENCY FIX: Polling disabled to prevent infinite loops
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
    
    // Set polling active flag
    isPollingActiveRef.current = true;
    
    console.log(`🚀 STARTING STATUS POLLING for instance: ${formattedName}`);
    console.log(`📊 Polling configuration: MAX_ATTEMPTS=${MAX_POLLING_ATTEMPTS}, INTERVAL=${STATUS_POLLING_INTERVAL_MS}ms`);
    
    if (!connectionStartTime.current) {
      startConnectionTimer();
    }
    
    // EMERGENCY FIX: Enhanced limited polling for connection detection
    // This will only poll for a short time after QR scan to detect connection
    let pollCount = 0;
    const MAX_CONNECTION_POLLS = 20; // Increased to 20 attempts = 40 seconds max
    const CONNECTION_POLL_INTERVAL = 2000; // 2 seconds
    
    console.log('⚠️ EMERGENCY: Connection polling disabled to prevent infinite page reloads');
    
    // EMERGENCY FIX: Replace setInterval with single check to prevent infinite loops
    const connectionDetectionInterval = setTimeout(() => {
      console.log('📱 Manual connection check required - use "Verificar Conexão" button');
      console.log('🚨 Automatic polling has been disabled to resolve page reload issue');
    }, 1000);
    
    // Single connection check without polling to prevent loops
    const performSingleCheck = async () => {
      try {
        console.log('🔍 Performing single connection check...');
        const stateData = await whatsappService.getConnectionState(formattedName);
        
        const primaryState = stateData?.state;
        const instanceState = stateData?.instance?.state;
        const connectedStates = ["open", "connected", "confirmed"];
        const isConnected = connectedStates.includes(primaryState) || connectedStates.includes(instanceState);
        
        if (isConnected) {
          console.log('✅ Connection detected in single check');
          setConnectionStatus("connected");
          const duration = stopConnectionTimer();
          showSuccessToast();
          console.log(`🎉 WhatsApp connected successfully after ${duration}s!`);
        } else {
          console.log('📱 No connection detected - manual verification needed');
          setConnectionStatus("waiting");
        }
      } catch (error) {
        console.error('❌ Single connection check error:', error);
        setConnectionStatus("waiting");
      }
    };
    
    // Perform single check after 2 seconds instead of continuous polling
    setTimeout(performSingleCheck, 2000);
    
    return connectionDetectionInterval;
  }, []); // Removido dependências que causavam loop infinito - as funções são estáveis

  // Enhanced function to check current connection state
  const checkCurrentConnectionState = useCallback(async (instanceName: string) => {
    try {
      console.log(`🔍 Enhanced connection state check for: ${instanceName}`);
      const stateData = await whatsappService.getConnectionState(instanceName);
      
      // Extract all possible state indicators
      const primaryState = stateData?.state;
      const instanceState = stateData?.instance?.state;
      const instanceStatus = stateData?.instance?.status;
      const alternativeState = stateData?.status;
      const isConnectedFlag = stateData?.instance?.isConnected;
      const hasUserInfo = !!(stateData?.instance?.user?.id || stateData?.user?.id);
      
      console.log(`📊 Enhanced connection state response:`, {
        primary: primaryState,
        instanceState: instanceState,
        instanceStatus: instanceStatus,
        alternative: alternativeState,
        isConnectedFlag: isConnectedFlag,
        hasUserInfo: hasUserInfo,
        fullData: stateData
      });
      
      // Check for successful connection with multiple criteria
      const connectedStates = ["open", "connected", "confirmed"];
      const isConnectedByPrimary = connectedStates.includes(primaryState);
      const isConnectedByInstance = connectedStates.includes(instanceState);
      const isConnectedByStatus = connectedStates.includes(instanceStatus);
      const isConnectedByAlt = connectedStates.includes(alternativeState);
      const isConnectedByFlag = isConnectedFlag === true;
      const isConnectedByUserPresence = hasUserInfo && (primaryState !== "close" && instanceState !== "close");
      
      const isConnected = isConnectedByPrimary || isConnectedByInstance || isConnectedByStatus || 
                         isConnectedByAlt || isConnectedByFlag || isConnectedByUserPresence;
                   
      if (isConnected) {
        const detectionReasons = [];
        if (isConnectedByPrimary) detectionReasons.push(`primary="${primaryState}"`);
        if (isConnectedByInstance) detectionReasons.push(`instance="${instanceState}"`);
        if (isConnectedByStatus) detectionReasons.push(`status="${instanceStatus}"`);
        if (isConnectedByAlt) detectionReasons.push(`alt="${alternativeState}"`);
        if (isConnectedByFlag) detectionReasons.push(`flag=true`);
        if (isConnectedByUserPresence) detectionReasons.push(`userPresent=true`);
        
        console.log(`✅ Connection confirmed: [${detectionReasons.join(', ')}]`);
        setConnectionStatus("connected");
        setIsConnected(true);
        showSuccessToast();
        return true;
      } else {
        // Check for error states
        const errorStates = ["close", "error", "failed", "disconnected"];
        const isErrorByPrimary = errorStates.includes(primaryState);
        const isErrorByInstance = errorStates.includes(instanceState);
        const isErrorByStatus = errorStates.includes(instanceStatus);
        const isErrorByAlt = errorStates.includes(alternativeState);
        
        if (isErrorByPrimary || isErrorByInstance || isErrorByStatus || isErrorByAlt) {
          const errorState = primaryState || instanceState || instanceStatus || alternativeState;
          console.log(`❌ Connection failed: ${errorState}`);
          setConnectionStatus("failed");
          setIsConnected(false);
          return false;
        } else {
          console.log(`🔄 Connection pending: no connected state detected`);
          setIsConnected(false);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar estado da conexão:', error);
      setIsConnected(false);
      return false;
    }
  }, []); // Removido dependências para evitar loop infinito

  // Enhanced manual verification function for connection after QR scan
  const checkConnectionAfterScan = useCallback(async (instanceName: string) => {
    console.log('🔍 Enhanced manual connection check after QR scan...');
    
    // Wait a bit for WhatsApp to process the scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Perform verification attempts with enhanced logic
    for (let attempt = 1; attempt <= 8; attempt++) {
      console.log(`🔍 Enhanced verification attempt ${attempt}/8`);
      
      try {
        const isConnected = await checkCurrentConnectionState(instanceName);
        if (isConnected) {
          console.log(`✅ Connection confirmed on attempt ${attempt}`);
          return true;
        }
        
        // On attempt 4, try to get fresh instance info as well
        if (attempt === 4) {
          try {
            console.log('🔍 Attempting instance info check as fallback...');
            const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
            
            if (instanceInfo?.instance?.status === "connected" || 
                instanceInfo?.instance?.isConnected === true ||
                instanceInfo?.instance?.user?.id) {
              console.log('✅ Connection confirmed via instance info check');
              setConnectionStatus("connected");
              setIsConnected(true);
              showSuccessToast();
              return true;
            }
          } catch (infoError) {
            console.log('ℹ️ Instance info check failed, continuing with state checks');
          }
        }
        
        // Wait before next attempt, with increasing delays
        if (attempt < 8) {
          const delay = attempt <= 4 ? 2000 : 3000; // 2s for first 4, then 3s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Error on verification attempt ${attempt}:`, error);
        // Continue with next attempt unless it's the last one
        if (attempt === 8) {
          console.log('❌ All verification attempts failed');
          return false;
        }
      }
    }
    
    console.log('⚠️ Connection not detected after 8 enhanced attempts');
    return false;
  }, [checkCurrentConnectionState, showSuccessToast, setConnectionStatus, setIsConnected]);

  // Force check connection - can be triggered by manual button
  const forceCheckConnection = useCallback(async (instanceName: string) => {
    console.log('🔄 Force checking connection state...');
    setConnectionError(null); // Clear any previous errors
    
    try {
      // First try the standard state check
      const isConnected = await checkCurrentConnectionState(instanceName);
      if (isConnected) {
        return true;
      }
      
      // If not connected, try instance info check
      console.log('🔍 Trying instance info check as fallback...');
      const instanceInfo = await whatsappService.getInstanceInfo(instanceName);
      console.log('📊 Instance info response:', instanceInfo);
      
      if (instanceInfo?.instance?.status === "connected" || 
          instanceInfo?.instance?.isConnected === true ||
          instanceInfo?.instance?.user?.id) {
        console.log('✅ Connection confirmed via force instance info check');
        setConnectionStatus("connected");
        setIsConnected(true);
        showSuccessToast();
        return true;
      }
      
      // If still not connected, show user-friendly message
      console.log('⚠️ Force check: No connection detected');
      setConnectionError("Conexão não detectada. Certifique-se de que escaneou o QR code corretamente.");
      return false;
      
    } catch (error) {
      console.error('❌ Error during force check:', error);
      setConnectionError("Erro ao verificar conexão. Tente novamente em alguns segundos.");
      return false;
    }
  }, [checkCurrentConnectionState, showSuccessToast, setConnectionStatus, setIsConnected, setConnectionError]);

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

  // EMERGENCY FIX: Disable real-time subscription to prevent infinite page reloads
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 [REALTIME] EMERGENCY: Real-time subscription disabled to prevent page reloads');

    // Carregar dados iniciais uma vez apenas, sem subscription
    fetchInitialData();

    console.log('✅ [REALTIME] Static data loaded without subscription');
    setIsConnected(true); // Set as connected without subscription
    setLastUpdate(new Date());

    // Cleanup - sem subscription para cancelar
    return () => {
      console.log('🔌 [REALTIME] No subscription to cleanup');
      setIsConnected(false);
    };
  }, [user?.id]); // Dependência mínima apenas do user?.id

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
    isConnected,
    checkCurrentConnectionState,
    checkConnectionAfterScan,
    forceCheckConnection
  };
}

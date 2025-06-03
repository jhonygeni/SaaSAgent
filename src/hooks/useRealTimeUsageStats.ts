// Hook para monitorar atualizações em tempo real das estatísticas de uso
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { UsageStatsData } from '@/hooks/useUsageStats';

export interface RealTimeUsageStats {
  data: UsageStatsData[];
  totalMessages: number;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isConnected: boolean;
}

// Configuração de retry
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  connectionTimeout: 10000
};

/**
 * Hook que monitora mudanças em tempo real na tabela usage_stats
 */
export function useRealTimeUsageStats(): RealTimeUsageStats {
  const { user } = useUser();
  const [data, setData] = useState<UsageStatsData[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Refs para controle
  const retryAttempts = useRef<number>(0);
  const retryTimeout = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);

  // Função para gerar dados de fallback
  const generateFallbackData = useCallback(() => {
    const today = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return {
        dia: dayNames[date.getDay()],
        enviadas: 0,
        recebidas: 0,
        date: date.toISOString().split('T')[0]
      };
    });
  }, []);

  // Função para buscar dados com retry e rate limiting
  const fetchData = useCallback(async () => {
    if (!user?.id || !isMounted.current) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;

    try {
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

      if (usageError) throw usageError;
      if (!isMounted.current) return;

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const processedData: UsageStatsData[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        const realData = usageData?.find(item => item.date === dateStr);
        
        return {
          dia: dayName,
          enviadas: realData?.messages_sent || 0,
          recebidas: realData?.messages_received || 0,
          date: dateStr
        };
      });

      if (isMounted.current) {
        setData(processedData);
        setTotalMessages(processedData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0));
        setLastUpdate(new Date());
        setError(null);
        retryAttempts.current = 0;
      }

    } catch (err: any) {
      if (!isMounted.current) return;

      retryAttempts.current++;
      
      if (retryAttempts.current < RETRY_CONFIG.maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, retryAttempts.current),
          RETRY_CONFIG.maxDelay
        );
        
        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
        }
        
        retryTimeout.current = setTimeout(() => {
          if (isMounted.current) fetchData();
        }, delay);
        
        setError(`Reconectando... (tentativa ${retryAttempts.current})`);
      } else {
        setData(generateFallbackData());
        setTotalMessages(0);
        setError('Não foi possível carregar dados em tempo real');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, generateFallbackData]);

  // Configurar subscription com melhor gerenciamento de recursos
  useEffect(() => {
    isMounted.current = true;

    if (!user?.id) {
      setData(generateFallbackData());
      setIsLoading(false);
      return;
    }

    // Limpar recursos
    const cleanup = () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      setIsConnected(false);
    };

    // Prevenir múltiplas subscrições
    if (subscriptionRef.current) {
      cleanup();
    }

    // Timeout para conexão
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnected && isMounted.current) {
        cleanup();
        setError('Tempo limite de conexão excedido');
        setData(generateFallbackData());
        setIsLoading(false);
      }
    }, RETRY_CONFIG.connectionTimeout);

    // Criar nova subscription com melhor gerenciamento de erros
    const subscription = supabase
      .channel(`usage_stats_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_stats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (!isMounted.current) return;
          
          // Validar payload antes de atualizar
          if (payload && payload.new) {
            setLastUpdate(new Date());
            fetchData();
          }
        }
      )
      .subscribe((status) => {
        if (!isMounted.current) return;
        
        const isNowConnected = status === 'SUBSCRIBED';
        setIsConnected(isNowConnected);
        
        if (isNowConnected) {
          retryAttempts.current = 0;
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          fetchData();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          cleanup();
          setError('Conexão perdida');
          setData(generateFallbackData());
        }
      });

    subscriptionRef.current = subscription;

    // Buscar dados iniciais
    fetchData();

    // Cleanup
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [user?.id, fetchData, generateFallbackData, isConnected]);

  return {
    data,
    totalMessages,
    isLoading,
    error,
    lastUpdate,
    isConnected
  };
}

/**
 * Hook simplificado que combina dados estáticos com atualizações em tempo real
 * Para usar em componentes que precisam de dados sempre atualizados
 */
export function useEnhancedUsageStats() {
  const realtimeStats = useRealTimeUsageStats();
  
  // Função para forçar atualização manual
  const forceUpdate = useCallback(() => {
    // Recarregar dados fazendo uma nova subscription
    window.location.reload(); // Método simples para garantir dados frescos
  }, []);

  return {
    ...realtimeStats,
    forceUpdate,
    isRealTime: true
  };
}

/**
 * Hook para monitorar apenas o total de mensagens em tempo real
 * Útil para contadores e indicadores simples
 */
export function useRealTimeMessageCount() {
  const { totalMessages, isConnected, lastUpdate } = useRealTimeUsageStats();
  
  return {
    count: totalMessages,
    isConnected,
    lastUpdate,
    isRealTime: true
  };
}

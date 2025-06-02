// Hook para monitorar atualizações em tempo real das estatísticas de uso
import { useState, useEffect, useCallback } from 'react';
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

/**
 * Hook que monitora mudanças em tempo real na tabela usage_stats
 * Atualiza automaticamente quando novas mensagens são processadas
 */
export function useRealTimeUsageStats(): RealTimeUsageStats {
  const { user } = useUser();
  const [data, setData] = useState<UsageStatsData[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Função para buscar dados iniciais
  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 [REALTIME] Carregando dados iniciais...');

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
  }, [user?.id]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 [REALTIME] Configurando subscription para atualizações...');

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
          setIsConnected(true);
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
  }, [user?.id, fetchInitialData]);

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

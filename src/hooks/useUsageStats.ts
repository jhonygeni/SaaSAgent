// filepath: /Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/useUsageStats.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';

export interface UsageStatsData {
  dia: string;
  enviadas: number;
  recebidas: number;
  date: string;
}

export interface UsageStatsResponse {
  data: UsageStatsData[];
  totalMessages: number; // Total de mensagens trocadas (enviadas + recebidas) - para cards
  totalSentMessages: number; // Apenas mensagens enviadas - para barra de progresso do plano
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsageStats(): UsageStatsResponse {
  const { user } = useUser();
  const [data, setData] = useState<UsageStatsData[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0); // Total trocadas (enviadas + recebidas)
  const [totalSentMessages, setTotalSentMessages] = useState<number>(0); // Apenas enviadas
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para controle rigoroso - EVITA LOOPS INFINITOS
  const isMounted = useRef(true);
  const lastFetch = useRef(0);
  const isFetching = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserId = useRef<string | null>(null);
  
  // Throttle de 5 segundos para evitar execuções excessivas
  const THROTTLE_DELAY = 5000;

  // Cleanup no desmonte
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      console.log('🧹 useUsageStats: Limpando recursos no desmonte');
      isMounted.current = false;
      isFetching.current = false;
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);

  // Função principal de busca com controle rigoroso
  const fetchUsageStats = useCallback(async (forceRefetch = false) => {
    // Verificações de segurança para evitar múltiplas execuções
    if (!isMounted.current) {
      console.log('🚫 useUsageStats: Componente desmontado, cancelando fetch');
      return;
    }

    if (isFetching.current && !forceRefetch) {
      console.log('⏸️ useUsageStats: Fetch já em andamento, ignorando');
      return;
    }

    // Throttle para evitar execuções muito frequentes
    const now = Date.now();
    if (!forceRefetch && (now - lastFetch.current) < THROTTLE_DELAY) {
      console.log(`⏱️ useUsageStats: Throttle ativo (${Math.round((THROTTLE_DELAY - (now - lastFetch.current)) / 1000)}s restantes)`);
      return;
    }

    // Verificar se o usuário mudou (evita busca desnecessária)
    const currentUserId = user?.id || null;
    if (!forceRefetch && currentUserId === lastUserId.current && data.length > 0) {
      console.log('👤 useUsageStats: Usuário e dados inalterados, ignorando fetch');
      return;
    }

    isFetching.current = true;
    lastFetch.current = now;
    lastUserId.current = currentUserId;

    try {
      if (!isMounted.current) return;
      setIsLoading(true);
      setError(null);

      console.log('🔍 useUsageStats: Iniciando busca de dados para usuário:', currentUserId || 'sem usuário');

      // TEMPORARY DEBUG: Log do user ID específico
      console.log('🔍 DEBUG: USER ID COMPLETO:', currentUserId);
      console.log('🔍 DEBUG: USER OBJECT:', user);

      // Se não há usuário logado, retornar dados vazios em vez de fallback
      if (!currentUserId) {
        console.log('⚠️ useUsageStats: Usuário não logado, retornando dados vazios');
        if (isMounted.current) {
          setData([]);
          setTotalMessages(0);
          setTotalSentMessages(0);
          setError(null);
        }
        return;
      }

      // Calcular datas dos últimos 30 dias para garantir que pegamos dados existentes
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);

      console.log('📅 DEBUG: Buscando dados entre', thirtyDaysAgo.toISOString().split('T')[0], 'e', today.toISOString().split('T')[0]);

      // Busca principal - expandida para 30 dias
      const { data: usageData, error: usageError } = await supabase
        .from('usage_stats')
        .select('date, messages_sent, messages_received')
        .eq('user_id', currentUserId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      console.log('📊 DEBUG: Resultado da consulta:', { usageData, usageError, length: usageData?.length });

      if (!isMounted.current) return;

      // Se houve erro real, reportar
      if (usageError) {
        console.error('❌ useUsageStats: Erro real do Supabase:', usageError);
        if (isMounted.current) {
          setData([]);
          setTotalMessages(0);
          setTotalSentMessages(0);
          setError(`Erro ao carregar dados: ${usageError.message}`);
        }
        return;
      }

      // Processar dados (mesmo que seja array vazio)
      console.log('✅ useUsageStats: Processando dados reais do Supabase, registros encontrados:', usageData?.length || 0);
      
      // Se há dados reais, usar os últimos 7 dias de dados disponíveis
      // Se não há dados, mostrar os últimos 7 dias com zeros
      let processedData: UsageStatsData[];
      
      if (usageData && usageData.length > 0) {
        // Pegar os últimos 7 registros de dados reais
        const recentData = usageData.slice(-7);
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        processedData = recentData.map((record) => {
          const date = new Date(record.date);
          const dayName = dayNames[date.getDay()];
          
          return {
            dia: dayName,
            enviadas: record.messages_sent || 0,
            recebidas: record.messages_received || 0,
            date: record.date
          };
        });
        
        // Se temos menos de 7 registros, completar com zeros para os dias anteriores
        while (processedData.length < 7) {
          const lastDate = processedData.length > 0 ? new Date(processedData[0].date) : new Date();
          lastDate.setDate(lastDate.getDate() - 1);
          const dayName = dayNames[lastDate.getDay()];
          
          processedData.unshift({
            dia: dayName,
            enviadas: 0,
            recebidas: 0,
            date: lastDate.toISOString().split('T')[0]
          });
        }
      } else {
        // Não há dados, mostrar últimos 7 dias com zeros
        const last7Days: string[] = [];
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          last7Days.push(date.toISOString().split('T')[0]);
        }

        processedData = last7Days.map((dateString) => {
          const date = new Date(dateString);
          const dayName = dayNames[date.getDay()];
          
          return {
            dia: dayName,
            enviadas: 0,
            recebidas: 0,
            date: dateString
          };
        });
      }

      if (!isMounted.current) return;

      // Calcular ambos os totais separadamente
      const totalSent = processedData.reduce((sum, day) => sum + day.enviadas, 0);
      const totalExchanged = processedData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);

      setData(processedData);
      setTotalMessages(totalExchanged); // Total trocadas (enviadas + recebidas) - para cards
      setTotalSentMessages(totalSent); // Apenas enviadas - para barra de progresso
      setError(null);

      console.log('🎉 useUsageStats: Dados carregados com sucesso!', {
        dias: processedData.length,
        totalTrocadas: totalExchanged,
        totalEnviadas: totalSent
      });

    } catch (err) {
      console.error('🚨 useUsageStats: Erro ao buscar estatísticas:', err);
      
      if (!isMounted.current) return;
      
      // Em caso de erro, reportar erro real (sem fallback)
      setData([]);
      setTotalMessages(0);
      setTotalSentMessages(0);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, data.length]);

  // Função de refetch manual
  const refetch = useCallback(() => {
    console.log('🔄 useUsageStats: Refetch manual solicitado');
    
    // Cancelar timeout anterior
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Executar imediatamente (força refetch)
    fetchUsageStats(true);
  }, [fetchUsageStats]);

  // Effect principal - CONTROLADO RIGOROSAMENTE
  useEffect(() => {
    // Cancelar timeout anterior
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Aplicar throttle
    const timeSinceLastFetch = Date.now() - lastFetch.current;
    const delay = Math.max(0, THROTTLE_DELAY - timeSinceLastFetch);
    
    console.log(`🏃 useUsageStats: Agendando fetch em ${delay}ms para usuário:`, user?.id || 'não logado');
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        fetchUsageStats();
      }
    }, delay);

    // Cleanup no desmonte do effect
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [user?.id]); // IMPORTANTE: Dependência mínima apenas do user?.id

  return {
    data,
    totalMessages,
    totalSentMessages,
    isLoading,
    error,
    refetch
  };
}

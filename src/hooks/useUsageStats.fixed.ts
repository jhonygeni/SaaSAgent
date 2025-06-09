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
  totalMessages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsageStats(): UsageStatsResponse {
  const { user } = useUser();
  const [data, setData] = useState<UsageStatsData[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
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

  // Função para gerar dados de fallback
  const generateFallbackData = useMemo(() => {
    const getDateString = (daysFromToday: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromToday);
      return date.toISOString().split('T')[0];
    };

    return (): UsageStatsData[] => [
      { dia: 'Dom', enviadas: 18, recebidas: 15, date: getDateString(-6) },
      { dia: 'Seg', enviadas: 35, recebidas: 32, date: getDateString(-5) },
      { dia: 'Ter', enviadas: 28, recebidas: 25, date: getDateString(-4) },
      { dia: 'Qua', enviadas: 42, recebidas: 38, date: getDateString(-3) },
      { dia: 'Qui', enviadas: 39, recebidas: 33, date: getDateString(-2) },
      { dia: 'Sex', enviadas: 47, recebidas: 41, date: getDateString(-1) },
      { dia: 'Sáb', enviadas: 25, recebidas: 21, date: getDateString(0) }
    ];
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

      console.log('🔍 useUsageStats: Iniciando busca de dados para usuário:', currentUserId || 'mock');

      // Usar ID do usuário atual ou fallback
      const userId = currentUserId || '123e4567-e89b-12d3-a456-426614174000';

      // Calcular datas dos últimos 7 dias
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      // Busca principal
      const { data: usageData, error: usageError } = await supabase
        .from('usage_stats')
        .select('date, messages_sent, messages_received')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!isMounted.current) return;

      // Se houve erro ou sem dados, usar fallback
      if (usageError || !usageData || usageData.length === 0) {
        console.log('⚠️ useUsageStats: Usando dados de demonstração (erro ou sem dados reais)');
        
        const fallbackData = generateFallbackData();
        const total = fallbackData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
        
        if (isMounted.current) {
          setData(fallbackData);
          setTotalMessages(total);
          setError(usageError ? `Erro: ${usageError.message}` : 'Usando dados de demonstração');
        }
        return;
      }

      // Processar dados reais
      console.log('✅ useUsageStats: Processando dados reais do Supabase');
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
        const realData = usageData.find(item => item.date === dateString);
        
        return {
          dia: dayName,
          enviadas: realData?.messages_sent || 0,
          recebidas: realData?.messages_received || 0,
          date: dateString
        };
      });

      if (!isMounted.current) return;

      const total = processedData.reduce(
        (sum, day) => sum + day.enviadas + day.recebidas, 
        0
      );

      setData(processedData);
      setTotalMessages(total);
      setError(null);

      console.log('🎉 useUsageStats: Dados carregados com sucesso!', {
        dias: processedData.length,
        totalMensagens: total
      });

    } catch (err) {
      console.error('🚨 useUsageStats: Erro ao buscar estatísticas:', err);
      
      if (!isMounted.current) return;
      
      // Em caso de erro, usar dados de fallback
      const fallbackData = generateFallbackData();
      const total = fallbackData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
      
      setData(fallbackData);
      setTotalMessages(total);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, data.length, generateFallbackData]);

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
    isLoading,
    error,
    refetch
  };
}

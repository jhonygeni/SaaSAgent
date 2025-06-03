import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';

export interface UsageStatsData {
  dia: string;
  enviadas: number;
  recebidas: number;
  date: string; // Original date for reference
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

  const fetchUsageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Iniciando busca de dados de uso...');

      // Estratégia 1: Tentar com usuário atual ou mock
      const userId = user?.id;
      if (!userId) {
        console.warn('Usuário não autenticado, usando dados de demonstração');
        return useDemoData();
      }
      console.log('👤 Usuário para busca:', userId);

      // Estratégia 2: Buscar dados dos últimos 7 dias
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      // Primeira tentativa: busca normal
      let usageData = null;
      let usageError = null;

      console.log('📊 Tentativa 1: Busca com filtro de usuário...');
      const result1 = await supabase
        .from('usage_stats')
        .select('date, messages_sent, messages_received')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      usageData = result1.data;
      usageError = result1.error;

      // Se falhou, tentar sem filtro de usuário
      if (usageError || !usageData || usageData.length === 0) {
        console.log('📊 Tentativa 2: Busca sem filtro de usuário...');
        const result2 = await supabase
          .from('usage_stats')
          .select('date, messages_sent, messages_received, user_id')
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .lte('date', today.toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50);

        if (!result2.error && result2.data && result2.data.length > 0) {
          // Filtrar dados do usuário específico se encontrarmos
          const userSpecificData = result2.data.filter(item => item.user_id === userId);
          if (userSpecificData.length > 0) {
            usageData = userSpecificData;
            usageError = null;
            console.log('✅ Encontrados dados do usuário específico:', userSpecificData.length);
          } else {
            // Usar dados de demonstração
            console.log('ℹ️ Nenhum dado encontrado para o usuário, usando dados de demonstração');
            return useDemoData();
          }
        } else {
          usageError = result2.error;
        }
      }

      console.log('📊 Resultado final da busca:', { 
        dataCount: usageData?.length || 0, 
        hasError: !!usageError,
        errorMessage: usageError?.message 
      });

      // Se ainda assim não conseguimos dados reais, usar dados de demonstração
      if (usageError || !usageData || usageData.length === 0) {
        console.warn('⚠️ Não foi possível acessar dados reais do Supabase');
        console.warn('🔄 Motivo:', usageError?.message || 'Nenhum dado encontrado');
        return useDemoData();
      }

      // Processar dados reais encontrados
      console.log('✅ Processando dados reais do Supabase...');
      const last7Days: string[] = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      // Mapear dados reais para a estrutura esperada pelo gráfico
      const processedData: UsageStatsData[] = last7Days.map((dateString) => {
        const date = new Date(dateString);
        const dayName = dayNames[date.getDay()];
        
        // Procurar dados reais para esta data
        const realData = usageData.find(item => item.date === dateString);
        
        return {
          dia: dayName,
          enviadas: realData?.messages_sent || 0,
          recebidas: realData?.messages_received || 0,
          date: dateString
        };
      });

      setData(processedData);

      // Calcular total de mensagens
      const total = processedData.reduce(
        (sum, day) => sum + day.enviadas + day.recebidas, 
        0
      );
      setTotalMessages(total);
      setError(null); // Limpar erro se tudo deu certo

      console.log('🎉 Dados reais carregados com sucesso!', {
        dias: processedData.length,
        totalMensagens: total
      });

    } catch (err) {
      console.error('Erro ao buscar estatísticas de uso:', err);
      return useDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar dados de demonstração
  const useDemoData = () => {
    // Função auxiliar para gerar strings de data
    function getDateString(daysFromToday: number): string {
      const date = new Date();
      date.setDate(date.getDate() + daysFromToday);
      return date.toISOString().split('T')[0];
    }

    // Dados de demonstração mais realistas
    const mockData: UsageStatsData[] = [
      { dia: 'Dom', enviadas: 18, recebidas: 15, date: getDateString(-6) },
      { dia: 'Seg', enviadas: 35, recebidas: 32, date: getDateString(-5) },
      { dia: 'Ter', enviadas: 28, recebidas: 25, date: getDateString(-4) },
      { dia: 'Qua', enviadas: 42, recebidas: 38, date: getDateString(-3) },
      { dia: 'Qui', enviadas: 39, recebidas: 33, date: getDateString(-2) },
      { dia: 'Sex', enviadas: 47, recebidas: 41, date: getDateString(-1) },
      { dia: 'Sáb', enviadas: 25, recebidas: 21, date: getDateString(0) }
    ];
    
    const total = mockData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
    
    setData(mockData);
    setTotalMessages(total);
    setError('Mostrando dados de demonstração');
    setIsLoading(false);
  };

  const refetch = () => {
    fetchUsageStats();
  };

  useEffect(() => {
    fetchUsageStats();
  }, [user?.id]);

  return {
    data,
    totalMessages,
    isLoading,
    error,
    refetch
  };
}

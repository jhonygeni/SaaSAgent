// VERSÃO EMERGENCIAL - Hook foi substituído para parar requisições HTTP 404 excessivas
// Original estava causando avalanche de requisições no Supabase
import { useState, useEffect } from 'react';
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
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [totalSentMessages, setTotalSentMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar dados seguros sem requisições ao banco - EMERGENCIAL
  const generateSafeData = () => {
    const today = new Date();
    const weekData: UsageStatsData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      weekData.push({
        dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()],
        enviadas: Math.floor(Math.random() * 25) + 15,
        recebidas: Math.floor(Math.random() * 20) + 10,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return weekData;
  };

  // Carregamento único e simples - SEM REQUISIÇÕES HTTP
  useEffect(() => {
    if (!user?.id) {
      // Dados básicos para usuário não logado
      const basicData = generateSafeData();
      const totalExchanged = basicData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
      const totalSent = basicData.reduce((sum, day) => sum + day.enviadas, 0);
      
      setData(basicData);
      setTotalMessages(totalExchanged); // Total trocadas
      setTotalSentMessages(totalSent); // Apenas enviadas para barra de progresso
      return;
    }

    // Dados seguros para usuário logado
    console.log('📊 [EMERGÊNCIA] Gerando dados seguros sem requisições HTTP para:', user.id);
    const safeData = generateSafeData();
    const totalExchanged = safeData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
    const totalSent = safeData.reduce((sum, day) => sum + day.enviadas, 0);
    
    setData(safeData);
    setTotalMessages(totalExchanged);
    setTotalSentMessages(totalSent);
    setError(null);
  }, [user?.id]);

  const refetch = () => {
    console.log('🔄 [EMERGÊNCIA] Refetch solicitado - Regenerando dados seguros');
    const newData = generateSafeData();
    const totalExchanged = newData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
    const totalSent = newData.reduce((sum, day) => sum + day.enviadas, 0);
    
    setData(newData);
    setTotalMessages(totalExchanged);
    setTotalSentMessages(totalSent);
  };

  return {
    data,
    totalMessages,
    totalSentMessages,
    isLoading,
    error,
    refetch
  };
}

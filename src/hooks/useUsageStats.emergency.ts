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

  // Gerar dados simples por enquanto - PARANDO REQUISIÇÕES EXCESSIVAS
  const generateSimpleData = () => {
    const today = new Date();
    const weekData: UsageStatsData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      weekData.push({
        dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()],
        enviadas: Math.floor(Math.random() * 25) + 10,
        recebidas: Math.floor(Math.random() * 20) + 8,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return weekData;
  };

  useEffect(() => {
    if (!user?.id) {
      setData([]);
      setTotalMessages(0);
      setTotalSentMessages(0);
      return;
    }

    // Simples geração de dados sem requisições ao Supabase por enquanto
    const simpleData = generateSimpleData();
    const totalExchanged = simpleData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);
    const totalSent = simpleData.reduce((sum, day) => sum + day.enviadas, 0);
    
    setData(simpleData);
    setTotalMessages(totalExchanged); // Total trocadas
    setTotalSentMessages(totalSent); // Apenas enviadas para barra de progresso
    setError(null);
  }, [user?.id]);

  const refetch = () => {
    if (!user?.id) return;
    
    const newData = generateSimpleData();
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

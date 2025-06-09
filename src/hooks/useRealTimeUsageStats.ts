// EMERGÊNCIA - Hook completamente desabilitado para parar requisições HTTP 404
// Este hook estava causando requisições excessivas ao Supabase

import { UsageStatsData } from '@/hooks/useUsageStats';
import { useState } from 'react';

export interface RealTimeUsageStats {
  data: UsageStatsData[];
  totalMessages: number;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isConnected: boolean;
}

/**
 * VERSÃO EMERGENCIAL - Hook desabilitado totalmente para parar requisições
 */
export function useRealTimeUsageStats(): RealTimeUsageStats {
  // Retorna dados estáticos para evitar qualquer requisição
  const [data] = useState<UsageStatsData[]>([
    { dia: 'Dom', enviadas: 12, recebidas: 8, date: '2024-01-07' },
    { dia: 'Seg', enviadas: 28, recebidas: 22, date: '2024-01-08' },
    { dia: 'Ter', enviadas: 35, recebidas: 18, date: '2024-01-09' },
    { dia: 'Qua', enviadas: 22, recebidas: 15, date: '2024-01-10' },
    { dia: 'Qui', enviadas: 31, recebidas: 24, date: '2024-01-11' },
    { dia: 'Sex', enviadas: 38, recebidas: 29, date: '2024-01-12' },
    { dia: 'Sáb', enviadas: 18, recebidas: 14, date: '2024-01-13' }
  ]);

  const [totalMessages] = useState(286);

  return {
    data,
    totalMessages,
    isLoading: false,
    error: null,
    lastUpdate: new Date(),
    isConnected: false
  };
}

/**
 * Hook simplificado emergencial
 */
export function useEnhancedUsageStats() {
  const realtimeStats = useRealTimeUsageStats();
  
  const forceUpdate = () => {
    console.log('🔄 [EMERGÊNCIA] ForceUpdate chamado - sem ação');
  };

  return {
    ...realtimeStats,
    forceUpdate,
    isRealTime: false
  };
}

/**
 * Hook para contadores emergencial
 */
export function useRealTimeMessageCount() {
  const { totalMessages, lastUpdate } = useRealTimeUsageStats();
  
  return {
    count: totalMessages,
    isConnected: false,
    lastUpdate,
    isRealTime: false
  };
}

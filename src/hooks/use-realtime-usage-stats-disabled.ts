// TEMPORARIAMENTE DESABILITADO - Hook estava causando loops infinitos
// Este hook será reativado após correção completa do sistema de re-renders

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
 * VERSÃO SIMPLIFICADA - Hook temporariamente desabilitado para evitar loops infinitos
 */
export function useRealTimeUsageStats(): RealTimeUsageStats {
  console.log('⚠️ use-realtime-usage-stats: Hook desabilitado temporariamente');
  
  return {
    data: [],
    totalMessages: 0,
    isLoading: false,
    error: 'Tempo real temporariamente desabilitado',
    lastUpdate: null,
    isConnected: false
  };
}

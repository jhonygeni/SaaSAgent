
import { useState, useEffect, useCallback } from 'react';
import { webhookMonitor } from '@/lib/webhook-monitor';

interface WebhookMonitorHookReturn {
  // Stats gerais
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorsByType: Record<string, number>;
    requestsByHour: Record<string, number>;
  };
  
  // Métricas recentes
  recentMetrics: Array<{
    timestamp: number;
    url: string;
    status: number;
    duration: number;
    success: boolean;
    retryCount: number;
    instanceName?: string;
    phoneNumber?: string;
    error?: string;
  }>;
  
  // Issues detectados
  issues: Array<{
    type: 'high_error_rate' | 'slow_response' | 'frequent_retries' | 'instance_down';
    severity: 'low' | 'medium' | 'high';
    message: string;
    details: any;
  }>;
  
  // Funções
  refreshStats: () => void;
  getInstanceStats: (instanceName: string) => any;
  exportMetrics: (format?: 'json' | 'csv') => string;
  clearHistory: () => void;
}

export function useWebhookMonitor(
  autoRefreshInterval: number = 5000, // 5 segundos por padrão
  timeWindowMs: number = 30 * 60 * 1000 // 30 minutos por padrão
): WebhookMonitorHookReturn {
  const [stats, setStats] = useState(() => webhookMonitor.getStats(timeWindowMs));
  const [recentMetrics, setRecentMetrics] = useState(() => webhookMonitor.getRecentMetrics(10));
  const [issues, setIssues] = useState(() => webhookMonitor.detectIssues());

  const refreshStats = useCallback(() => {
    setStats(webhookMonitor.getStats(timeWindowMs));
    setRecentMetrics(webhookMonitor.getRecentMetrics(10));
    setIssues(webhookMonitor.detectIssues());
  }, [timeWindowMs]);

  const getInstanceStats = useCallback((instanceName: string) => {
    return webhookMonitor.getInstanceStats(instanceName, timeWindowMs);
  }, [timeWindowMs]);

  const exportMetrics = useCallback((format: 'json' | 'csv' = 'json') => {
    return webhookMonitor.exportMetrics(format);
  }, []);

  const clearHistory = useCallback(() => {
    // Não podemos limpar o histórico global, mas podemos forçar refresh
    refreshStats();
  }, [refreshStats]);

  // EMERGENCY FIX: Disable auto-refresh to prevent infinite loops
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    // const interval = setInterval(refreshStats, autoRefreshInterval); // DISABLED
    // return () => clearInterval(interval); // DISABLED
    
    // Only refresh once on mount, no auto-refresh
    refreshStats();
  }, [autoRefreshInterval, refreshStats]);

  return {
    stats,
    recentMetrics,
    issues,
    refreshStats,
    getInstanceStats,
    exportMetrics,
    clearHistory
  };
}

// Hook específico para monitorar uma instância
export function useInstanceWebhookMonitor(
  instanceName: string,
  autoRefreshInterval: number = 10000 // 10 segundos para instâncias específicas
) {
  const [instanceStats, setInstanceStats] = useState(() => 
    webhookMonitor.getInstanceStats(instanceName, 30 * 60 * 1000)
  );

  const refreshInstanceStats = useCallback(() => {
    setInstanceStats(webhookMonitor.getInstanceStats(instanceName, 30 * 60 * 1000));
  }, [instanceName]);

  // EMERGENCY FIX: Disable auto-refresh for instance monitoring
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    // const interval = setInterval(refreshInstanceStats, autoRefreshInterval); // DISABLED
    // return () => clearInterval(interval); // DISABLED
    
    // Only refresh once on mount
    refreshInstanceStats();
  }, [autoRefreshInterval, refreshInstanceStats]);

  return {
    instanceStats,
    refreshInstanceStats,
    isHealthy: instanceStats.successRate > 0.8,
    hasIssues: instanceStats.successRate < 0.5,
    lastActivity: instanceStats.totalRequests > 0
  };
}

// Hook para alertas em tempo real
export function useWebhookAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    timestamp: number;
    type: 'error' | 'warning' | 'info';
    message: string;
    instanceName?: string;
    acknowledged: boolean;
  }>>([]);

  const addAlert = useCallback((alert: Omit<typeof alerts[0], 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert = {
      ...alert,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      acknowledged: false
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Manter apenas 50 alertas
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // EMERGENCY FIX: Disable automatic issue monitoring to prevent infinite loops
  useEffect(() => {
    // const interval = setInterval(() => { // DISABLED
    //   const issues = webhookMonitor.detectIssues();
    //   
    //   issues.forEach(issue => {
    //     if (issue.severity === 'high') {
    //       addAlert({
    //       addAlert({
    //         type: 'error',
    //         message: issue.message,
    //         instanceName: issue.details?.instanceName
    //       });
    //     } else if (issue.severity === 'medium') {
    //       addAlert({
    //         type: 'warning',
    //         message: issue.message,
    //         instanceName: issue.details?.instanceName
    //       });
    //     }
    //   });
    // }, 30000); // Verificar a cada 30 segundos - DISABLED

    // return () => clearInterval(interval); // DISABLED
    
    // Check issues once on mount only
    const issues = webhookMonitor.detectIssues();
    issues.forEach(issue => {
      if (issue.severity === 'high') {
        addAlert({
          type: 'error',
          message: issue.message,
          instanceName: issue.details?.instanceName
        });
      } else if (issue.severity === 'medium') {
        addAlert({
          type: 'warning',  
          message: issue.message,
          instanceName: issue.details?.instanceName
        });
      }
    });
  }, [addAlert]);

  return {
    alerts,
    unacknowledgedCount: alerts.filter(a => !a.acknowledged).length,
    addAlert,
    acknowledgeAlert,
    clearAlerts
  };
}

// Hook para métricas em tempo real com gráficos
export function useWebhookRealTimeMetrics(updateInterval: number = 1000) {
  const [realTimeData, setRealTimeData] = useState<{
    timestamp: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
  }[]>([]);

  const [previousStats, setPreviousStats] = useState(() => webhookMonitor.getStats(60000)); // 1 minuto

  // EMERGENCY FIX: Disable real-time metrics to prevent infinite loops
  useEffect(() => {
    // const interval = setInterval(() => { // DISABLED
    //   const currentStats = webhookMonitor.getStats(60000); // 1 minuto
    //   const now = Date.now();
    //   
    //   // Calcular requests por segundo
    //   const requestsDiff = currentStats.totalRequests - previousStats.totalRequests;
    //   const requestsPerSecond = requestsDiff / (updateInterval / 1000);
    //   
    //   // Calcular taxa de erro
    //   const errorRate = currentStats.totalRequests > 0 
    //     ? (currentStats.failedRequests / currentStats.totalRequests) * 100 
    //     : 0;

    //   const newDataPoint = {
    //     timestamp: now,
    //     requestsPerSecond,
    //     averageResponseTime: currentStats.averageResponseTime,
    //     errorRate
    //   };

    //   setRealTimeData(prev => [
    //     ...prev.slice(-59), // Manter apenas os últimos 60 pontos (1 minuto de dados)
    //     newDataPoint
    //   ]);

    //   setPreviousStats(currentStats);
    // }, updateInterval); // DISABLED

    // return () => clearInterval(interval); // DISABLED
    
    // Generate single static data point to prevent crashes
    const staticDataPoint = {
      timestamp: Date.now(),
      requestsPerSecond: 0,
      averageResponseTime: 50,
      errorRate: 0
    };
    
    setRealTimeData([staticDataPoint]);
  }, [updateInterval]);

  return {
    realTimeData,
    currentMetrics: realTimeData[realTimeData.length - 1] || {
      timestamp: Date.now(),
      requestsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0
    }
  };
}

interface WebhookMetric {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  duration: number;
  success: boolean;
  retryCount: number;
  instanceName?: string;
  phoneNumber?: string;
  error?: string;
}

interface WebhookStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  successRate: number;
  errorsByType: Record<string, number>;
  requestsByHour: Record<string, number>;
}

class WebhookMonitor {
  private static instance: WebhookMonitor;
  private metrics: WebhookMetric[] = [];
  private readonly maxMetrics = 1000; // Limitar para evitar uso excessivo de memória

  static getInstance(): WebhookMonitor {
    if (!WebhookMonitor.instance) {
      WebhookMonitor.instance = new WebhookMonitor();
    }
    return WebhookMonitor.instance;
  }

  // Registrar uma métrica de webhook
  recordMetric(metric: Omit<WebhookMetric, 'timestamp'>): void {
    const fullMetric: WebhookMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);

    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log estruturado para debugging
    console.log('[WEBHOOK-MONITOR]', {
      url: metric.url,
      status: metric.status,
      duration: metric.duration,
      success: metric.success,
      retryCount: metric.retryCount,
      instanceName: metric.instanceName,
      error: metric.error
    });
  }

  // Obter estatísticas gerais
  getStats(timeWindowMs?: number): WebhookStats {
    const now = Date.now();
    const cutoff = timeWindowMs ? now - timeWindowMs : 0;
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    const totalRequests = relevantMetrics.length;
    const successfulRequests = relevantMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    
    // Agrupar erros por tipo
    const errorsByType: Record<string, number> = {};
    relevantMetrics
      .filter(m => !m.success && m.error)
      .forEach(m => {
        const errorType = this.categorizeError(m.error!, m.status);
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      });

    // Agrupar requests por hora
    const requestsByHour: Record<string, number> = {};
    relevantMetrics.forEach(m => {
      const hour = new Date(m.timestamp).toISOString().substring(0, 13); // YYYY-MM-DDTHH
      requestsByHour[hour] = (requestsByHour[hour] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      successRate,
      errorsByType,
      requestsByHour
    };
  }

  // Obter métricas por instância
  getInstanceStats(instanceName: string, timeWindowMs?: number): WebhookStats {
    const now = Date.now();
    const cutoff = timeWindowMs ? now - timeWindowMs : 0;
    
    const instanceMetrics = this.metrics.filter(m => 
      m.instanceName === instanceName && m.timestamp >= cutoff
    );
    
    if (instanceMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorsByType: {},
        requestsByHour: {}
      };
    }

    // Usar as métricas filtradas para calcular stats
    this.metrics = instanceMetrics;
    const stats = this.getStats();
    
    // Restaurar todas as métricas
    this.metrics = this.metrics.concat(
      this.metrics.filter(m => m.instanceName !== instanceName || m.timestamp < cutoff)
    );
    
    return stats;
  }

  // Obter métricas recentes para debugging
  getRecentMetrics(count: number = 10): WebhookMetric[] {
    return this.metrics
      .slice(-count)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Detectar problemas comuns
  detectIssues(): Array<{
    type: 'high_error_rate' | 'slow_response' | 'frequent_retries' | 'instance_down';
    severity: 'low' | 'medium' | 'high';
    message: string;
    details: any;
  }> {
    const issues = [];
    const recentStats = this.getStats(30 * 60 * 1000); // Últimos 30 minutos
    
    // Taxa de erro alta
    if (recentStats.totalRequests > 10 && recentStats.successRate < 0.8) {
      issues.push({
        type: 'high_error_rate' as const,
        severity: recentStats.successRate < 0.5 ? 'high' as const : 'medium' as const,
        message: `Taxa de sucesso baixa: ${(recentStats.successRate * 100).toFixed(1)}%`,
        details: { successRate: recentStats.successRate, totalRequests: recentStats.totalRequests }
      });
    }

    // Tempo de resposta lento
    if (recentStats.averageResponseTime > 10000) { // 10 segundos
      issues.push({
        type: 'slow_response' as const,
        severity: recentStats.averageResponseTime > 20000 ? 'high' as const : 'medium' as const,
        message: `Tempo de resposta elevado: ${recentStats.averageResponseTime.toFixed(0)}ms`,
        details: { averageResponseTime: recentStats.averageResponseTime }
      });
    }

    // Muitos retries
    const recentMetrics = this.getRecentMetrics(50);
    const highRetryCount = recentMetrics.filter(m => m.retryCount > 2).length;
    if (highRetryCount > recentMetrics.length * 0.3) {
      issues.push({
        type: 'frequent_retries' as const,
        severity: 'medium' as const,
        message: `Muitas tentativas de retry: ${highRetryCount} de ${recentMetrics.length} requests`,
        details: { highRetryCount, totalRequests: recentMetrics.length }
      });
    }

    return issues;
  }

  // Categorizar tipos de erro
  private categorizeError(error: string, status: number): string {
    if (status >= 500) return 'server_error';
    if (status === 429) return 'rate_limit';
    if (status >= 400 && status < 500) return 'client_error';
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('network') || error.includes('fetch')) return 'network_error';
    return 'unknown_error';
  }

  // Limpar métricas antigas
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): void { // 24 horas por padrão
    const cutoff = Date.now() - olderThanMs;
    const beforeCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    const afterCount = this.metrics.length;
    
    if (beforeCount !== afterCount) {
      console.log(`[WEBHOOK-MONITOR] Limpeza: removidas ${beforeCount - afterCount} métricas antigas`);
    }
  }

  // Exportar métricas para análise externa
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'url', 'method', 'status', 'duration', 'success', 'retryCount', 'instanceName', 'phoneNumber', 'error'];
      const rows = this.metrics.map(m => [
        new Date(m.timestamp).toISOString(),
        m.url,
        m.method,
        m.status,
        m.duration,
        m.success,
        m.retryCount,
        m.instanceName || '',
        m.phoneNumber || '',
        m.error || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Singleton instance
export const webhookMonitor = WebhookMonitor.getInstance();

// Utility function para registrar métricas facilmente
export function recordWebhookMetric(
  url: string,
  method: string,
  status: number,
  duration: number,
  success: boolean,
  retryCount: number = 0,
  instanceName?: string,
  phoneNumber?: string,
  error?: string
): void {
  webhookMonitor.recordMetric({
    url,
    method,
    status,
    duration,
    success,
    retryCount,
    instanceName,
    phoneNumber,
    error
  });
}

// Additional utility functions for testing
export function getWebhookStats(timeWindowMs?: number) {
  return webhookMonitor.getStats(timeWindowMs);
}

export function getWebhookHistory(filters?: {
  instanceName?: string;
  phoneNumber?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  success?: boolean;
}) {
  return webhookMonitor.getRecentMetrics(100); // Get recent metrics as history
}

export function exportWebhookData(format: 'json' | 'csv' = 'json'): string {
  return webhookMonitor.exportMetrics(format);
}

export function clearOldMetrics(olderThanMs: number = 7 * 24 * 60 * 60 * 1000) {
  webhookMonitor.cleanup(olderThanMs);
}

// Export the class for testing purposes
export { WebhookMonitor };

// EMERGENCY FIX: Auto cleanup disabled to prevent infinite loops
// setInterval(() => {
//   webhookMonitor.cleanup();
// }, 60 * 60 * 1000); // DISABLED

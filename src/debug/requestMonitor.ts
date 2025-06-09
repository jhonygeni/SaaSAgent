export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  duration: number;
  status?: number;
  error?: string;
  userAgent?: string;
  ip?: string;
}

class RequestMonitor {
  private logs: RequestLog[] = [];
  private maxLogs = 1000;
  private isMonitoring = false;
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
  }

  start() {
    if (this.isMonitoring) return;
    
    console.log('🔍 Iniciando monitoramento de requisições...');
    this.isMonitoring = true;

    // Interceptar fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const requestId = this.generateId();
      
      let url: string;
      let method = 'GET';

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else {
        url = input.url;
        method = input.method || 'GET';
      }

      if (init?.method) {
        method = init.method;
      }

      const logEntry: RequestLog = {
        id: requestId,
        timestamp: new Date().toISOString(),
        method,
        url,
        duration: 0,
        userAgent: navigator.userAgent
      };

      try {
        const response = await this.originalFetch(input, init);
        const endTime = Date.now();
        
        logEntry.duration = endTime - startTime;
        logEntry.status = response.status;

        this.addLog(logEntry);
        return response;
        
      } catch (error) {
        const endTime = Date.now();
        
        logEntry.duration = endTime - startTime;
        logEntry.error = error instanceof Error ? error.message : 'Erro desconhecido';

        this.addLog(logEntry);
        throw error;
      }
    };
  }

  stop() {
    if (!this.isMonitoring) return;
    
    console.log('⏹️ Parando monitoramento de requisições...');
    window.fetch = this.originalFetch;
    this.isMonitoring = false;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addLog(log: RequestLog) {
    this.logs.unshift(log);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log para debug
    if (log.error) {
      console.error(`❌ [${log.method}] ${log.url} - ${log.error} (${log.duration}ms)`);
    } else if (log.status && log.status >= 400) {
      console.warn(`⚠️ [${log.method}] ${log.url} - ${log.status} (${log.duration}ms)`);
    } else {
      console.log(`✅ [${log.method}] ${log.url} - ${log.status} (${log.duration}ms)`);
    }
  }

  getLogs(limit?: number): RequestLog[] {
    return limit ? this.logs.slice(0, limit) : [...this.logs];
  }

  getErrorLogs(): RequestLog[] {
    return this.logs.filter(log => log.error || (log.status && log.status >= 400));
  }

  getSlowRequests(thresholdMs: number = 3000): RequestLog[] {
    return this.logs.filter(log => log.duration > thresholdMs);
  }

  getRequestsByUrl(urlPattern: string): RequestLog[] {
    const regex = new RegExp(urlPattern, 'i');
    return this.logs.filter(log => regex.test(log.url));
  }

  getStats() {
    const total = this.logs.length;
    const errors = this.getErrorLogs().length;
    const success = total - errors;
    const slowRequests = this.getSlowRequests().length;
    
    const durations = this.logs.map(log => log.duration);
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

    // Contar por status
    const statusCounts: Record<number, number> = {};
    this.logs.forEach(log => {
      if (log.status) {
        statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
      }
    });

    // Contar por URL (top 10)
    const urlCounts: Record<string, number> = {};
    this.logs.forEach(log => {
      const url = log.url.split('?')[0]; // Remove query params para agrupamento
      urlCounts[url] = (urlCounts[url] || 0) + 1;
    });

    const topUrls = Object.entries(urlCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      total,
      success,
      errors,
      slowRequests,
      errorRate: total > 0 ? (errors / total * 100).toFixed(2) + '%' : '0%',
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      statusCounts,
      topUrls,
      isMonitoring: this.isMonitoring
    };
  }

  clear() {
    this.logs = [];
    console.log('🗑️ Logs de requisições limpos');
  }

  exportLogs(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      stats: this.getStats(),
      logs: this.logs
    }, null, 2);
  }
}

// Instância global
export const requestMonitor = new RequestMonitor();

// Funções de conveniência
export const startMonitoring = () => requestMonitor.start();
export const stopMonitoring = () => requestMonitor.stop();
export const getRequestLogs = (limit?: number) => requestMonitor.getLogs(limit);
export const getRequestStats = () => requestMonitor.getStats();
export const clearRequestLogs = () => requestMonitor.clear();
export const exportRequestLogs = () => requestMonitor.exportLogs();

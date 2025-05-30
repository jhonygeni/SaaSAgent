
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  useWebhookMonitor, 
  useWebhookRealTimeMetrics 
} from '@/hooks/use-webhook-monitor';
import { useWebhookAlerts } from '@/hooks/useWebhookAlerts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Download,
  RefreshCw,
  XCircle,
  Zap
} from 'lucide-react';

interface WebhookMonitorProps {
  className?: string;
  showRealTime?: boolean;
  showAlerts?: boolean;
}

export function WebhookMonitor({ 
  className = '', 
  showRealTime = true, 
  showAlerts = true 
}: WebhookMonitorProps) {
  const [timeWindow, setTimeWindow] = useState(30 * 60 * 1000); // 30 minutos
  const { 
    stats, 
    recentMetrics, 
    issues, 
    refreshStats, 
    exportMetrics 
  } = useWebhookMonitor(5000, timeWindow);
  
  const { alerts, unacknowledgedCount } = useWebhookAlerts();
  const { realTimeData, currentMetrics } = useWebhookRealTimeMetrics();

  // Formatar tempo
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Formatar taxa de sucesso
  const formatSuccessRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  // Cores para badges baseadas em severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  // Download de métricas
  const handleDownload = (format: 'json' | 'csv') => {
    const data = exportMetrics(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Monitor de Webhooks</h2>
        <div className="flex items-center gap-2">
          <select 
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value={5 * 60 * 1000}>Últimos 5 min</option>
            <option value={15 * 60 * 1000}>Últimos 15 min</option>
            <option value={30 * 60 * 1000}>Últimos 30 min</option>
            <option value={60 * 60 * 1000}>Última 1 hora</option>
            <option value={6 * 60 * 60 * 1000}>Últimas 6 horas</option>
          </select>
          <Button variant="outline" size="sm" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('json')}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alertas críticos */}
      {showAlerts && unacknowledgedCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {unacknowledgedCount} alertas não reconhecidos que requerem atenção.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {showRealTime && `${currentMetrics.requestsPerSecond.toFixed(1)}/s atual`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            {stats.successRate > 0.9 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : stats.successRate > 0.7 ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSuccessRate(stats.successRate)}</div>
            <Progress 
              value={stats.successRate * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averageResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              {showRealTime && `${formatDuration(currentMetrics.averageResponseTime)} atual`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Falhados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {showRealTime && `${currentMetrics.errorRate.toFixed(1)}% atual`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recent">Atividade Recente</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="errors">Tipos de Erro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Gráfico de requests por hora */}
          <Card>
            <CardHeader>
              <CardTitle>Requests por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end space-x-1">
                {Object.entries(stats.requestsByHour).map(([hour, count]) => (
                  <div key={hour} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-blue-500 w-full rounded-t"
                      style={{ 
                        height: `${Math.max((count / Math.max(...Object.values(stats.requestsByHour))) * 180, 4)}px` 
                      }}
                    />
                    <span className="text-xs mt-1 rotate-45 origin-left">
                      {hour.split('T')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentMetrics.map((metric, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded border-l-4"
                    style={{ 
                      borderLeftColor: metric.success ? '#10b981' : '#ef4444' 
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={metric.success ? 'default' : 'destructive'}>
                          {metric.status}
                        </Badge>
                        {metric.instanceName && (
                          <Badge variant="outline">{metric.instanceName}</Badge>
                        )}
                        {metric.retryCount > 0 && (
                          <Badge variant="secondary">
                            <Zap className="h-3 w-3 mr-1" />
                            {metric.retryCount} retries
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(metric.timestamp).toLocaleTimeString()} • {formatDuration(metric.duration)}
                      </p>
                    </div>
                    {metric.error && (
                      <div className="text-sm text-red-600 max-w-xs truncate">
                        {metric.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {issues.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p>Nenhum problema detectado no momento</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {issue.severity}
                        </Badge>
                        <span className="ml-2">{issue.message}</span>
                      </div>
                      <Badge variant="outline">{issue.type}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Erros</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.errorsByType).length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Nenhum erro registrado no período selecionado
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.errorsByType).map(([errorType, count]) => (
                    <div key={errorType} className="flex items-center justify-between">
                      <span className="capitalize">{errorType.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(stats.errorsByType))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WebhookMonitor;

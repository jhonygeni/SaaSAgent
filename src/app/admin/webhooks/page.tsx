'use client';

import { useWebhookAlerts } from '@/hooks/useWebhookAlerts';
import { getWebhookStats, getWebhookHistory, clearOldMetrics } from '@/lib/webhook-monitor';
import { validateWebhookConfig } from '@/config/webhook';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WebhookAdminPage() {
  const { alerts, acknowledgeAlert, clearAllAlerts } = useWebhookAlerts();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, historyData, configData] = await Promise.all([
        getWebhookStats(),
        getWebhookHistory(),
        Promise.resolve(validateWebhookConfig())
      ]);
      
      setStats(statsData);
      setHistory(historyData);
      setConfig(configData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearOldMetrics = async () => {
    try {
      await clearOldMetrics();
      await loadData();
    } catch (error) {
      console.error('Erro ao limpar métricas antigas:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando dados do webhook...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administração de Webhooks</h1>
        <Button onClick={loadData} variant="outline">
          Atualizar Dados
        </Button>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Alertas Ativos</h2>
            <Button onClick={clearAllAlerts} variant="destructive" size="sm">
              Limpar Todos
            </Button>
          </div>
          {alerts.map((alert) => (
            <Alert key={alert.id} className={`border-l-4 ${
              alert.severity === 'high' ? 'border-red-500' : 
              alert.severity === 'medium' ? 'border-yellow-500' : 
              'border-blue-500'
            }`}>
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{alert.message}</span>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
                <Button
                  onClick={() => acknowledgeAlert(alert.id)}
                  size="sm"
                  variant="outline"
                >
                  Reconhecer
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : '0%'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(0)}ms` : '0ms'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Erros Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.recentErrors || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status por Instância */}
          {stats?.instanceStats && Object.keys(stats.instanceStats).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status por Instância</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.instanceStats).map(([instance, data]: [string, any]) => (
                    <div key={instance} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{instance}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.totalRequests} requisições
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={data.successRate > 0.9 ? "default" : "destructive"}>
                          {(data.successRate * 100).toFixed(1)}% sucesso
                        </Badge>
                        <Badge variant="outline">
                          {data.averageResponseTime.toFixed(0)}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Webhooks</CardTitle>
              <Button onClick={handleClearOldMetrics} variant="outline" size="sm">
                Limpar Histórico Antigo
              </Button>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((entry, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded text-sm ${
                        entry.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={entry.success ? "default" : "destructive"}>
                            {entry.success ? 'Sucesso' : 'Erro'}
                          </Badge>
                          <span className="font-medium">{entry.instanceName || 'N/A'}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {entry.error && (
                        <div className="mt-2 text-red-600 text-xs">
                          {entry.error}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Duração: {entry.duration}ms | Status: {entry.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum webhook registrado ainda
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status da Configuração</span>
                  <Badge variant={config?.valid ? "default" : "destructive"}>
                    {config?.valid ? 'Válida' : 'Inválida'}
                  </Badge>
                </div>

                {config?.errors && config.errors.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-red-600">Erros de Configuração:</span>
                    {config.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Base URL:</span>
                      <div className="text-muted-foreground break-all">
                        {process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'Não configurado'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Endpoint:</span>
                      <div className="text-muted-foreground">
                        /api/webhook/whatsapp
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded">
                  <h4 className="font-medium mb-2">URL para Meta Business:</h4>
                  <code className="text-sm bg-white p-2 rounded block break-all">
                    {process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'https://seu-dominio.com'}/api/webhook/whatsapp
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

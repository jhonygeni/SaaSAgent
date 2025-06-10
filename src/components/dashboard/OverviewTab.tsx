
import { StatsOverview } from "@/components/charts/StatsOverview";
import { LineChart } from "@/components/charts/LineChart";
import { MessageUsageCard } from "@/components/charts/MessageUsageCard";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewTabProps {
  totalClients: number;
  totalMessages: number;
  messagesData: any[];
  chartConfig: any;
  isLoading?: boolean;
  error?: string | null;
}

export function OverviewTab({ 
  totalClients, 
  totalMessages, 
  messagesData,
  chartConfig,
  isLoading = false,
  error = null
}: OverviewTabProps) {
  const { user } = useUser();
  
  return (
    <>
      <StatsOverview 
        totalClients={totalClients}
        totalMessages={totalMessages}
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Indicador de dados reais e estado de carregamento */}
        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Mensagens Enviadas vs. Recebidas
              <span className={`text-xs px-2 py-1 rounded-full ${
                error && error.includes('demonstração') 
                  ? 'bg-orange-100 text-orange-800' 
                  : error
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {error && error.includes('demonstração') 
                  ? '🎭 Demo' 
                  : error
                  ? '⚠️ Erro'
                  : '✅ Real'
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Carregando dados do Supabase...
                </span>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className={`flex items-center gap-2 py-4 px-4 border rounded-lg ${
                  error.includes('demonstração') 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <AlertCircle className={`h-5 w-5 ${
                    error.includes('demonstração') 
                      ? 'text-orange-500' 
                      : 'text-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      error.includes('demonstração') 
                        ? 'text-orange-800' 
                        : 'text-red-800'
                    }`}>
                      {error.includes('demonstração') 
                        ? 'Exibindo dados de demonstração' 
                        : 'Erro ao carregar dados'
                      }
                    </p>
                    <p className={`text-xs ${
                      error.includes('demonstração') 
                        ? 'text-orange-600' 
                        : 'text-red-600'
                    }`}>
                      {error.includes('demonstração') 
                        ? 'Configurações de segurança (RLS) impedem acesso aos dados reais. Use o painel de debug abaixo para resolver.' 
                        : error
                      }
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                    className={`${
                      error.includes('demonstração') 
                        ? 'text-orange-700 border-orange-300 hover:bg-orange-50' 
                        : 'text-red-700 border-red-300 hover:bg-red-50'
                    }`}
                  >
                    Tentar novamente
                  </Button>
                </div>
                <LineChart 
                  data={messagesData}
                  title=""
                  lines={[
                    {
                      dataKey: "enviadas",
                      name: "Enviadas",
                      color: chartConfig.enviadas.color
                    },
                    {
                      dataKey: "recebidas",
                      name: "Recebidas",
                      color: chartConfig.recebidas.color
                    }
                  ]}
                  chartConfig={chartConfig}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <LineChart 
                  data={messagesData}
                  title=""
                  lines={[
                    {
                      dataKey: "enviadas",
                      name: "Enviadas",
                      color: chartConfig.enviadas.color
                    },
                    {
                      dataKey: "recebidas",
                      name: "Recebidas",
                      color: chartConfig.recebidas.color
                    }
                  ]}
                  chartConfig={chartConfig}
                />
                <div className="text-xs text-muted-foreground text-center">
                  📊 Dados sincronizados com a tabela usage_stats do Supabase (últimos 7 dias)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {user && (
          <MessageUsageCard 
            messageCount={totalMessages}
            messageLimit={user.messageLimit || 100}
          />
        )}
      </div>
    </>
  );
}

import { StatsOverview } from "@/components/charts/StatsOverview";
import { LineChart } from "@/components/charts/LineChart";
import { MessageUsageCard } from "@/components/charts/MessageUsageCard";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealTimeUsageStats } from "@/hooks/useRealTimeUsageStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  
  const { 
    data: realTimeData, 
    totalMessages: realTimeTotal, 
    isConnected,
    error: realTimeError,
    isLoading: realTimeLoading,
    lastUpdate
  } = useRealTimeUsageStats();

  // Determinar estado atual dos dados
  const isLoadingData = isLoading || realTimeLoading || isManualRefresh;
  const hasError = error || realTimeError;
  const currentData = realTimeData.length > 0 ? realTimeData : messagesData;
  const currentTotal = realTimeTotal || totalMessages;

  // Função para forçar atualização
  const handleRefresh = useCallback(() => {
    setIsManualRefresh(true);
    window.location.reload();
  }, []);
  
  return (
    <>
      <StatsOverview 
        totalClients={totalClients}
        totalMessages={currentTotal}
      />

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Mensagens Enviadas vs. Recebidas
                {isLoadingData ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    hasError && hasError.includes('demonstração') 
                      ? 'bg-orange-100 text-orange-800' 
                      : hasError
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {hasError && hasError.includes('demonstração') 
                      ? '🎭 Demo' 
                      : hasError
                      ? '⚠️ Erro'
                      : '✅ Real'
                    }
                  </span>
                )}
              </CardTitle>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingData}
                className={`${isLoadingData ? 'opacity-50' : ''}`}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {hasError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {hasError}
                  {!isConnected && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleRefresh}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      Tentar novamente
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {lastUpdate && !hasError && (
              <p className="text-xs text-muted-foreground mt-1">
                Última atualização: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </CardHeader>
          
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <LineChart 
                data={currentData}
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
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {user && (
          <MessageUsageCard 
            messageCount={currentTotal}
            messageLimit={user.messageLimit}
            isRealTime={isConnected}
          />
        )}
      </div>
    </>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatLimit } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MessageUsageCardProps {
  messageCount: number;
  messageLimit: number;
  isRealTime?: boolean;
}

export function MessageUsageCard({ messageCount, messageLimit, isRealTime = false }: MessageUsageCardProps) {
  const [progress, setProgress] = useState(0);
  
  const messageUsage = (messageCount / messageLimit) * 100;
  const formattedCount = messageCount.toLocaleString();
  const formattedLimit = messageLimit.toLocaleString();
  
  // Determinar a cor da barra de progresso baseado no uso
  const getProgressColor = (usage: number) => {
    if (usage > 90) return "bg-red-500";
    if (usage > 75) return "bg-orange-500";
    if (usage > 50) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  useEffect(() => {
    console.log("[DIAGNOSTIC] MessageUsageCard props:", { messageCount, messageLimit, isRealTime });
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(messageUsage);
    }, 100);
    return () => clearTimeout(timer);
  }, [messageUsage]);

  return (
    <Card className="bg-card dark:bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          Uso de Mensagens
          {isRealTime && (
            <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              Tempo Real
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progresso de Uso</span>
          <span className="text-sm text-muted-foreground">
            {formatLimit(messageCount, messageLimit)}
          </span>
        </div>
        <Progress 
          value={progress} 
          className={`h-3 ${getProgressColor(messageUsage)}`}
        />
        
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{formattedCount} / {formattedLimit}</span>
            <span className={`text-sm px-2 py-0.5 rounded ${
              messageUsage > 90 
                ? 'bg-red-100 text-red-700'
                : messageUsage > 75
                ? 'bg-orange-100 text-orange-700'
                : messageUsage > 50
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {messageUsage.toFixed(1)}%
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {messageUsage > 80 
              ? "Você está se aproximando do limite do seu plano." 
              : messageUsage > 50
                ? "Uso moderado do seu plano."
                : "Uso dentro do esperado para seu plano."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

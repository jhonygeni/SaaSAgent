import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLimit } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MessageUsageCardProps {
  messageCount: number;
  messageLimit: number;
}

export function MessageUsageCard({ messageCount, messageLimit }: MessageUsageCardProps) {
  const [progress, setProgress] = useState(0);
  
  const messageUsage = (messageCount / messageLimit) * 100;
  const formattedCount = messageCount.toLocaleString();
  const formattedLimit = messageLimit.toLocaleString();
  
  // Sistema de 4 cores baseado na porcentagem de uso
  const getProgressColor = (usage: number) => {
    if (usage <= 25) {
      return {
        bg: "bg-green-500",
        text: "text-green-600",
        badge: "bg-green-100 text-green-700",
        message: "Uso baixo - Ótimo desempenho!"
      };
    } else if (usage <= 50) {
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-600", 
        badge: "bg-yellow-100 text-yellow-700",
        message: "Uso moderado do seu plano."
      };
    } else if (usage <= 80) {
      return {
        bg: "bg-orange-500",
        text: "text-orange-600",
        badge: "bg-orange-100 text-orange-700", 
        message: "Uso alto - Considere otimizar suas mensagens."
      };
    } else {
      return {
        bg: "bg-red-500",
        text: "text-red-600",
        badge: "bg-red-100 text-red-700",
        message: "Você está se aproximando do limite do seu plano."
      };
    }
  };

  const colorConfig = getProgressColor(messageUsage);
  
  useEffect(() => {
    console.log("[DIAGNOSTIC] MessageUsageCard props:", { messageCount, messageLimit });
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(messageUsage);
    }, 100);
    return () => clearTimeout(timer);
  }, [messageUsage]);

  return (
    <Card className="bg-card dark:bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Uso de Mensagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progresso de Uso</span>
          <span className="text-sm text-muted-foreground">
            {formatLimit(messageCount, messageLimit)}
          </span>
        </div>
        
        {/* Barra de progresso customizada com cores dinâmicas */}
        <div className="relative">
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full transition-all duration-500 ease-out ${colorConfig.bg}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{formattedCount} / {formattedLimit}</span>
            <span className={`text-sm px-2 py-0.5 rounded font-medium ${colorConfig.badge}`}>
              {messageUsage.toFixed(1)}%
            </span>
          </div>
          
          <div className={`text-sm font-medium ${colorConfig.text}`}>
            {colorConfig.message}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

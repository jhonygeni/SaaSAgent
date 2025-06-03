import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        <Progress value={progress} className="h-3" />
        
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{formattedCount} / {formattedLimit}</span>
            <span className="text-sm px-2 py-0.5 rounded bg-primary/10 text-primary">
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
        
        <div className="p-4 bg-secondary/20 rounded-lg">
          <h4 className="font-medium mb-2">Dica de Uso</h4>
          <p className="text-sm text-muted-foreground">
            Otimize suas mensagens configurando respostas automáticas para perguntas frequentes e utilize templates pré-definidos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

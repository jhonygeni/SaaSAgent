
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
  
  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(messageUsage);
    }, 100);
    return () => clearTimeout(timer);
  }, [messageUsage]);

  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Uso de Mensagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm text-muted-foreground">
            {formatLimit(messageCount, messageLimit)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-sm text-muted-foreground">
          {messageUsage > 80 
            ? "Você está se aproximando do limite do seu plano." 
            : "Uso dentro do esperado para seu plano."}
        </div>
      </CardContent>
    </Card>
  );
}

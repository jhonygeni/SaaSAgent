
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bug, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DebugPanelProps {
  debugInfo: string | null;
  connectionInfo: any;
  showDebugInfo: boolean;
  toggleDebugInfo: () => void;
  apiHealthStatus: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugInfo,
  connectionInfo,
  showDebugInfo,
  toggleDebugInfo,
  apiHealthStatus
}) => {
  const copyInstanceInfo = () => {
    const infoText = `Instance Name: ${connectionInfo.instanceName}\nInstance Data: ${JSON.stringify(connectionInfo.instanceData || {}, null, 2)}`;
    
    navigator.clipboard.writeText(infoText)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Instance information copied to clipboard.",
          variant: "default",
        });
      })
      .catch((err) => {
        console.error("Failed to copy instance info:", err);
      });
  };

  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(debugInfo)
        .then(() => {
          toast({
            title: "Debug Info Copied",
            description: "Debug information copied to clipboard.",
            variant: "default",
          });
        })
        .catch((err) => {
          console.error("Failed to copy debug info:", err);
        });
    }
  };
  
  return (
    <div className="w-full border rounded-md p-3 bg-muted/50 mt-4">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-medium">Detalhes da conexão</p>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={toggleDebugInfo} title="Esconder informações de debug">
            <Bug className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyInstanceInfo} title="Copiar informações da conexão">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Instância: {connectionInfo.instanceName}
      </p>
      <p className="text-xs text-muted-foreground">
        Status API: {apiHealthStatus}
      </p>
      
      {debugInfo && (
        <div className="mt-2 p-2 bg-muted rounded-sm">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium">Informações de Debug</p>
            <Button variant="ghost" size="sm" onClick={copyDebugInfo} className="h-5 w-5 p-0">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
};


import React, { useState } from "react";
import { ClipboardCopy, ChevronDown, ChevronUp, Code, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DebugPanelProps {
  debugInfo: string | null;
  connectionInfo: any;
  showDebugInfo: boolean;
  toggleDebugInfo: () => void;
  apiHealthStatus: "unknown" | "healthy" | "unhealthy";
  lastInstanceName: string | null;
  instances?: any[];
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugInfo,
  connectionInfo,
  showDebugInfo,
  toggleDebugInfo,
  apiHealthStatus,
  lastInstanceName,
  instances = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInstances, setShowInstances] = useState(false);
  
  const copyToClipboard = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(debugInfo);
    }
  };

  return (
    <div className="w-full border border-dashed rounded-md p-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-7">
              <div className="flex items-center text-xs text-muted-foreground">
                <Code className="h-3 w-3 mr-1" />
                <span>Debug Info</span>
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-7"
            onClick={copyToClipboard}
          >
            <ClipboardCopy className="h-3 w-3" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-muted-foreground">Status:</div>
              <div className="font-mono">
                {connectionInfo?.status || "unknown"}
              </div>
              <div className="text-muted-foreground">Attempts:</div>
              <div className="font-mono">
                {connectionInfo?.attemptCount || 0}
              </div>
              <div className="text-muted-foreground">Instance:</div>
              <div className="font-mono">
                {lastInstanceName || "none"}
              </div>
              <div className="text-muted-foreground">API Health:</div>
              <div className="font-mono">
                {apiHealthStatus}
              </div>
              {connectionInfo?.consecutiveConnectedStates !== undefined && (
                <>
                  <div className="text-muted-foreground">Consecutive Successes:</div>
                  <div className="font-mono">
                    {connectionInfo.consecutiveConnectedStates}
                  </div>
                </>
              )}
            </div>

            {/* Show instances section */}
            <Collapsible 
              open={showInstances} 
              onOpenChange={setShowInstances}
              className="border-t border-dashed pt-2 mt-2"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-7 w-full flex justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 mr-1" />
                    <span>WhatsApp Instances ({instances.length})</span>
                  </div>
                  {showInstances ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                {instances.length > 0 ? (
                  <div className="mt-2 text-xs space-y-2">
                    {instances.map((instance, index) => (
                      <div key={index} className="border border-gray-100 p-1 rounded">
                        <div className="font-medium">{instance.instanceName || instance.name}</div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={instance.connected || instance.status === "connected" ? "text-green-600" : "text-red-500"}>
                            {instance.status || (instance.connected ? "connected" : "disconnected")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID:</span>
                          <span className="font-mono text-[10px]">{instance.id || instance.instanceId || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">No instances found</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="p-2 bg-gray-50 rounded-md">
              <pre className="text-[10px] leading-tight overflow-auto max-h-40">
                {debugInfo || "No debug info available"}
              </pre>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

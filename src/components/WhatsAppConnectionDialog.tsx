
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  QrCode, 
  Copy, 
  RefreshCw,
  Info 
} from "lucide-react";
import { useConnection } from "@/context/ConnectionContext";
import { toast } from "@/hooks/use-toast";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";

interface WhatsAppConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function WhatsAppConnectionDialog({
  open,
  onOpenChange,
  onComplete,
}: WhatsAppConnectionDialogProps) {
  const { 
    connectionStatus, 
    startConnection, 
    cancelConnection, 
    isLoading, 
    qrCodeData,
    connectionError,
    getConnectionInfo
  } = useConnection();
  
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Start connection process when dialog opens
  useEffect(() => {
    const initiateConnection = async () => {
      if (open && !hasInitiatedConnection && connectionStatus === "waiting" && !qrCodeData && !isLoading) {
        console.log("Starting WhatsApp connection process automatically");
        setHasInitiatedConnection(true);
        await startConnection();
      }
    };
    
    initiateConnection();
  }, [open, hasInitiatedConnection, connectionStatus, qrCodeData, isLoading, startConnection]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHasInitiatedConnection(false);
    }
  }, [open]);

  // Handle dialog close
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && connectionStatus !== "connected") {
      console.log("Dialog closed, canceling connection");
      cancelConnection();
    }
    onOpenChange(isOpen);
  };

  // Handle completion
  useEffect(() => {
    if (connectionStatus === "connected" && onComplete) {
      console.log("Connection complete, calling onComplete callback");
      onComplete();
    }
  }, [connectionStatus, onComplete]);

  // Handle retry button click
  const handleRetry = async () => {
    setHasInitiatedConnection(true);
    await startConnection();
  };

  // Copy instance info to clipboard
  const copyInstanceInfo = () => {
    const { instanceName, instanceData } = getConnectionInfo();
    const infoText = `Instance Name: ${instanceName}\nInstance Data: ${JSON.stringify(instanceData || {}, null, 2)}`;
    
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
        toast({
          title: "Copy Error",
          description: "Could not copy information to clipboard.",
          variant: "destructive",
        });
      });
  };
  
  // Toggle debug information
  const toggleDebugInfo = () => {
    if (debugInfo) {
      setDebugInfo(null);
      return;
    }
    
    const { instanceName, instanceData } = getConnectionInfo();
    setDebugInfo(JSON.stringify({
      instanceName,
      instanceData,
      connectionStatus,
      qrCodeData: qrCodeData ? "[QR DATA AVAILABLE]" : null,
      error: connectionError
    }, null, 2));
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp</DialogTitle>
          <DialogDescription>
            Connect your WhatsApp so the agent can send and receive messages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                Initializing WhatsApp connection...
              </p>
            </div>
          )}

          {!isLoading && connectionStatus === "waiting" && qrCodeData && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`}
                  alt="WhatsApp QR Code"
                  className="w-[200px] h-[200px]"
                />
              </div>
              <div className="flex flex-col items-center space-y-2 max-w-xs text-center">
                <Smartphone className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium">Scan the QR code</p>
                <p className="text-xs text-muted-foreground">
                  Open WhatsApp on your phone, go to Settings &gt; Linked Devices,
                  and scan the QR code above.
                </p>
              </div>
              
              <div className="w-full border rounded-md p-3 bg-muted/50 mt-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Connection details</p>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={toggleDebugInfo}>
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Debug info</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyInstanceInfo}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instance: {getConnectionInfo().instanceName}
                </p>
                
                {debugInfo && (
                  <div className="mt-2 p-2 bg-muted rounded-sm">
                    <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                      {debugInfo}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && connectionStatus === "connected" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">WhatsApp connected successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your agent can now send and receive messages.
                </p>
              </div>
              
              <div className="w-full border rounded-md p-3 bg-green-50 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Connection details</p>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={toggleDebugInfo}>
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Debug info</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyInstanceInfo}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instance: {getConnectionInfo().instanceName}
                </p>
                
                {debugInfo && (
                  <div className="mt-2 p-2 bg-muted rounded-sm">
                    <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                      {debugInfo}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && connectionStatus === "failed" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Connection failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {connectionError || "Could not connect to WhatsApp. Please try again."}
                </p>
              </div>
              
              <div className="w-full border rounded-md p-3 bg-red-50/50 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Error details</p>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={toggleDebugInfo}>
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Debug info</span>
                    </Button>
                  </div>
                </div>
                
                {debugInfo && (
                  <div className="mt-2 p-2 bg-muted rounded-sm">
                    <pre className="text-[10px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                      {debugInfo}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          {connectionStatus !== "connected" && (
            <Button 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
              className="w-full sm:w-auto mb-3 sm:mb-0"
            >
              Cancel
            </Button>
          )}
          
          {connectionStatus === "waiting" && qrCodeData && (
            <Button 
              onClick={handleRetry} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? "Loading..." : "Generate new code"}
            </Button>
          )}
          
          {connectionStatus === "failed" && (
            <Button 
              onClick={handleRetry}
              className="w-full sm:w-auto"
            >
              Try again
            </Button>
          )}
          
          {connectionStatus === "connected" && (
            <Button 
              onClick={() => handleDialogClose(false)}
              className="w-full"
            >
              Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

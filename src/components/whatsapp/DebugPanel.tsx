
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DebugPanelProps {
  debugInfo: string | null;
  connectionInfo: any;
  showDebugInfo: boolean;
  toggleDebugInfo: () => void;
  apiHealthStatus: "unknown" | "healthy" | "unhealthy";
  lastInstanceName?: string | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  debugInfo, 
  connectionInfo, 
  showDebugInfo, 
  toggleDebugInfo, 
  apiHealthStatus,
  lastInstanceName
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full mt-4 border rounded-md p-2 text-xs">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Debug Information</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)} 
          className="h-6 w-6 p-0"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      <div className="mt-2">
        <p><strong>Connection Status:</strong> {connectionInfo.status}</p>
        <p><strong>QR Code:</strong> {connectionInfo.qrCode}</p>
        <p><strong>Attempt Count:</strong> {connectionInfo.attemptCount}</p>
        <p><strong>API Health:</strong> {apiHealthStatus}</p>
        {lastInstanceName && <p><strong>Instance Name:</strong> {lastInstanceName}</p>}
      </div>
      
      {expanded && debugInfo && (
        <div className="mt-2">
          <div className="bg-gray-100 p-2 rounded-md overflow-x-auto">
            <pre className="text-[10px] leading-tight">{debugInfo}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

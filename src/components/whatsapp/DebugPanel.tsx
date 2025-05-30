
import React from 'react';

export interface DebugPanelProps {
  connectionInfo?: any;
  debugInfo?: string | null;
  showDebugInfo?: boolean;
  toggleDebugInfo?: () => void;
  apiHealthStatus?: string;
  lastInstanceName?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  connectionInfo = {},
  debugInfo = null,
  showDebugInfo = true,
  toggleDebugInfo = () => {},
  apiHealthStatus = "unknown",
  lastInstanceName = ""
}) => {
  if (!showDebugInfo) return null;
  
  return (
    <div className="mt-3 p-2 rounded bg-gray-50 border border-gray-100 text-xs font-mono overflow-auto max-h-40">
      <div className="mb-1 text-xs font-medium text-gray-500">Detalhes Técnicos:</div>
      <pre className="whitespace-pre-wrap break-words text-gray-700">
        {debugInfo ? (typeof debugInfo === 'string' ? 
                     (debugInfo.startsWith('{') ? JSON.stringify(JSON.parse(debugInfo), null, 2) : debugInfo) : 
                     JSON.stringify(debugInfo, null, 2)) : 
         'Nenhuma informação disponível.'}
      </pre>
      {connectionInfo && Object.keys(connectionInfo).length > 0 && (
        <div className="mt-2 text-gray-500">
          <div className="mb-1 text-xs font-medium">Estado da conexão:</div>
          <pre className="whitespace-pre-wrap break-words text-gray-700">
            {JSON.stringify(connectionInfo, null, 2)}
          </pre>
        </div>
      )}
      {lastInstanceName && (
        <div className="mt-1 text-gray-500">Última instância: {lastInstanceName}</div>
      )}
      {apiHealthStatus && (
        <div className="mt-1 text-gray-500">
          Status da API: 
          <span className={
            apiHealthStatus === "healthy" ? "text-green-500" : 
            apiHealthStatus === "unhealthy" ? "text-red-500" : 
            "text-gray-500"
          }> {apiHealthStatus}</span>
        </div>
      )}
    </div>
  );
};

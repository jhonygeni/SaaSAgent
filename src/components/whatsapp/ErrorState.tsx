
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  errorMessage: string | null;
  isAuthError: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, isAuthError }) => {
  // Extract specific error message for connection errors
  const isConnectError = errorMessage?.includes('/instance/connect') || errorMessage?.includes('Cannot GET');
  const isConnectionEndpointError = errorMessage?.includes('404') && isConnectError;
  
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <div className="text-center">
        <p className="font-medium">Falha na conexão</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isConnectError 
            ? "O endpoint de conexão para o QR code não está disponível. Por favor, verifique a configuração da API."
            : errorMessage || "Não foi possível conectar à API do WhatsApp. Por favor, tente novamente."}
        </p>
      </div>
      
      {isAuthError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro de autenticação</p>
          <p className="text-xs mt-1">
            Verifique se a chave de API está configurada corretamente no servidor.
          </p>
        </div>
      )}
      
      {isConnectionEndpointError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro no endpoint de conexão</p>
          <p className="text-xs mt-1">
            O endpoint para obter o código QR não está configurado corretamente ou não está disponível no servidor.
            Endpoint esperado: <code className="bg-red-100 px-1">/instance/connect/[nome-da-instancia]</code>
          </p>
        </div>
      )}
    </div>
  );
};

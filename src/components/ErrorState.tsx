import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  errorMessage: string | null;
  isAuthError: boolean;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  errorMessage, 
  isAuthError,
  onRetry
}) => {
  // Detectar tipos específicos de erro
  const isWebhookError = errorMessage?.includes('webhook') || errorMessage?.includes('instance requires property');
  const isConnectError = errorMessage?.includes('/instance/connect') || errorMessage?.includes('Cannot GET');
  const isConnectionEndpointError = errorMessage?.includes('404') && isConnectError;
  const isStateEndpointError = errorMessage?.includes('/instance/connectionState') && errorMessage?.includes('404');
  const isConnectionTimedOut = errorMessage?.includes('timed out') || errorMessage?.includes('timeout');
  const isFetchError = errorMessage?.includes('/instance/fetchInstances');
  const isIntegrationError = errorMessage?.includes('Invalid integration');
  const isDatabaseError = errorMessage?.includes('database') || errorMessage?.includes('supabase') || errorMessage?.includes('query');
  const isNetworkError = errorMessage?.includes('network') || errorMessage?.includes('fetch') || errorMessage?.includes('NetworkError');
  const isDashboardError = errorMessage?.includes('dashboard') || errorMessage?.includes('Dashboard');
  
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <div className="text-center">
        <p className="font-medium">Falha na conexão</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isWebhookError 
            ? "Erro na configuração de webhook. Webhook é obrigatório para a criação da instância."
            : isConnectError 
            ? "O endpoint de conexão para o QR code não está disponível. Por favor, verifique a configuração da API."
            : isStateEndpointError
            ? "O endpoint para verificar o estado da conexão não está disponível."
            : isConnectionTimedOut
            ? "Tempo de conexão esgotado. Por favor, tente novamente."
            : isFetchError
            ? "Erro ao buscar instâncias. Verifique a configuração da API."
            : isIntegrationError
            ? "Valor de integração inválido. O valor deve ser exatamente 'WHATSAPP-BAILEYS' ou 'WHATSAPP-BUSINESS'."
            : isDashboardError
            ? "Falha ao carregar o Dashboard. Por favor, tente novamente mais tarde ou entre em contato com o suporte."
            : isDatabaseError
            ? "Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde."
            : isNetworkError
            ? "Erro de rede. Verifique sua conexão com a internet e tente novamente."
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
      
      {isWebhookError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro na configuração de webhook</p>
          <p className="text-xs mt-1">
            A API exige que um webhook seja fornecido ao criar a instância. Isso já foi corrigido no código.
            Por favor, tente novamente.
          </p>
        </div>
      )}
      
      {isConnectionEndpointError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro no endpoint de conexão</p>
          <p className="text-xs mt-1">
            O endpoint para obter o código QR não está configurado corretamente ou não está disponível no servidor.
            Endpoint esperado: <code className="bg-red-100 px-1">/instance/connect/{'{nome-da-instancia}'}</code>
          </p>
        </div>
      )}
      
      {isStateEndpointError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro no endpoint de status de conexão</p>
          <p className="text-xs mt-1">
            O endpoint para verificar o status da conexão não está configurado corretamente.
            Endpoint esperado: <code className="bg-red-100 px-1">/instance/connectionState/{'{nome-da-instancia}'}</code>
          </p>
        </div>
      )}
      
      {isFetchError && (
        <div className="w-full bg-red-50 p-3 rounded-md text-sm text-red-800">
          <p className="font-medium">Erro ao buscar instâncias</p>
          <p className="text-xs mt-1">
            O endpoint para buscar instâncias não está disponível ou não está configurado corretamente.
            Endpoint esperado: <code className="bg-red-100 px-1">/instance/fetchInstances</code>
          </p>
        </div>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

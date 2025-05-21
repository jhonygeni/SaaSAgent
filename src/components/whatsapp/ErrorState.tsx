
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  errorMessage: string | null;
  isAuthError: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, isAuthError }) => {
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <div className="text-center">
        <p className="font-medium">Falha na conexão</p>
        <p className="text-sm text-muted-foreground mt-1">
          {errorMessage || "Não foi possível conectar à API do WhatsApp. Por favor, tente novamente."}
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
    </div>
  );
};


import React from 'react';
import { CheckCircle, Smartphone } from 'lucide-react';

interface SuccessStateProps {
  phoneNumber?: string;
  instanceName?: string;
  timeTaken?: number;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ phoneNumber, instanceName, timeTaken }) => {
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="rounded-full bg-green-100 p-3">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div className="text-center">
        <p className="font-medium">WhatsApp conectado com sucesso!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Seu agente agora pode enviar e receber mensagens.
        </p>
        {phoneNumber && (
          <p className="text-sm font-medium text-green-600 mt-2">
            Conectado ao número: {phoneNumber}
          </p>
        )}
        {instanceName && (
          <p className="text-xs text-muted-foreground mt-1">
            Nome da instância: {instanceName}
          </p>
        )}
        {timeTaken && (
          <p className="text-xs text-muted-foreground mt-1">
            Tempo de conexão: {timeTaken.toFixed(1)}s
          </p>
        )}
      </div>
      <div className="flex items-center justify-center space-x-2 mt-3 text-green-600">
        <Smartphone className="h-4 w-4" />
        <p className="text-xs font-medium">WhatsApp conectado e pronto para uso</p>
      </div>
    </div>
  );
};

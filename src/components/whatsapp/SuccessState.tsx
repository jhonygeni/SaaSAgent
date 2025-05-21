
import React from 'react';
import { CheckCircle } from 'lucide-react';

export const SuccessState: React.FC = () => {
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
      </div>
    </div>
  );
};

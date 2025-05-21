
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { EVOLUTION_API_URL } from '@/constants/api';

interface ApiHealthWarningProps {
  onRetryClick: () => void;
}

export const ApiHealthWarning: React.FC<ApiHealthWarningProps> = ({ onRetryClick }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800">API Não Acessível</p>
          <p className="text-xs text-red-700 mt-1">
            Não foi possível estabelecer conexão com o servidor WhatsApp. Verifique:
          </p>
          <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
            <li>Sua chave de API está configurada corretamente</li>
            <li>O servidor WhatsApp está online ({EVOLUTION_API_URL})</li>
            <li>Sua rede tem acesso ao servidor</li>
          </ul>
          <div className="mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white text-red-700 border-red-300"
              onClick={onRetryClick}
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Verificar Novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

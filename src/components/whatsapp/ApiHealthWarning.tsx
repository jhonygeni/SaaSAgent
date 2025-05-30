
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button-extensions';

export interface ApiHealthWarningProps {
  onRetryClick: () => void;
}

export const ApiHealthWarning: React.FC<ApiHealthWarningProps> = ({ 
  onRetryClick 
}) => {
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800">API do WhatsApp indisponível</h4>
          <p className="text-xs text-amber-700 mt-1">
            A API do WhatsApp parece estar offline ou inacessível. A conexão pode não funcionar corretamente.
          </p>
          <div className="mt-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs bg-white hover:bg-amber-50 border-amber-200"
              onClick={onRetryClick}
            >
              Verificar novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

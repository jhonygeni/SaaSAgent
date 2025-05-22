
import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button-extensions';

export interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  errorMessage, 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center space-y-6 text-center max-w-xs mx-auto">
      <AlertOctagon className="h-12 w-12 text-destructive" />
      
      <div className="space-y-2">
        <h3 className="font-semibold">Erro na Conexão</h3>
        <p className="text-sm text-muted-foreground">
          {errorMessage}
        </p>
      </div>
      
      <Button 
        onClick={onRetry} 
        variant="outline" 
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  );
};

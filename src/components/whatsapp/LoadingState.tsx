
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  status?: string;
  attemptCount?: number;
  message?: string;
  maxAttempts?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  status = "waiting", 
  attemptCount = 0,
  message,
  maxAttempts = 30
}) => {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-center text-sm text-muted-foreground">
        {message || (status === "waiting" && attemptCount === 0 ? 
          "Criando instância WhatsApp..." : 
          "Obtendo QR code de conexão...")}
      </p>
      {attemptCount > 0 && (
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Tentativa {attemptCount} de {maxAttempts}</p>
          <div className="w-48 h-1 bg-gray-100 rounded-full mt-2">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${Math.min(100, (attemptCount / maxAttempts) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

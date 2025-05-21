
import React from 'react';
import { Smartphone } from 'lucide-react';
import { QrCodeDisplay } from '@/components/QrCodeDisplay';

interface QrCodeStateProps {
  qrCodeData: string;
  pairingCode: string | null;
  attemptCount: number;
}

export const QrCodeState: React.FC<QrCodeStateProps> = ({ 
  qrCodeData,
  pairingCode,
  attemptCount
}) => {
  // Log QR code data for debugging
  console.log(`Rendering QR code state with data available: ${!!qrCodeData}, pairing code available: ${!!pairingCode}`);
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QrCodeDisplay 
          value={qrCodeData}
          size={200}
          pairingCode={pairingCode}
        />
      </div>
      <div className="flex flex-col items-center space-y-2 max-w-xs text-center">
        <Smartphone className="h-6 w-6 text-primary" />
        <p className="text-sm font-medium">Escaneie este código QR</p>
        <p className="text-xs text-muted-foreground">
          Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos Conectados,
          e escaneie o código QR acima.
        </p>
        {pairingCode && (
          <div className="mt-1 p-2 bg-green-50 rounded-md border border-green-100 w-full">
            <p className="text-xs font-medium text-green-700">Ou use o código de pareamento:</p>
            <p className="text-sm font-bold text-green-800 tracking-wider">{pairingCode}</p>
          </div>
        )}
      </div>
      
      {attemptCount > 0 && (
        <div className="w-full text-center">
          <p className="text-xs text-muted-foreground">
            Aguardando conexão... (Tentativa {attemptCount})
          </p>
        </div>
      )}
    </div>
  );
};

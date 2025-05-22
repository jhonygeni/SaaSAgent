
import React from 'react';
import QRCode from 'qrcode.react';

export interface QrCodeStateProps {
  qrCodeData: string;
  pairingCode?: string;
  attemptCount?: number;
}

export const QrCodeState: React.FC<QrCodeStateProps> = ({ 
  qrCodeData, 
  pairingCode,
  attemptCount = 0
}) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-white p-4 rounded-lg">
        <QRCode 
          value={qrCodeData} 
          size={200}
          level="H"
          includeMargin={true}
          className="rounded"
        />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Escaneie o QR Code para conectar</p>
        
        {pairingCode && (
          <div className="bg-muted p-2 rounded">
            <p className="text-xs text-muted-foreground mb-1">Se preferir, use o código de pareamento:</p>
            <span className="font-mono text-base tracking-wide">{pairingCode}</span>
          </div>
        )}
        
        {attemptCount > 0 && (
          <p className="text-xs text-muted-foreground">Tentativa {attemptCount}</p>
        )}
      </div>
    </div>
  );
};

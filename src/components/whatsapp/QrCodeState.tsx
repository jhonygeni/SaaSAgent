
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button-extensions';
import { RefreshCw } from 'lucide-react';

export interface QrCodeStateProps {
  qrCodeData: string;
  pairingCode?: string;
  attemptCount?: number;
  onManualCheck?: (instanceName: string) => Promise<boolean>;
  instanceName?: string;
}

/**
 * Validates and sanitizes QR code data to prevent "Data too long" errors
 */
const validateAndSanitizeQrData = (data: string): string => {
  if (!data || typeof data !== 'string') {
    console.error('Invalid QR code data:', typeof data, data);
    return 'Invalid QR Code Data';
  }

  // Check if data is too long (QR codes have limits)
  // Level H can handle up to ~1273 characters for alphanumeric data
  const MAX_QR_LENGTH = 1200; // Safe margin below the limit
  
  if (data.length > MAX_QR_LENGTH) {
    console.warn(`QR code data too long (${data.length} chars). Truncating to ${MAX_QR_LENGTH} chars.`);
    console.warn('Original data preview:', data.substring(0, 100) + '...');
    return data.substring(0, MAX_QR_LENGTH);
  }

  // Check if data contains valid WhatsApp QR format
  // WhatsApp QR codes typically start with specific patterns
  const whatsappPatterns = [
    /^[A-Za-z0-9+/]+=*$/, // Base64 pattern
    /^[0-9A-Za-z@.]+$/, // Simple alphanumeric
    /^2@/, // WhatsApp QR format
  ];

  const isValidFormat = whatsappPatterns.some(pattern => pattern.test(data));
  
  if (!isValidFormat) {
    console.warn('QR code data does not match expected WhatsApp format:', data.substring(0, 50));
    // Return a safe fallback instead of potentially corrupted data
    return 'Invalid QR Format - Please try again';
  }

  return data;
};

export const QrCodeState: React.FC<QrCodeStateProps> = ({ 
  qrCodeData, 
  pairingCode,
  attemptCount = 0,
  onManualCheck,
  instanceName
}) => {
  const [isChecking, setIsChecking] = useState(false);
  
  // Validate and sanitize QR code data before rendering
  const sanitizedQrData = validateAndSanitizeQrData(qrCodeData);
  
  // Handle manual connection check
  const handleManualCheck = async () => {
    if (!onManualCheck || !instanceName) return;
    
    setIsChecking(true);
    try {
      await onManualCheck(instanceName);
    } catch (error) {
      console.error('Error during manual check:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Show error state if QR data is invalid
  if (sanitizedQrData === 'Invalid QR Code Data' || sanitizedQrData === 'Invalid QR Format - Please try again') {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="text-center text-red-600">
            <p className="font-medium">Erro no QR Code</p>
            <p className="text-sm mt-1">{sanitizedQrData}</p>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Houve um problema ao gerar o QR code. Tente novamente.
          </p>
          
          {pairingCode && (
            <div className="bg-muted p-2 rounded">
              <p className="text-xs text-muted-foreground mb-1">Use o código de pareamento:</p>
              <span className="font-mono text-base tracking-wide">{pairingCode}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG 
          value={sanitizedQrData} 
          size={200}
          level="H"
          includeMargin={true}
          className="rounded"
        />
      </div>
      
      <div className="text-center space-y-4">
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
        
        {/* Manual check button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualCheck}
            disabled={isChecking || !onManualCheck || !instanceName}
            className="text-xs"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Verificar Conexão
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Clique se já escaneou o QR code
          </p>
        </div>
      </div>
    </div>
  );
};

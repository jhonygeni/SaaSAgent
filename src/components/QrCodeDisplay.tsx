
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
  pairingCode?: string | null;
}

export function QrCodeDisplay({
  value,
  size = 200,
  level = "M",
  includeMargin = true,
  pairingCode,
}: QrCodeDisplayProps) {
  const [qrValue, setQrValue] = useState<string>("");
  const [isBase64, setIsBase64] = useState<boolean>(false);
  
  // Handle both direct QR code values and base64 strings
  useEffect(() => {
    if (!value) {
      console.log("QR code value is empty");
      return;
    }
    
    try {
      // Check if we're dealing with a base64 string
      if (typeof value === 'string') {
        // Log complete value for debugging
        console.log(`QR code value received (length: ${value.length})`);
        console.log("QR code value sample:", value.substring(0, 100) + (value.length > 100 ? '...' : ''));
        
        // FIX: More comprehensive detection of various QR code formats
        
        // Check for common base64 patterns
        if (value.indexOf('base64,') !== -1) {
          // Full data URL format (e.g. data:image/png;base64,ABC123...)
          console.log("Detected full data URL with base64 content");
          setQrValue(value);
          setIsBase64(true);
        } else if (value.match(/^data:/i) && value.length > 100) {
          // Data URL that might be malformed but still usable
          console.log("Detected possible data URL");
          setQrValue(value);
          setIsBase64(true);
        } else if (value.match(/^[A-Za-z0-9+/=]{50,}$/)) {
          // Looks like raw base64 without data:image prefix
          console.log("Detected raw base64 encoded QR code");
          setQrValue(`data:image/png;base64,${value}`);
          setIsBase64(true);
        } else if (value.length > 100 && !value.startsWith('http')) {
          // Very long string that isn't a URL - probably QR code data
          console.log("Using raw QR code value (long format)");
          setQrValue(value);
          setIsBase64(false);
        } else {
          // Default handling for shorter strings, URLs, etc.
          console.log("Using standard QR code value");
          setQrValue(value);
          setIsBase64(false);
        }
      } else {
        console.warn("QR code value is not a string:", value);
        setQrValue(String(value));
        setIsBase64(false);
      }
    } catch (error) {
      console.error("Error processing QR code value:", error);
      setQrValue("");
      setIsBase64(false);
    }
  }, [value]);

  if (!value) {
    return (
      <div className="bg-white p-4 rounded-lg inline-block w-[200px] h-[200px] flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">Aguardando código QR...</p>
      </div>
    );
  }

  // If it's a base64 image or URL, render as an image
  if (isBase64) {
    return (
      <div className="bg-white p-4 rounded-lg inline-block">
        <img 
          src={qrValue} 
          alt="WhatsApp QR Code" 
          width={size} 
          height={size}
          className="max-w-full"
          onError={(e) => {
            console.error("Error loading QR code image", e);
            // Fallback to text-based QR code on error
            setIsBase64(false);
          }}
        />
        {/* Show pairing code if available */}
        {pairingCode && (
          <div className="mt-2 text-center">
            <p className="text-sm font-medium">Código de Pareamento:</p>
            <p className="text-lg font-bold tracking-wider">{pairingCode}</p>
          </div>
        )}
      </div>
    );
  }

  // Otherwise use the QRCodeSVG component
  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCodeSVG
        value={qrValue}
        size={size}
        level={level}
        includeMargin={includeMargin}
        bgColor={"#FFFFFF"}
        fgColor={"#000000"}
      />
      {/* Show pairing code if available */}
      {pairingCode && (
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">Código de Pareamento:</p>
          <p className="text-lg font-bold tracking-wider">{pairingCode}</p>
        </div>
      )}
    </div>
  );
}

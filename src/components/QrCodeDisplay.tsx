
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
  pairingCode?: string | null; // Added to support pairing code if available
}

export function QrCodeDisplay({
  value,
  size = 200,
  level = "M",
  includeMargin = true,
  pairingCode, // New prop for pairing code
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
        // Log first few characters for debugging
        console.log(`QR code value (first 20 chars): ${value.substring(0, 20)}...`);
        
        // If it looks like it might be base64
        if (value.length > 100 && !value.startsWith('http') && !value.startsWith('data:')) {
          console.log("Detected base64 encoded QR code");
          setQrValue(`data:image/png;base64,${value}`);
          setIsBase64(true);
        } else if (value.startsWith('data:')) {
          console.log("Detected data URL QR code");
          setQrValue(value);
          setIsBase64(true);
        } else {
          console.log("Using raw QR code value");
          setQrValue(value);
          setIsBase64(false);
        }
      } else {
        // If not a string, convert to string
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
        <p className="text-gray-400 text-sm text-center">QR code not available yet</p>
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
            <p className="text-sm font-medium">Pairing Code:</p>
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
          <p className="text-sm font-medium">Pairing Code:</p>
          <p className="text-lg font-bold tracking-wider">{pairingCode}</p>
        </div>
      )}
    </div>
  );
}


import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

export function QrCodeDisplay({
  value,
  size = 200,
  level = "M",
  includeMargin = true,
}: QrCodeDisplayProps) {
  const [qrValue, setQrValue] = useState<string>("");
  const [isBase64, setIsBase64] = useState<boolean>(false);
  
  // Handle both direct QR code values and base64 strings
  useEffect(() => {
    if (!value) {
      return;
    }
    
    // If it looks like it might be base64
    if (value && value.length > 100 && !value.startsWith('http') && !value.startsWith('data:')) {
      setQrValue(`data:image/png;base64,${value}`);
      setIsBase64(true);
    } else if (value.startsWith('data:')) {
      setQrValue(value);
      setIsBase64(true);
    } else {
      setQrValue(value);
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
        />
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
    </div>
  );
}

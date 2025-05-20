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
  const [qrValue, setQrValue] = useState<string>(value);
  
  // Handle both direct QR code values and base64 strings
  useEffect(() => {
    // If it looks like it might be base64 (just a simple check)
    if (value && value.length > 100 && !value.startsWith('http')) {
      setQrValue(`data:image/png;base64,${value}`);
    } else {
      setQrValue(value);
    }
  }, [value]);

  if (!value) {
    return (
      <div className="bg-white p-4 rounded-lg inline-block w-[200px] h-[200px] flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">No QR code available</p>
      </div>
    );
  }

  // If it's a URL or base64 data URL, render as an image
  if (qrValue.startsWith('data:') || qrValue.startsWith('http')) {
    return (
      <div className="bg-white p-4 rounded-lg inline-block">
        <img 
          src={qrValue} 
          alt="QR Code" 
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

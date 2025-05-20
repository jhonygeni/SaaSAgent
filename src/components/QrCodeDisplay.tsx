
import { QRCodeSVG } from "qrcode.react";

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
  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        bgColor={"#FFFFFF"}
        fgColor={"#000000"}
      />
    </div>
  );
}

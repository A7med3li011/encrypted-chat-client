import React from "react";

import { Card, CardBody } from "./ui/Card";
import { Button } from "./ui/Button";
import { Download, Copy, Check } from "lucide-react";
import QRCodeSVG from "react-qr-code";
interface QRCodeDisplayProps {
  value: string;
  label: string;
  showDownload?: boolean;
  showCopy?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  label,
  showDownload = true,
  showCopy = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${label}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${label}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card>
      <CardBody className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </h3>
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG id={`qr-${label}`} value={value} size={200} />
        </div>
        <div className="w-full p-3 bg-gray-100 dark:bg-gray-900 rounded-lg break-all text-sm text-gray-800 dark:text-gray-200 font-mono">
          {value}
        </div>
        <div className="flex gap-2 w-full">
          {showCopy && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </Button>
          )}
          {showDownload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

"use client";

import { memo, useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Copy, Check } from "lucide-react";
import Image from "next/image";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageQr: string | undefined;
  accountId: string | undefined;
}

function QRCodeModalComponent({
  isOpen,
  onClose,
  imageQr,
  accountId,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadQr = useCallback(async () => {
    if (!imageQr || !accountId) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      try {
        const response = await fetch(imageQr);
        const blob = await response.blob();

        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], `account-qr-${accountId}.png`, {
              type: "image/png",
            });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: "Account QR Code",
              });
              return;
            }
          } catch {
            console.log("Share failed, falling back to new tab");
          }
        }

        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch {
        window.open(imageQr, "_blank");
      }
    } else {
      const link = document.createElement("a");
      link.href = imageQr;
      link.download = `account-qr-${accountId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [imageQr, accountId]);

  const handleCopyAccountId = useCallback(async () => {
    if (!accountId) return;
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [accountId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account QR Code">
      <div className="flex flex-col items-center gap-4">
        {imageQr && (
          <Image
            src={imageQr}
            alt="Account QR Code"
            width={256}
            height={256}
            className="w-64 h-64"
          />
        )}
        <p className="text-sm text-gray-400 text-center">
          Scan this QR code to share your account ID
        </p>
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={handleDownloadQr}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download QR
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopyAccountId}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy ID"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const QRCodeModal = memo(QRCodeModalComponent);

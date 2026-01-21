"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Camera, CameraOff, RefreshCw } from "lucide-react";
import { StartConversation } from "@/lib/action/conversation.action";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function ScanQRPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedAccountId, setScannedAccountId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS
  useEffect(() => {
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
    setIsIOS(iOS);
  }, []);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsCameraReady(false);
  }, []);

  const scanQRCode = useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !isScanning ||
      !isCameraReady
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Set canvas size to match video
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    try {
      // Use BarcodeDetector API if available (Chrome, Edge, Safari 16.4+)
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (
          window as unknown as {
            BarcodeDetector: new (options: { formats: string[] }) => {
              detect: (
                source: HTMLCanvasElement,
              ) => Promise<{ rawValue: string }[]>;
            };
          }
        ).BarcodeDetector({
          formats: ["qr_code"],
        });
        const barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          const accountId = barcodes[0].rawValue;
          if (accountId) {
            stopCamera();
            setScannedAccountId(accountId);
            setShowConfirm(true);
            return;
          }
        }
      }
    } catch (err) {
      // BarcodeDetector not supported or failed, continue scanning
      console.log("BarcodeDetector scan attempt:", err);
    }
  }, [isScanning, isCameraReady, stopCamera]);

  // Use interval-based scanning for better iOS compatibility
  useEffect(() => {
    if (isScanning && isCameraReady) {
      // Use setInterval for more reliable scanning on iOS
      scanIntervalRef.current = setInterval(() => {
        scanQRCode();
      }, 250); // Scan every 250ms
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isScanning, isCameraReady, scanQRCode]);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsCameraReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      // iOS PWA requires specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // iOS requires these attributes for inline playback in PWA
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.muted = true;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error("Video element not found"));
            return;
          }

          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);

          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("Camera initialization timeout"));
          }, 10000);
        });

        await videoRef.current.play();
        setIsScanning(true);
        setHasCamera(true);

        // Small delay to ensure video is actually playing
        setTimeout(() => {
          setIsCameraReady(true);
        }, 500);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);

      let errorMessage = "Failed to access camera.";

      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Camera permission denied. Please allow camera access in your device settings.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMessage = "No camera found on this device.";
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          errorMessage =
            "Camera is in use by another app. Please close other apps using the camera.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera doesn't support the required settings.";
        } else {
          errorMessage = err.message || "Failed to access camera.";
        }
      }

      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    // Delay camera start slightly for iOS PWA
    const timer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle page visibility changes (important for iOS PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (!showConfirm) {
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startCamera, stopCamera, showConfirm]);

  const handleStartConversation = async () => {
    if (!scannedAccountId) return;

    setIsStartingConversation(true);
    try {
      const { accessToken } = useAuthStore.getState();
      const response = await StartConversation(scannedAccountId, accessToken || undefined);

      if (!response.success) {
        showToast(response.message || "Failed to start conversation", "error");
        setShowConfirm(false);
        setScannedAccountId(null);
        startCamera();
        return;
      }

      showToast("Conversation started successfully!", "success");

      // Navigate to the new conversation if we have an ID
      if (response.data?._id) {
        router.push(`/chat/${response.data._id}`);
      } else {
        router.push("/conversations");
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
      showToast("Failed to start conversation", "error");
      setShowConfirm(false);
      setScannedAccountId(null);
      startCamera();
    } finally {
      setIsStartingConversation(false);
    }
  };

  const handleCancelScan = () => {
    setShowConfirm(false);
    setScannedAccountId(null);
    startCamera();
  };

  const handleBack = () => {
    stopCamera();
    router.push("/dashboard");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Scan QR Code
              </h1>
            </div>
            {hasCamera && !error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopCamera();
                  setTimeout(startCamera, 100);
                }}
                className="p-2"
              >
                <RefreshCw size={16} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Camera View */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] p-4">
        {error ? (
          <div className="text-center max-w-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <CameraOff size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
                {error}
              </p>
              {isIOS && (
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
                  On iOS, go to Settings → Safari → Camera and allow access.
                </p>
              )}
              <Button variant="primary" onClick={startCamera}>
                <Camera size={16} className="mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            {/* Video container */}
            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(1)" }}
              />
              {/* Loading overlay */}
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />
                  {/* Scanning line animation */}
                  {isScanning && isCameraReady && (
                    <div className="absolute inset-x-2 h-0.5 bg-blue-600 animate-pulse top-1/2" />
                  )}
                </div>
              </div>
            </div>
            {/* Hidden canvas for QR detection */}
            <canvas ref={canvasRef} className="hidden" />

            <p className="text-gray-600 dark:text-gray-400 text-center mt-4 text-sm">
              Position a QR code within the frame to scan
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={handleCancelScan}
        onConfirm={handleStartConversation}
        title="Start Conversation"
        message={`Do you want to start a conversation with account: ${scannedAccountId}?`}
        confirmText="Start Chat"
        cancelText="Cancel"
        variant="info"
        isLoading={isStartingConversation}
      />
    </div>
  );
}

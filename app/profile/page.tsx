"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  User,
  MapPin,
  Smartphone,
  Key,
  AlertTriangle,
  QrCode,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { handlegetProfile } from "@/lib/action/auth.action";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userData, setUserData] = useState<{
    deviceType: string;
    location: string;
    userName: string;
    imageQr: string;
    accountId: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await handlegetProfile();
        setUserData({
          deviceType: res.data.deviceType,
          location: res.data.location,
          userName: res.data.userName,
          imageQr: res.data.accountIdQR,
          accountId: res.data.accountId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleDeactivate = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const handleDownloadQr = () => {
    if (!userData?.imageQr) return;
    const link = document.createElement("a");
    link.href = userData.imageQr;
    link.download = `account-qr-${userData.accountId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAccountId = async () => {
    if (!userData?.accountId) return;
    try {
      await navigator.clipboard.writeText(userData.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Profile Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Profile Information
              </h2>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : userData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Username
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {userData.userName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Location
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {userData.location || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Smartphone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Device Type
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {userData.deviceType || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Key className="text-gray-400" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Account ID
                        </p>
                        <p className="text-gray-900 dark:text-gray-100 font-mono text-sm break-all">
                          {userData.accountId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQrCode(true)}
                        className="flex items-center gap-2"
                      >
                        <QrCode size={16} />
                        Show QR
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {/* Danger Zone */}
          {/* <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                <AlertTriangle size={20} />
                Danger Zone
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Deactivating your account will remove your access and delete all
                your conversations and messages. This action cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setShowDeactivate(true)}>
                Deactivate Account
              </Button>
            </CardBody>
          </Card> */}
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQrCode}
        onClose={() => setShowQrCode(false)}
        title="Account QR Code"
      >
        <div className="flex flex-col items-center gap-4">
          {userData?.imageQr && (
            <Image
              src={`${userData.imageQr}`}
              alt="Account QR Code"
              width={256}
              height={256}
              className="w-64 h-64"
            />
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
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

      {/* Deactivate Account Modal */}
      {/* <Modal
        isOpen={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        title="Deactivate Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              Are you absolutely sure?
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-2">
              This action cannot be undone. All your conversations and messages
              will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeactivate(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeactivate}
              className="flex-1"
            >
              Yes, Deactivate
            </Button>
          </div>
        </div>
      </Modal> */}
    </div>
  );
}

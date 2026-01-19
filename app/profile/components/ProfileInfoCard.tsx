"use client";

import { memo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  User,
  MapPin,
  Smartphone,
  Key,
  QrCode,
  Edit2,
  Copy,
  Check,
} from "lucide-react";

export interface UserData {
  deviceType: string;
  location: string;
  userName: string;
  imageQr: string;
  accountId: string;
  profileImage: string | null;
  bio: string;
}

interface ProfileInfoCardProps {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  onEditClick: () => void;
  onShowQrCode: () => void;
}

function ProfileInfoCardComponent({
  userData,
  isLoading,
  error,
  onEditClick,
  onShowQrCode,
}: ProfileInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccountId = async () => {
    if (userData?.accountId) {
      await navigator.clipboard.writeText(userData.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profile Information
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="flex items-center gap-2"
          >
            <Edit2 size={16} />
            Edit
          </Button>
        </div>
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

            <div className="flex items-start gap-3">
              <Edit2 className="text-gray-400 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {userData.bio || "No bio set"}
                </p>
              </div>
            </div>

           

            

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Key className="text-gray-400" size={20} />
                <div
                  className="flex-1 cursor-pointer group"
                  onClick={handleCopyAccountId}
                  title="Click to copy"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    Account ID
                    {copied ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-mono text-sm break-all group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {userData.accountId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowQrCode}
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
  );
}

export const ProfileInfoCard = memo(ProfileInfoCardComponent);

"use client";

import { memo, useRef } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { User, Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface ProfileImageSectionProps {
  profileImage: string | null;
  isUploadingImage: boolean;
  updateError: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ProfileImageSectionComponent({
  profileImage,
  isUploadingImage,
  updateError,
  onImageSelect,
}: ProfileImageSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-100">Profile Picture</h2>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
              {profileImage ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_SOCKET_URL}${profileImage}`}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-gray-400" size={40} />
              )}
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={24} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
            >
              <Camera size={16} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelect}
            className="hidden"
          />

          <p className="text-sm text-gray-400 text-center">
            Tap the camera icon to update your profile picture
          </p>

          {updateError && (
            <div className="w-full p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-200 text-center">{updateError}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export const ProfileImageSection = memo(ProfileImageSectionComponent);

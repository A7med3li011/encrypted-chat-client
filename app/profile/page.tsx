"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  handlegetProfile,
  handleUpdateIMageProfile,
  handleUpdateUserInfo,
} from "@/lib/action/auth.action";
import {
  ProfileHeader,
  ProfileImageSection,
  ProfileInfoCard,
  QRCodeModal,
  EditProfileModal,
  type UserData,
} from "./components";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();

  const [showQrCode, setShowQrCode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [toggle, setToggle] = useState(false);

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
          profileImage: res.data.profilePic || null,
          bio: res.data.bio || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [toggle]);

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setUpdateError("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUpdateError("Image size must be less than 5MB");
        return;
      }

      setIsUploadingImage(true);
      setUpdateError(null);

      try {
        const result = await handleUpdateIMageProfile(file);

        if (result.success) {
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  profileImage: result.data?.profileImage || prev.profileImage,
                }
              : prev
          );
          setToggle((prev) => !prev);
        } else {
          setUpdateError(result.message || "Failed to upload image");
        }
      } catch (err) {
        setUpdateError(
          err instanceof Error ? err.message : "Failed to upload image"
        );
      } finally {
        setIsUploadingImage(false);
        const input = e.target;
        if (input) {
          input.value = "";
        }
      }
    },
    []
  );

  const handleSaveProfile = useCallback(
    async (userName: string, bio: string) => {
      if (!userName.trim()) {
        setUpdateError("Username is required");
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        const result = await handleUpdateUserInfo(userName.trim(), bio.trim());

        if (result.success) {
          setUserData((prev) =>
            prev ? { ...prev, userName: userName.trim(), bio: bio.trim() } : prev
          );
          setShowEditProfile(false);
        } else {
          setUpdateError(result.message || "Failed to update profile");
        }
      } catch (err) {
        setUpdateError(
          err instanceof Error ? err.message : "Failed to update profile"
        );
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const openEditProfile = useCallback(() => {
    setUpdateError(null);
    setShowEditProfile(true);
  }, []);

  const openQrCode = useCallback(() => {
    setShowQrCode(true);
  }, []);

  const closeQrCode = useCallback(() => {
    setShowQrCode(false);
  }, []);

  const closeEditProfile = useCallback(() => {
    setShowEditProfile(false);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProfileHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <ProfileImageSection
            profileImage={userData?.profileImage ?? null}
            isUploadingImage={isUploadingImage}
            updateError={updateError}
            onImageSelect={handleImageSelect}
          />

          <ProfileInfoCard
            userData={userData}
            isLoading={isLoading}
            error={error}
            onEditClick={openEditProfile}
            onShowQrCode={openQrCode}
          />
        </div>
      </div>

      <QRCodeModal
        isOpen={showQrCode}
        onClose={closeQrCode}
        imageQr={userData?.imageQr}
        accountId={userData?.accountId}
      />

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={closeEditProfile}
        initialUserName={userData?.userName || ""}
        initialBio={userData?.bio || ""}
        isUpdating={isUpdating}
        updateError={updateError}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

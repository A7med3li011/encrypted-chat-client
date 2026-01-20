"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getAccessToken,
  clearCookies,
  handlegetProfile,
  handleUpdateIMageProfile,
  handleUpdateUserInfo,
  handleRefreshToken,
} from "@/lib/action/auth.action";
import {
  ProfileHeader,
  ProfileImageSection,
  ProfileInfoCard,
  QRCodeModal,
  EditProfileModal,
  ImageCropperModal,
  type UserData,
} from "./components";
import { useRouter } from "next/navigation";


export default function ProfilePage() {
  const { user, isAuthenticated, updateUser,clearAuth } = useAuthStore();

  const [showQrCode, setShowQrCode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [toggle, setToggle] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [retry, setRetry] = useState(false);
  const router = useRouter();

 
  useEffect(() => {
  const checkToken = async () => {
    const token = await getAccessToken();

    if (!token) {
      clearAuth();
      await  clearCookies();
      router.push("/auth/login");
    }
  };

  const timeoutId = setTimeout(() => {
    checkToken();
  }, 1200);

  return () => clearTimeout(timeoutId);
}, []);

  useEffect(() => {
    async function refreshCookies() {
      try {
        const result = await handleRefreshToken();
        if (result?.success) {
          setRetry((prev) => !prev);
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        router.push("/auth/login");
      } finally {
        setIsExpired(false);
      }
    }
    if (isExpired) {
      refreshCookies();
    }
  }, [isExpired, router]);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await handlegetProfile();

        if (!res.success) {
          if (res.message === "jwt expired") {
            return setIsExpired(true);
          }
          setError(res.message || "Failed to load profile");
          return;
        }

        setUserData({
          userName: res?.data?.userName,
          imageQr: res?.data?.accountIdQR,
          accountId: res?.data?.accountId,
          profileImage: res?.data?.profilePic || null,
          bio: res?.data?.bio || "",
        });
        updateUser({
          accountId: res?.data?.accountId,
          profilePic: res?.data?.profilePic || null,
          userName: res?.data?.userName,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [toggle, retry]);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setUpdateError(null);

      // Create a URL for the selected image and open the cropper
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageSrc(imageUrl);
      setShowImageCropper(true);

      // Reset the input
      e.target.value = "";
    },
    [],
  );

  const handleCropComplete = useCallback(
    async (croppedImageBlob: Blob) => {
      setShowImageCropper(false);
      
      // Cleanup the object URL
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
        setSelectedImageSrc(null);
      }

      setIsUploadingImage(true);
      setUpdateError(null);

      try {
        // Convert Blob to File for upload
        const croppedFile = new File([croppedImageBlob], "profile-image.jpg", {
          type: "image/jpeg",
        });

        const result = await handleUpdateIMageProfile(croppedFile);

        if (result.success) {
          setUserData((prev) =>
            prev
              ? {
                  ...prev,
                  profileImage: result.data?.profileImage || prev.profileImage,
                }
              : prev,
          );
          setToggle((prev) => !prev);
        } else {
          setUpdateError(result.message || "Failed to upload image");
        }
      } catch (err) {
        setUpdateError(
          err instanceof Error ? err.message : "Failed to upload image",
        );
      } finally {
        setIsUploadingImage(false);
      }
    },
    [selectedImageSrc],
  );

  const handleCropperClose = useCallback(() => {
    setShowImageCropper(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
  }, [selectedImageSrc]);

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
        console.log(result,"asdasdasxzczxc");
        if (result.success) {
          setUserData((prev) =>
            prev
              ? { ...prev, userName: userName.trim(), bio: bio.trim() }
              : prev,
          );
          setShowEditProfile(false);
        } else {
          setUpdateError(result.message || "Failed to update profile");
        }
      } catch (err) {
        setUpdateError(
          err instanceof Error ? err.message : "Failed to update profile",
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [],
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
    <div className="min-h-screen bg-gray-900">
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

      {selectedImageSrc && (
        <ImageCropperModal
          isOpen={showImageCropper}
          imageSrc={selectedImageSrc}
          onClose={handleCropperClose}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { MessageSquare, User, QrCode, ScanLine, LogOut, Shield } from "lucide-react";
const logoImage = "/assets/bond_logo.jpeg";
import {
  handleLogout as logoutAction,
  handlegetProfile,
} from "@/lib/action/auth.action";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import { QRCodeModal } from "@/app/profile/components";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, accessToken, updateUser } = useAuthStore();
  const { showToast } = useToast();

  const [showQrCode, setShowQrCode] = useState(false);
  const [qrData, setQrData] = useState<{
    imageQr?: string;
    accountId?: string;
  }>({});

  // Redirect if not authenticated
  useEffect(() => {
    const stored = localStorage.getItem("auth-storage");

    if (!stored) {
      router.push("/auth/login");
      return;
    }

    let auth;
    try {
      auth = JSON.parse(stored);
    } catch (err) {
      router.push("/auth/login");
      return;
    }

    if (!auth?.state?.accessToken) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    async function fetchProfileData() {
      if (!accessToken) return;
      try {
        const res = await handlegetProfile(accessToken);
        if (res?.success && res?.data) {
          setQrData({
            imageQr: res.data.accountIdQR,
            accountId: res.data.accountId,
          });
          // Update user data in store to ensure role and profilePic are current
          updateUser({
            accountId: res.data.accountId,
            userName: res.data.userName,
            profilePic: res.data.profilePic,
            role: res.data.role,
          });
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      }
    }
    fetchProfileData();
  }, [accessToken, updateUser]);

  const handleLogout = async () => {
    try {
      if (accessToken) {
        const response = await logoutAction(accessToken);

        if (!response.success) {
          showToast(response.error?.message || "Failed to logout", "error");
        } else {
          showToast(response.message || "Logged out successfully", "success");
        }
      }

      clearAuth();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Failed to logout", "error");
      clearAuth();
      router.push("/auth/login");
    }
  };

  const openQrCode = useCallback(() => {
    setShowQrCode(true);
  }, []);

  const closeQrCode = useCallback(() => {
    setShowQrCode(false);
  }, []);

  const isAdminOrSubadmin = user?.role === "admin" || user?.role === "subadmin";

  const navItems: NavItem[] = [
    {
      icon: <MessageSquare size={32} />,
      label: "Conversations",
      onClick: () => router.push("/conversations"),
    },
    {
      icon: <User size={32} />,
      label: "Profile",
      onClick: () => router.push("/profile"),
    },
    {
      icon: <QrCode size={32} />,
      label: "My QR",
      onClick: openQrCode,
    },
    {
      icon: <ScanLine size={32} />,
      label: "Scan QR",
      onClick: () => router.push("/scan"),
    },
    // Add admin panel button for admins and subadmins
    ...(isAdminOrSubadmin
      ? [
          {
            icon: <Shield size={32} />,
            label: "Admin Panel",
            onClick: () => router.push("/admin"),
          },
        ]
      : []),
  ];

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
              <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src={
                    user?.profilePic
                      ? `${process.env.NEXT_PUBLIC_SOCKET_URL}${user?.profilePic}`
                      : logoImage
                  }
                  fill
                  alt="Bond Logo"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col mt-2">
                <h1 className="text-xl font-bold text-gray-100 leading-tight">
                  Bond
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome, {user?.userName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Navigation Icons */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-2 gap-6 p-6">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="bg-[#1E2939] hover:bg-[#1E2939]/40 active:bg-[#1E2939]/40 text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors duration-200 shadow-lg min-w-[140px] min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <QRCodeModal
        isOpen={showQrCode}
        onClose={closeQrCode}
        imageQr={qrData.imageQr}
        accountId={qrData.accountId}
      />
    </div>
  );
}

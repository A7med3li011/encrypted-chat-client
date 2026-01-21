"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, AlertCircle } from "lucide-react";
import { handleRegister } from "@/lib/action/auth.action";

// Helper function to detect device type from user agent
const getDeviceType = (): string => {
  const ua = navigator.userAgent;

  // Mobile devices
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Android Mobile";
    return "Android Tablet";
  }

  // Desktop OS
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows NT/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";

  return "Unknown Device";
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    userName: "",
    location: "",
    deviceType: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    accountId: string;
    accountIdQR: string;
    recoveryPassword: string;
    recoveryPasswordQR: string;
  } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !showSuccess) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, showSuccess, router]);

  // Auto-detect location and device type on component mount
  useEffect(() => {
    // Detect device type
    const deviceType = getDeviceType();

    // Get location using Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get location name
            const { latitude, longitude } = position.coords;

            // Call reverse geocoding API to get readable location
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "EncryptionChatApp/1.0",
                },
              },
            );

            if (response.ok) {
              const data = await response.json();
              const address = data.address;

              // Build a readable location string (City, Country)
              const city =
                address.city ||
                address.town ||
                address.village ||
                address.county;
              const country = address.country;
              const locationString =
                city && country
                  ? `${city}, ${country}`
                  : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

              setFormData((prev) => ({
                ...prev,
                location: locationString,
                deviceType: deviceType,
              }));
            } else {
              // Fallback to coordinates if geocoding fails
              setFormData((prev) => ({
                ...prev,
                location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                deviceType: deviceType,
              }));
            }
          } catch (error) {
            console.error("Error getting location name:", error);
            setFormData((prev) => ({
              ...prev,
              location: "",
              deviceType: deviceType,
            }));
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setFormData((prev) => ({
            ...prev,
            location: "",
            deviceType: deviceType,
          }));
        },
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        location: "Geolocation not supported",
        deviceType: deviceType,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.location) {
      setError("please open location and refresh page");
      return;
    }
    setIsLoading(true);
    try {
      // Register user
      const response = await handleRegister(formData);

      if (!response.success) {
        setError(
          response.error?.message || "Registration failed. Please try again.",
        );
        return;
      }

      // Set registration data for display (includes recovery password and QR codes)
      setRegistrationData({
        accountId: response.data.accountId,
        accountIdQR: response.data.accountIdQR,
        recoveryPassword: response.data.recoveryPassword,
        recoveryPasswordQR: response.data.recoveryPasswordQR,
      });

      // Set auth state with user data and tokens
      setAuth(
        {
          accountId: response.data.accountId,
          userName: response.data.userName,
          role: "user",
        },
        response.accessToken,
        response.refreshToken,
      );

      // Show success modal
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setShowSuccess(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <Image
              src="/assets/bond_logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-100">
            Create Account
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Join our secure encrypted chat platform
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle
                  className="text-red-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Input
              label=""
              name="userName"
              type="text"
              placeholder="Enter your username"
              value={formData.userName}
              onChange={handleChange}
              required
            />

            {/* Auto-detected information */}

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <UserPlus size={20} />
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-400 hover:underline font-medium"
              >
                Login here
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={showSuccess}
        onClose={() => {}}
        title="Registration Successful!"
        size="xl"
      >
        <div className="space-y-6">
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-200 font-medium">
              Your account has been created successfully!
            </p>
            <p className="text-green-300 text-sm mt-2">
              Please save your Account ID and Recovery Password. You&apos;ll need the
              Recovery Password to login.
            </p>
          </div>

          {registrationData && (
            <div className="grid md:grid-cols-2 gap-4">
              <QRCodeDisplay
                value={registrationData.accountId}
                label="Account ID"
              />
              <QRCodeDisplay
                value={registrationData.recoveryPassword}
                label="Recovery Password"
              />
            </div>
          )}

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-200 font-medium">
              Important: Keep your Recovery Password safe!
            </p>
            <p className="text-yellow-300 text-sm mt-2">
              Your 12-word recovery password is the only way to access your
              account. Store it securely offline.
            </p>
          </div>

          <Button variant="primary" className="w-full" onClick={handleContinue}>
            Continue to Dashboard
          </Button>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { Lock, UserPlus, AlertCircle } from "lucide-react";
import { handleRegister } from "@/lib/action/auth.action";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Register user
      const response = await handleRegister(formData);

      if (!response.success) {
        setError(response.error?.message || "Registration failed. Please try again.");
        return;
      }

      // Set registration data for display (includes recovery password and QR codes)
      setRegistrationData({
        accountId: response.data.accountId,
        accountIdQR: response.data.accountIdQR,
        recoveryPassword: response.data.recoveryPassword,
        recoveryPasswordQR: response.data.recoveryPasswordQR,
      });

      // Set auth state with tokens and user data
      if (response.accessToken && response.refreshToken) {
        setAuth(
          response.accessToken,
          response.refreshToken,
          {
            _id: response.data._id || "",
            accountId: response.data.accountId,
            userName: response.data.userName,
            location: formData.location,
            deviceType: formData.deviceType,
            role: "user",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Lock className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Create Account
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Join our secure encrypted chat platform
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle
                  className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <Input
              label="Username"
              name="userName"
              type="text"
              placeholder="Enter your username"
              value={formData.userName}
              onChange={handleChange}
              required
            />

            <Input
              label="Location"
              name="location"
              type="text"
              placeholder="Enter your location"
              value={formData.location}
              onChange={handleChange}
              required
            />

            <Input
              label="Device Type"
              name="deviceType"
              type="text"
              placeholder="e.g., iPhone 15, Windows PC"
              value={formData.deviceType}
              onChange={handleChange}
              required
            />

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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              Your account has been created successfully!
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm mt-2">
              Please save your Account ID and Recovery Password. You'll need the
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

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Important: Keep your Recovery Password safe!
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
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

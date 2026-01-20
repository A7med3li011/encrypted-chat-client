"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { handleLogin } from "@/lib/action/auth.action";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Trim and normalize the recovery password
      const normalizedPassword = recoveryPassword.trim().replace(/\s+/g, " ");

      // Login using server action
      const response = await handleLogin({
        recoveryPassword: normalizedPassword,
      });

      if (!response.success) {
        setError(
          response.error?.message ||
            "Login failed. Please check your recovery password.",
        );
        return;
      }

      // Set auth state with user data
      // Tokens are stored in HTTP-only cookies on the server side
      setAuth({
        accountId: response.data.accountId,
        profilePic: response.data.profilePic,
        userName: response.data.userName,
        role: "user",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Login failed. Please check your recovery password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  from-gray-900 to-gray-800 px-4">
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
            Welcome Back
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Login with your 24-word recovery password
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

            <div>
              <Input
                label="Recovery Password"
                name="recoveryPassword"
                type="text"
                placeholder="Enter your 24-word recovery password"
                value={recoveryPassword}
                onChange={(e) => {
                  setRecoveryPassword(e.target.value);
                  setError("");
                }}
                required
                helperText="Enter all 24 words separated by spaces"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <LogIn size={20} />
              Login
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-blue-400 hover:underline font-medium"
              >
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-xs text-blue-200">
              <strong>Tip:</strong> Your recovery password is a 24-word phrase
              you received during registration. Make sure to enter all words
              correctly with spaces between them.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

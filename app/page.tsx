"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { LogIn, UserPlus } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center">
        <div className="mb-1 ">
          <Image
            src="/assets/bond_logo.png"
            alt="Bond Logo"
            width={250}
            height={50}
            className="mx-auto rounded-full  "
            priority
          />
        </div>

        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 -ms-4">
          Bond
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Secure, encrypted messaging for private conversations
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/auth/login")}
            className="flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Login
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/auth/register")}
            className="flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
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

        <h1 className="text-5xl font-bold text-white mb-4 -ms-4">
          Bond
        </h1>

        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-15">
          

          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/auth/register")}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#3CB6DB] via-[#7858DD] to-[#D558B6]"
          >
            {/* <UserPlus size={20} /> */}
           Create Account
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/auth/login")}
            className="flex items-center justify-center gap-2 bg-transparent border border-gray-400 hover:bg-transparent"
          >
           
            Log in
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

function ProfileHeaderComponent() {
  const router = useRouter();

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-100">Profile Settings</h1>
        </div>
      </div>
    </header>
  );
}

export const ProfileHeader = memo(ProfileHeaderComponent);

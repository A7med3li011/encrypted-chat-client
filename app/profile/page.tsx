"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  User,
  MapPin,
  Smartphone,
  Key,
  AlertTriangle,
} from "lucide-react";
import { handlegetProfile } from "@/lib/action/auth.action";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [showDeactivate, setShowDeactivate] = useState(false);

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/auth/login");
  //   }
  // }, [isAuthenticated, router]);

  useEffect(() => {
    async function geto() {
      await handlegetProfile()
        .then((res) => console.log(res, "progile"))
        .catch((err) => console.log(err));
    }
    geto();
  }, []);

  const handleDeactivate = () => {
    clearAuth();
    router.push("/auth/login");
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Profile Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Profile Information
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Username
                    </p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {user.userName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Location
                    </p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {user.location || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Smartphone className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Device Type
                    </p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {user.deviceType || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Key className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Account ID
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 font-mono">
                        {user.accountId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                <AlertTriangle size={20} />
                Danger Zone
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Deactivating your account will remove your access and delete all
                your conversations and messages. This action cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setShowDeactivate(true)}>
                Deactivate Account
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Deactivate Account Modal */}
      <Modal
        isOpen={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        title="Deactivate Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              Are you absolutely sure?
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-2">
              This action cannot be undone. All your conversations and messages
              will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeactivate(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeactivate}
              className="flex-1"
            >
              Yes, Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

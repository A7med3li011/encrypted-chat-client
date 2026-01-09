'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import {
  ArrowLeft,
  User,
  MapPin,
  Smartphone,
  Key,
  AlertTriangle,
  Save,
  Eye,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, clearAuth } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(false);

  const [formData, setFormData] = useState({
    userName: user?.userName || '',
    location: user?.location || '',
    deviceType: user?.deviceType || '',
  });

  const [recoveryData, setRecoveryData] = useState<{
    accountId: string;
    accountIdQR: string;
    recoveryPassword: string;
    recoveryPasswordQR: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.userName || '',
        location: user.location || '',
        deviceType: user.deviceType || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await usersApi.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewRecovery = async () => {
    setIsLoadingRecovery(true);
    try {
      const response = await authApi.getRecoveryCredentials();
      setRecoveryData(response.data);
      setShowRecovery(true);
    } catch (error) {
      console.error('Failed to load recovery credentials:', error);
    } finally {
      setIsLoadingRecovery(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await usersApi.deactivateAccount();
      clearAuth();
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to deactivate account:', error);
    }
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
              onClick={() => router.push('/dashboard')}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Profile Information
                </h2>
                {!isEditing ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          userName: user.userName || '',
                          location: user.location || '',
                          deviceType: user.deviceType || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      isLoading={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  {isEditing ? (
                    <Input
                      name="userName"
                      value={formData.userName}
                      onChange={handleChange}
                      placeholder="Username"
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Username
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {user.userName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  {isEditing ? (
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Location"
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Location
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {user.location || 'Not set'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Smartphone className="text-gray-400" size={20} />
                  {isEditing ? (
                    <Input
                      name="deviceType"
                      value={formData.deviceType}
                      onChange={handleChange}
                      placeholder="Device Type"
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Device Type
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {user.deviceType || 'Not set'}
                      </p>
                    </div>
                  )}
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

          {/* Recovery Credentials */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recovery Credentials
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View your Account ID and Recovery Password. Keep them safe as they
                are required to access your account.
              </p>
              <Button
                variant="secondary"
                onClick={handleViewRecovery}
                isLoading={isLoadingRecovery}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                View Recovery Credentials
              </Button>
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
                Deactivating your account will remove your access and delete all your
                conversations and messages. This action cannot be undone.
              </p>
              <Button
                variant="danger"
                onClick={() => setShowDeactivate(true)}
              >
                Deactivate Account
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recovery Credentials Modal */}
      <Modal
        isOpen={showRecovery}
        onClose={() => setShowRecovery(false)}
        title="Recovery Credentials"
        size="xl"
      >
        {recoveryData && (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Keep these credentials safe!
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                Your recovery password is the only way to access your account. Store
                it securely offline.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <QRCodeDisplay
                value={recoveryData.accountId}
                label="Account ID"
              />
              <QRCodeDisplay
                value={recoveryData.recoveryPassword}
                label="Recovery Password"
              />
            </div>
          </div>
        )}
      </Modal>

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
              This action cannot be undone. All your conversations and messages will
              be permanently deleted.
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

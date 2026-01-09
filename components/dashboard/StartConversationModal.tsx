'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { conversationsApi } from '@/lib/api/conversations';
import { usersApi } from '@/lib/api/users';
import { AlertCircle, Search, UserPlus } from 'lucide-react';

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StartConversationModal: React.FC<StartConversationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [foundUser, setFoundUser] = useState<{
    userName: string;
    accountId: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!accountId.trim()) {
      setError('Please enter an Account ID');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundUser(null);

    try {
      const response = await usersApi.getUserByAccountId(accountId.trim());
      setFoundUser({
        userName: response.data.userName,
        accountId: response.data.accountId,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async () => {
    if (!accountId.trim()) {
      setError('Please enter an Account ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await conversationsApi.startConversation(accountId.trim());
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to start conversation. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAccountId('');
    setError('');
    setFoundUser(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Start New Conversation">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            label="Account ID"
            type="text"
            placeholder="Enter the user's Account ID"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setError('');
              setFoundUser(null);
            }}
            helperText="Enter the 12-character Account ID of the person you want to chat with"
          />
          <Button
            variant="secondary"
            onClick={handleSearch}
            isLoading={isSearching}
            className="mt-6 flex items-center gap-2"
          >
            <Search size={16} />
            Search
          </Button>
        </div>

        {foundUser && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {foundUser.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {foundUser.userName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {foundUser.accountId}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStartConversation}
            isLoading={isLoading}
            disabled={!foundUser}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Start Conversation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

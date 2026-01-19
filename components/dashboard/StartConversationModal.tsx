"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

import { AlertCircle, UserPlus } from "lucide-react";
import { StartConversation } from "@/lib/action/conversation.action";

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
  const [accountId, setAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [foundUser, setFoundUser] = useState<{
    userName: string;
    accountId: string;
  } | null>(null);

  const handleStartConversation = async () => {
    if (!accountId.trim()) {
      setError("Please enter an Account ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await StartConversation(accountId.trim());

      if (!res.success) {
        // Handle failure response
        setError(res.message || "Failed to start conversation");
        return;
      }

      // Handle success response

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to start conversation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAccountId("");
    setError("");
    setFoundUser(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Start New Conversation">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle
              className="text-red-400 shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-sm text-red-400">{error}</p>
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
              setError("");
              setFoundUser(null);
            }}
            helperText="Enter the 12-character Account ID of the person you want to chat with"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStartConversation}
            isLoading={isLoading}
            disabled={!accountId.trim()}
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

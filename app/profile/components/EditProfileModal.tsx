"use client";

import { memo, useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserName: string;
  initialBio: string;
  isUpdating: boolean;
  updateError: string | null;
  onSave: (userName: string, bio: string) => void;
}

function EditProfileModalComponent({
  isOpen,
  onClose,
  initialUserName,
  initialBio,
  isUpdating,
  updateError,
  onSave,
}: EditProfileModalProps) {
  const [editUserName, setEditUserName] = useState(initialUserName);
  const [editBio, setEditBio] = useState(initialBio);

  useEffect(() => {
    if (isOpen) {
      setEditUserName(initialUserName);
      setEditBio(initialBio);
    }
  }, [isOpen, initialUserName, initialBio]);

  const handleSave = () => {
    onSave(editUserName, editBio);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <Input
          label="Username"
          value={editUserName}
          onChange={(e) => setEditUserName(e.target.value)}
          placeholder="Enter your username"
          maxLength={50}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={200}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500 resize-none"
          />
          <p className="mt-1 text-sm text-gray-400">
            {editBio.length}/200 characters
          </p>
        </div>

        {updateError && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-200">{updateError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const EditProfileModal = memo(EditProfileModalComponent);

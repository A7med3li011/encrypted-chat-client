"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/lib/types/message";
import { formatTime } from "@/lib/utils/dateUtils";
import { Check, CheckCheck, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { editMessage, deleteMessage } from "@/lib/action/chat.action";
import { useChatStore } from "@/lib/store/useChatStore";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
}) => {
  const { accessToken } = useAuthStore();
  const { updateMessage, removeMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate if message can be edited (within 30 minutes)
  const canEdit = () => {
    if (!isOwn) return false;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const thirtyMinutesInMs = 30 * 60 * 1000;
    return messageAge <= thirtyMinutesInMs;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setShowMenu(false);
    setEditContent(message.content);
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
    setError(null);
  };

  const handleSubmitEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await editMessage(message._id, editContent, accessToken || undefined);

      if (response.success && response.data) {
        updateMessage(message._id, {
          content: editContent,
          isEdited: true,
          editedAt: new Date().toISOString(),
        });
        setIsEditing(false);
      } else {
        setError(response.error?.message || "Failed to edit message");
      }
    } catch (err) {
      setError("Failed to edit message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteMessage(message._id, accessToken || "");

      if (response.success) {
        removeMessage(message._id);
        setShowDeleteConfirm(false);
      } else {
        setError(response.error?.message || "Failed to delete message");
      }
    } catch (err) {
      setError("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case "sent":
        return <Check size={14} className="text-white" />;
      case "delivered":
        return <CheckCheck size={14} className="text-white" />;
      case "read":
        return <CheckCheck size={14} className="text-white" />;
      default:
        return null;
    }
  };

  // Calculate remaining edit time
  const getRemainingEditTime = () => {
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const remaining = thirtyMinutesInMs - messageAge;
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m left to edit`;
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div className="relative flex items-center gap-1">
        {/* Menu button - show for own messages */}
        {isOwn && !isEditing && !showDeleteConfirm && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded"
            >
              <MoreVertical size={16} className="text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                {canEdit() && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-t-lg"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-700">
                      {getRemainingEditTime()}
                    </div>
                  </>
                )}
                <button
                  onClick={handleDeleteClick}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 ${canEdit() ? "border-t border-gray-700" : "rounded-t-lg"} rounded-b-lg`}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isOwn
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-100"
          } ${isEditing || showDeleteConfirm ? "min-w-50" : ""}`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="w-full bg-blue-700 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300"
              />
              {error && (
                <p className="text-xs text-red-300">{error}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="text-xs text-blue-200 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={isSubmitting || !editContent.trim()}
                  className="text-xs bg-blue-800 hover:bg-blue-900 px-2 py-1 rounded disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="text-sm">Delete this message?</p>
              {error && (
                <p className="text-xs text-red-300">{error}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="text-xs text-blue-200 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm break-words">{message.content}</p>
              <div
                className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                  isOwn ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {message.isEdited && (
                  <span className="italic mr-1">edited</span>
                )}
                <span>{formatTime(message.createdAt)}</span>
                {getStatusIcon()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

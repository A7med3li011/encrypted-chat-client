"use client";

import React from "react";
import { Message } from "@/lib/api/messages";
import { formatTime } from "@/lib/utils/dateUtils";
import { Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
}) => {
  console.log(message);
  const user = useAuthStore((state) => state.user);
  console.log(user);
  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case "sent":
        return <Check size={14} className="text-white" />;
      case "delivered":
        return <CheckCheck size={14} className="text-white" />;
      case "read":
        return <CheckCheck size={14} className="text-black" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

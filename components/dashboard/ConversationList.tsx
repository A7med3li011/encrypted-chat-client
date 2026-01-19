"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Conversation } from "@/lib/types/conversation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { MessageCircle, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils/dateUtils";
import Image from "next/image";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
}) => {
  const user = useAuthStore((state) => state.user);

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(conversationId);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(
      (p) => p.accountId !== user?.accountId,
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm">Start a new conversation to get started</p>
      </div>
    );
  }
 
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = conversation._id === selectedConversationId;

        return (
          <Card
            key={conversation._id}
            className={`cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-lg"
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {!otherParticipant?.profilePic ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {otherParticipant?.userName?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                  ) : (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SOCKET_URL}${otherParticipant?.profilePic}`}
                      height={48}
                      width={48}
                      alt="user image"
                      className="rounded-full object-cover object-center w-12 h-12"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100  truncate">
                      {otherParticipant?.userName || "Unknown User"}
                    </h3>
                    {/* <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage?.content || "No messages yet"}
                    </p> */}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {conversation.lastMessageAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      <span>
                        {formatDistanceToNow(conversation.lastMessageAt)}
                      </span>
                    </div>
                  )}
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => handleDelete(e, conversation._id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

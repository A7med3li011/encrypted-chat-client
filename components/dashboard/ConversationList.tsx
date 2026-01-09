'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Conversation } from '@/lib/api/conversations';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/dateUtils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
}) => {
  const user = useAuthStore((state) => state.user);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== user?._id);
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
              isSelected
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {otherParticipant?.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {otherParticipant?.userName || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
                {conversation.lastMessageAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-2">
                    <Clock size={12} />
                    <span>{formatDistanceToNow(conversation.lastMessageAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

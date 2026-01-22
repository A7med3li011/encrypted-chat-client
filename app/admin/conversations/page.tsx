"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore, Conversation, Message } from "@/lib/store/useAdminStore";
import {
  getConversations,
  deleteConversation,
  clearConversationMessages,
  getConversationMessages,
  flagMessage,
  deleteMessage,
} from "@/lib/action/admin.action";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Flag,
  AlertTriangle,
  User,
  Eraser,
} from "lucide-react";

interface MessagesModalProps {
  conversation: Conversation;
  onClose: () => void;
  accessToken: string;
}

function MessagesModal({ conversation, onClose, accessToken }: MessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const { showToast } = useToast();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const response = await getConversationMessages(accessToken, conversation._id, page);
    if (response.success && response.data) {
      const data = response.data as { messages: Message[]; pagination: any };
      setMessages(data.messages);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [accessToken, conversation._id, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleFlagMessage = async (messageId: string, flagged: boolean) => {
    const response = await flagMessage(accessToken, messageId, flagged, flagged ? "Flagged by admin" : "");
    if (response.success) {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, flagged } : m))
      );
      showToast(`Message ${flagged ? "flagged" : "unflagged"}`, "success");
    } else {
      showToast(response.error?.message || "Failed to flag message", "error");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const response = await deleteMessage(accessToken, messageId);
    if (response.success) {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      showToast("Message deleted", "success");
    } else {
      showToast(response.error?.message || "Failed to delete message", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">Conversation Messages</h3>
            <p className="text-sm text-gray-400">
              Between {conversation.participants.map((p) => p.userName || "Unknown").join(" & ")}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No messages in this conversation</div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`p-3 rounded-lg ${
                    message.flagged ? "bg-red-500/10 border border-red-500/20" : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {(message.senderId as any)?.userName || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        {message.flagged && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                            Flagged
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span className="text-xs text-gray-400 uppercase">
                          [{message.messageType}]
                        </span>
                        {message.encryptedContent ? (
                          <p className="text-sm text-gray-300 mt-1 break-all font-mono text-xs">
                            [Encrypted content]
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic mt-1">
                            Content not available (metadata only)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFlagMessage(message._id, !message.flagged)}
                        className={`p-1.5 rounded transition-colors ${
                          message.flagged
                            ? "text-red-400 hover:bg-red-500/20"
                            : "text-gray-400 hover:bg-gray-600"
                        }`}
                        title={message.flagged ? "Unflag" : "Flag"}
                      >
                        <Flag size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Page {page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const { accessToken } = useAuthStore();
  const {
    conversations,
    conversationsPagination,
    conversationsLoading,
    setConversations,
    setConversationsLoading,
    removeConversationFromList,
  } = useAdminStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<Conversation | null>(null);
  const [clearingConversation, setClearingConversation] = useState<Conversation | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;

    setConversationsLoading(true);
    const response = await getConversations(accessToken, {
      page,
      limit: 20,
      search,
    });

    if (response.success && response.data) {
      const data = response.data as { conversations: Conversation[]; pagination: any };
      setConversations(data.conversations, data.pagination);
    } else {
      showToast(response.error?.message || "Failed to load conversations", "error");
    }
    setConversationsLoading(false);
  }, [accessToken, page, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchConversations();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!accessToken) return;

    const response = await deleteConversation(accessToken, conversationId);
    if (response.success) {
      removeConversationFromList(conversationId);
      showToast("Conversation deleted successfully", "success");
    } else {
      showToast(response.error?.message || "Failed to delete conversation", "error");
    }
    setDeletingConversation(null);
  };

  const handleClearMessages = async (conversationId: string) => {
    if (!accessToken) return;

    const response = await clearConversationMessages(accessToken, conversationId);
    if (response.success) {
      showToast(response.message || "Messages cleared successfully", "success");
      fetchConversations(); // Refresh to update last message info
    } else {
      showToast(response.error?.message || "Failed to clear messages", "error");
    }
    setClearingConversation(null);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Conversations List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        {conversationsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {conversations.map((conversation) => (
              <div key={conversation._id} className="p-4 hover:bg-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {conversation.participants.slice(0, 2).map((participant, idx) => (
                        <div
                          key={participant._id || idx}
                          className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-800"
                        >
                          {participant.profilePic ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_SOCKET_URL}${participant.profilePic}`}
                              alt={participant.userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {conversation.participants
                          .map((p) => p.userName || "Unknown")
                          .join(" & ")}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          Last message:{" "}
                          {conversation.lastMessageAt
                            ? new Date(conversation.lastMessageAt).toLocaleString()
                            : "Never"}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            conversation.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {conversation.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedConversation(conversation)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Messages"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => setClearingConversation(conversation)}
                      className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      title="Clear Messages"
                    >
                      <Eraser size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingConversation(conversation)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Conversation"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {conversationsPagination && conversationsPagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * 20 + 1} to{" "}
              {Math.min(page * 20, conversationsPagination.total)} of{" "}
              {conversationsPagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="flex items-center px-3 text-sm text-gray-400">
                Page {page} of {conversationsPagination.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === conversationsPagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Modal */}
      {selectedConversation && accessToken && (
        <MessagesModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          accessToken={accessToken}
        />
      )}

      {/* Delete Confirmation */}
      {deletingConversation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold text-white">Delete Conversation</h3>
            </div>
            <p className="text-gray-400">
              Are you sure you want to delete this conversation? This will also delete all messages
              and cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeletingConversation(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(deletingConversation._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Messages Confirmation */}
      {clearingConversation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 text-yellow-400 mb-4">
              <Eraser size={24} />
              <h3 className="text-lg font-semibold text-white">Clear Messages</h3>
            </div>
            <p className="text-gray-400">
              Are you sure you want to clear all messages in this conversation? The conversation will
              remain but all messages will be permanently deleted.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Conversation between:{" "}
              <span className="text-white">
                {clearingConversation.participants.map((p) => p.userName || "Unknown").join(" & ")}
              </span>
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setClearingConversation(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearMessages(clearingConversation._id)}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

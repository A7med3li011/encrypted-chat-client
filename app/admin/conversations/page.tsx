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
  setMessageVisibility,
  getMessageEditHistory,
  decryptMessage,
  unhideAllMessages,
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
  EyeOff,
  Flag,
  AlertTriangle,
  User,
  Eraser,
  History,
  Pencil,
} from "lucide-react";

interface MessagesModalProps {
  conversation: Conversation;
  onClose: () => void;
  accessToken: string;
}

interface EditHistoryItem {
  version: number;
  content: string;
  editedAt: string;
}

interface EditHistoryData {
  _id: string;
  currentContent: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  editHistory: EditHistoryItem[];
  totalEdits: number;
  senderId: { userName: string; accountId: string };
}

function EditHistoryModal({ messageId, accessToken, onClose }: { messageId: string; accessToken: string; onClose: () => void }) {
  const [data, setData] = useState<EditHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const response = await getMessageEditHistory(accessToken, messageId);
      if (response.success && response.data) {
        setData(response.data as EditHistoryData);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [accessToken, messageId]);

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <History size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Edit History</h3>
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
          ) : !data ? (
            <div className="text-center py-8 text-gray-400">Failed to load edit history</div>
          ) : (
            <div className="space-y-4">
              {/* Current Version */}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-400">Current Version</span>
                  <span className="text-xs text-gray-500">
                    {data.isEdited ? `Edited ${new Date(data.editedAt!).toLocaleString()}` : "Original"}
                  </span>
                </div>
                <p className="text-sm text-white break-words">{data.currentContent}</p>
              </div>

              {/* Edit History */}
              {data.editHistory.length > 0 && (
                <>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Previous Versions</div>
                  {data.editHistory.map((edit: EditHistoryItem, index: number) => (
                    <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Version {edit.version}</span>
                        <span className="text-xs text-gray-500">{new Date(edit.editedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-300 break-words">{edit.content}</p>
                    </div>
                  ))}
                </>
              )}

              {data.editHistory.length === 0 && !data.isEdited && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  This message has never been edited
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesModal({ conversation, onClose, accessToken }: MessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [editHistoryMessageId, setEditHistoryMessageId] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [decryptingMessageId, setDecryptingMessageId] = useState<string | null>(null);
  const [unhidingAll, setUnhidingAll] = useState(false);
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

  const handleToggleDecrypt = async (messageId: string) => {
    // If already decrypted, hide it (remove from decrypted state)
    if (decryptedMessages[messageId]) {
      setDecryptedMessages((prev: Record<string, string>) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      return;
    }

    // Decrypt the message
    setDecryptingMessageId(messageId);
    const response = await decryptMessage(accessToken, messageId);
    if (response.success && response.data) {
      setDecryptedMessages((prev: Record<string, string>) => ({
        ...prev,
        [messageId]: (response.data as any).content,
      }));
    } else {
      showToast(response.error?.message || "Failed to decrypt message", "error");
    }
    setDecryptingMessageId(null);
  };

  const handleUnhideAllMessages = async () => {
    setUnhidingAll(true);
    const response = await unhideAllMessages(accessToken, conversation._id);
    if (response.success) {
      // Update local state to mark all messages as unhidden
      setMessages((prev: Message[]) =>
        prev.map((m: Message) => ({ ...m, isHidden: false, hiddenAt: undefined, hiddenBy: undefined }))
      );
      showToast(response.message || "All messages unhidden", "success");
    } else {
      showToast(response.error?.message || "Failed to unhide messages", "error");
    }
    setUnhidingAll(false);
  };

  const hiddenCount = messages.filter((m: Message) => m.isHidden).length;
  const filteredMessages = showHidden ? messages : messages.filter((m: Message) => !m.isHidden);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                showHidden
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
              title={showHidden ? "Hide hidden messages from view" : "Show hidden messages in view"}
            >
              {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              {showHidden ? "Showing All" : "Show Hidden"}
            </button>
            {hiddenCount > 0 && (
              <button
                onClick={handleUnhideAllMessages}
                disabled={unhidingAll}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                title="Unhide all hidden messages in this conversation"
              >
                {unhidingAll ? (
                  <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eye size={14} />
                )}
                Unhide All ({hiddenCount})
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {messages.length === 0 ? "No messages in this conversation" : "No visible messages (toggle 'Show Hidden' to see hidden messages)"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message: Message) => {
                const isHidden = message.isHidden;
                const isEdited = message.isEdited;
                return (
                  <div
                    key={message._id}
                    className={`p-3 rounded-lg ${
                      isHidden
                        ? "bg-purple-500/10 border border-purple-500/20 opacity-60"
                        : message.flagged
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {isHidden && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                              Hidden
                            </span>
                          )}
                          {isEdited && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded flex items-center gap-1">
                              <Pencil size={10} />
                              Edited
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-400 uppercase">
                            [{message.messageType}]
                          </span>
                          {message.encryptedContent ? (
                            decryptedMessages[message._id] ? (
                              <p className="text-sm text-gray-200 mt-1 break-words">
                                {decryptedMessages[message._id]}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 italic mt-1">
                                [Encrypted content]
                              </p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1">
                              Content not available (metadata only)
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isEdited && (
                          <button
                            onClick={() => setEditHistoryMessageId(message._id)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="View Edit History"
                          >
                            <History size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleDecrypt(message._id)}
                          disabled={decryptingMessageId === message._id}
                          className={`p-1.5 rounded transition-colors ${
                            decryptedMessages[message._id]
                              ? "text-green-400 hover:bg-green-500/20"
                              : "text-gray-400 hover:bg-gray-600"
                          } ${decryptingMessageId === message._id ? "opacity-50" : ""}`}
                          title={decryptedMessages[message._id] ? "Hide Content" : "Decrypt & Show Content"}
                        >
                          {decryptingMessageId === message._id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : decryptedMessages[message._id] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
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
                );
              })}
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

      {/* Edit History Modal */}
      {editHistoryMessageId && (
        <EditHistoryModal
          messageId={editHistoryMessageId}
          accessToken={accessToken}
          onClose={() => setEditHistoryMessageId(null)}
        />
      )}
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

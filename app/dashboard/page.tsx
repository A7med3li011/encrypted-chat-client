"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useChatStore } from "@/lib/store/useChatStore";

import { StartConversationModal } from "@/components/dashboard/StartConversationModal";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MessageSquarePlus, LogOut, User, RefreshCw } from "lucide-react";

import ChatInterface from "@/components/chat/ChatInterface";
import { ConversationList } from "@/components/dashboard/ConversationList";
import {
  getAllMyConversations,
  DeleteConversations,
} from "@/lib/action/conversation.action";
import { handleLogout as logoutAction } from "@/lib/action/auth.action";
import { Conversation } from "@/lib/types/conversation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const {
    conversations,
    currentConversation,
    setConversations,
    setCurrentConversation,
  } = useChatStore();
  const { showToast } = useToast();

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setError("");

    try {
      const response = await getAllMyConversations("1", "50");

      if (!response.success) {
        setError(response.message || "Failed to load conversations");
        setConversations([]);
        return;
      }

      // Handle the response data structure - data is an array of conversations
      const conversationsData = Array.isArray(response.data)
        ? response.data
        : [];
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      const response = await logoutAction();

      if (!response.success) {
        showToast(response.error?.message || "Failed to logout", "error");
        return;
      }

      showToast(response.message || "Logged out successfully", "success");
      clearAuth();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Failed to logout", "error");
      clearAuth();
      router.push("/auth/login");
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const handleStartConversationSuccess = () => {
    loadConversations();
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);

    try {
      const response = await DeleteConversations(conversationToDelete);

      if (!response.success) {
        showToast(response.message || "Failed to delete conversation", "error");
        setIsDeleting(false);
        return;
      }

      // If the deleted conversation was selected, clear it
      if (currentConversation?._id === conversationToDelete) {
        setCurrentConversation(null);
      }

      showToast("Conversation deleted successfully", "success");

      // Reload conversations to update the list
      await loadConversations();

      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    } catch (err) {
      console.error("Error deleting conversation:", err);
      showToast("Failed to delete conversation", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquarePlus
                  className="text-blue-600 dark:text-blue-400"
                  size={24}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Encrypted Chat
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user?.userName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Conversations
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      isLoading={isRefreshing}
                      className="p-2"
                    >
                      <RefreshCw size={16} />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowStartConversation(true)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquarePlus size={16} />
                      New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-red-600 dark:text-red-400">
                    <p className="text-center mb-4">{error}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={loadConversations}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    selectedConversationId={currentConversation?._id}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                  />
                )}
              </CardBody>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {currentConversation ? (
              <ChatInterface />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquarePlus
                    size={64}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <h3 className="text-xl font-semibold mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-sm">
                    Select a conversation or start a new one to begin chatting
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onSuccess={handleStartConversationSuccess}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setConversationToDelete(null);
        }}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

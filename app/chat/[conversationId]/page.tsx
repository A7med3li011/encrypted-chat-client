"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { getConversationById } from "@/lib/action/conversation.action";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { isAuthenticated } = useAuthStore();
  const { currentConversation, conversations, setCurrentConversation } =
    useChatStore();

  // Check if conversation is already available (from store)
  const hasConversation = currentConversation?._id === conversationId;

  const [isLoading, setIsLoading] = useState(!hasConversation);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // If we already have the conversation, no need to fetch
    if (currentConversation?._id === conversationId) {
      setIsLoading(false);
      return;
    }

    // Try to find conversation in the cached list first
    const cachedConversation = conversations.find(
      (c) => c._id === conversationId,
    );
    if (cachedConversation) {
      setCurrentConversation(cachedConversation);
      setIsLoading(false);
      return;
    }

    // Only fetch from API if not in cache
    loadConversation();
  }, [conversationId, isAuthenticated]);

  const loadConversation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getConversationById(conversationId);

      if (!response.success || !response.data) {
        setError(response.message || "Failed to load conversation");
        return;
      }

      setCurrentConversation(response.data);
    } catch (err) {
      console.error("Error loading conversation:", err);
      setError("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="primary" onClick={handleBack}>
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header with back button */}
      {/* <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </header> */}

      {/* Chat Interface */}
      <div className="flex-1 w-full px-2 sm:px-4 py-2">
        <ChatInterface />
      </div>
    </div>
  );
}

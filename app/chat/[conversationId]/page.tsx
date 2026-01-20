"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { getConversationById } from "@/lib/action/conversation.action";
import {
  getAccessToken,
  handleRefreshToken,
} from "@/lib/action/auth.action";

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
  const [isExpired, setIsExpired] = useState(false);
  const [retry, setRetry] = useState(false);

  // Check for access token on mount
  useEffect(() => {
    async function checkToken() {
      const token = await getAccessToken();
      if (!token) router.push("/auth/login");
    }
    checkToken();
  }, [router]);

  // Handle token refresh when expired
  useEffect(() => {
    async function refreshCookies() {
      try {
        const result = await handleRefreshToken();
        if (result?.success) {
          setRetry((prev) => !prev);
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        router.push("/auth/login");
      } finally {
        setIsExpired(false);
      }
    }
    if (isExpired) {
      refreshCookies();
    }
  }, [isExpired, router]);

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
  }, [conversationId, isAuthenticated, retry]);

  const loadConversation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getConversationById(conversationId);

      if (!response.success || !response.data) {
        // Check for JWT expired error and trigger refresh
        if (response.message === "jwt expired") {
          setIsExpired(true);
          return;
        }
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="primary" onClick={handleBack}>
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Chat Interface */}
      <div className="flex-1 w-full px-2 sm:px-4 py-2">
        <ChatInterface />
      </div>
    </div>
  );
}

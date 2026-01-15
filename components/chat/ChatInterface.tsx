"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useChatStore } from "@/lib/store/useChatStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getMessages, sendMessage } from "@/lib/action/chat.action";
import { MessageBubble } from "./MessageBubble";
import { Send, Loader2 } from "lucide-react";
import { useSocket } from "@/lib/hooks/useSocket";
import { Message } from "@/lib/api/messages";

const MESSAGES_PER_PAGE = 15;

export default function ChatInterface() {
  const {
    currentConversation,
    messages,
    setMessages,
    addMessage,
    prependMessages,
    updateMessage,
  } = useChatStore();
  const user = useAuthStore((state) => state.user);
  const socket = useSocket();

  const [messageText, setMessageText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [userPresence, setUserPresence] = useState<
    Record<string, "online" | "away" | "busy" | "offline">
  >({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousScrollHeightRef = useRef<number>(0);

  // Setup socket event listeners
  useEffect(() => {
    // Handle new incoming messages
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === currentConversation?._id) {
        // Check if message already exists (to prevent duplicates from manual add)
        const messageExists = messages.some((m) => m._id === message._id);

        if (!messageExists) {
          addMessage(message);
        }
      }
    };

    // Handle message status updates
    const handleMessageStatus = (data: {
      messageId: string;
      status: string;
    }) => {
      updateMessage(data.messageId, { status: data.status as any });
    };

    // Handle typing updates
    const handleTypingUpdate = (data: {
      accountId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (data.accountId !== user?.accountId) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return prev.includes(data.userName)
              ? prev
              : [...prev, data.userName];
          } else {
            return prev.filter((name) => name !== data.userName);
          }
        });
      }
    };

    // Handle message deleted
    const handleMessageDeleted = (data: { messageId: string }) => {
      updateMessage(data.messageId, {
        content: "This message was deleted",
      } as any);
    };

    // Handle presence updates
    const handlePresenceUpdate = (data: {
      accountId: string;
      status: "online" | "away" | "busy";
    }) => {
      setUserPresence((prev) => ({
        ...prev,
        [data.accountId]: data.status,
      }));
    };

    // Register event listeners
    socket.on("message:new", handleNewMessage);
    socket.on("message:received", handleNewMessage); // Server sends this instead of message:new
    socket.on("message:status", handleMessageStatus);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("presence:update", handlePresenceUpdate);

    // Cleanup
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:received", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [currentConversation, user, socket, addMessage, updateMessage]);

  useEffect(() => {
    if (currentConversation) {
      setPage(1);
      setHasMore(true);
      loadMessages();
    }
  }, [currentConversation]);

  // Handle scroll event for loading more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
    // Only auto-scroll to bottom for new messages (not when loading more)
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (!isLoadingMore && previousScrollHeightRef.current > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
        container.scrollTop = scrollDiff;
        previousScrollHeightRef.current = 0;
      }
    }
  }, [isLoadingMore]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!currentConversation) return;

    setIsLoadingMessages(true);
    console.log(
      "📄 Loading initial messages - Page: 1, Limit:",
      MESSAGES_PER_PAGE
    );

    try {
      const response = await getMessages(
        currentConversation._id,
        1,
        MESSAGES_PER_PAGE
      );

      if (response.success && response.data) {
        const messagesData = Array.isArray(response.data) ? response.data : [];
        setMessages(messagesData);
        setPage(1);

        // Check if there are more messages using pagination info
        const pagination = response.pagination;
        const totalMessages = pagination?.total || messagesData.length;
        const totalPages = pagination?.pages || 1;
        setHasMore(totalPages > 1);

        console.log("✅ Initial messages loaded:", {
          page: 1,
          messagesLoaded: messagesData.length,
          totalMessages,
          totalPages,
          hasMore: totalPages > 1,
        });
      } else {
        console.error("Failed to load messages:", response.error?.message);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!currentConversation || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    console.log(
      "📄 Loading more messages - Page:",
      nextPage,
      "Limit:",
      MESSAGES_PER_PAGE
    );

    try {
      // Store the current scroll height before loading new messages
      if (messagesContainerRef.current) {
        previousScrollHeightRef.current =
          messagesContainerRef.current.scrollHeight;
      }

      const response = await getMessages(
        currentConversation._id,
        nextPage,
        MESSAGES_PER_PAGE
      );

      if (response.success && response.data) {
        const newMessages = Array.isArray(response.data) ? response.data : [];

        if (newMessages.length > 0) {
          // Prepend new messages to the existing ones
          prependMessages(newMessages);
          setPage(nextPage);

          // Check if there are more messages using pagination info
          const pagination = response.pagination;
          const totalPages = pagination?.pages || 1;
          setHasMore(nextPage < totalPages);

          console.log("✅ More messages loaded:", {
            page: nextPage,
            newMessagesLoaded: newMessages.length,
            totalMessagesNow: messages.length + newMessages.length,
            totalPages,
            hasMore: nextPage < totalPages,
          });
        } else {
          setHasMore(false);
          console.log("🏁 No more messages available");
        }
      } else {
        console.error("Failed to load more messages:", response.error?.message);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !currentConversation || isSending) return;

    setIsSending(true);
    const tempMessage = messageText;
    setMessageText("");

    // Stop typing indicator
    socket.stopTyping(currentConversation._id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Try to send via socket first if connected
    if (socket.isConnected) {
      socket.sendMessage(
        {
          conversationId: currentConversation._id,
          content: tempMessage,
          messageType: "text",
        },
        (response) => {
          if (response.success && response.message) {
            addMessage(response.message);

            // Message added manually for instant feedback
          } else {
            console.error(
              "❌ Failed to send message via socket:",
              response.error
            );
            // Fallback to HTTP
            sendViaHttp(currentConversation._id, tempMessage);
          }
          setIsSending(false);
        }
      );
    } else {
      // Fallback to HTTP if socket is not connected

      await sendViaHttp(currentConversation._id, tempMessage);
      setIsSending(false);
    }
  };

  const sendViaHttp = async (conversationId: string, content: string) => {
    try {
      const response = await sendMessage(conversationId, content);

      if (response.success && response.data) {
        addMessage(response.data);
      } else {
        console.error("Failed to send message:", response.error?.message);
        setMessageText(content);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(content);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    // Handle typing indicator
    if (currentConversation && socket.isConnected) {
      if (value.trim()) {
        // Start typing
        socket.startTyping(currentConversation._id);

        // Reset timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          socket.stopTyping(currentConversation._id);
        }, 3000);
      } else {
        // Stop typing if input is empty
        socket.stopTyping(currentConversation._id);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };

  const getOtherParticipant = () => {
    return currentConversation?.participants.find(
      (p) => p.accountId !== user?.accountId
    );
  };

  const getPresenceColor = (
    status?: "online" | "away" | "busy" | "offline"
  ) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const otherParticipant = getOtherParticipant();
  const otherParticipantStatus = otherParticipant
    ? userPresence[otherParticipant.accountId]
    : undefined;

  if (!currentConversation) {
    return null;
  }

  return (
    <Card className="h-150 flex flex-col">
      {/* Chat Header */}
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {otherParticipant?.userName?.charAt(0).toUpperCase() || "?"}
              </div>
              {otherParticipantStatus && (
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getPresenceColor(
                    otherParticipantStatus
                  )}`}
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {otherParticipant?.userName || "Unknown User"}
              </h3>
              {otherParticipantStatus && (
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {otherParticipantStatus}
                </p>
              )}
            </div>
          </div>
          {socket.isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Live
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardBody
        className="flex-1 overflow-y-auto min-h-0"
        ref={messagesContainerRef}
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Loading indicator for pagination */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Loading more messages...
                </span>
              </div>
            )}
            {/* Show "No more messages" indicator */}
            {!hasMore && messages.length > 0 && (
              <div className="flex items-center justify-center py-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  No more messages
                </span>
              </div>
            )}
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId.accountId === user?.accountId}
              />
            ))}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-4">
                <div className="flex gap-1">
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  >
                    •
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  >
                    •
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  >
                    •
                  </span>
                </div>
                <span>
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardBody>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={handleInputChange}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!messageText.trim() || isSending}
            isLoading={isSending}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            Send
          </Button>
        </form>
        {socket.isConnected && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Connected to server
          </div>
        )}
      </div>
    </Card>
  );
}

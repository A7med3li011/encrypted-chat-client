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

export default function ChatInterface() {
  const { currentConversation, messages, setMessages, addMessage } =
    useChatStore();
  const user = useAuthStore((state) => state.user);
  console.log("Current Conversation:", messages);

  const [messageText, setMessageText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!currentConversation) return;

    setIsLoadingMessages(true);
    try {
      const response = await getMessages(currentConversation._id);
      console.log(response, "res");
      if (response.success && response.data) {
        setMessages(response.data || []);
      } else {
        console.error("Failed to load messages:", response.error?.message);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !currentConversation || isSending) return;

    setIsSending(true);
    const tempMessage = messageText;
    setMessageText("");

    try {
      const response = await sendMessage(currentConversation._id, tempMessage);

      if (response.success && response.data) {
        addMessage(response.data);
      } else {
        console.error("Failed to send message:", response.error?.message);
        setMessageText(tempMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(tempMessage);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = () => {
    return currentConversation?.participants.find(
      (p) => p.accountId !== user?.accountId
    );
  };

  const otherParticipant = getOtherParticipant();

  if (!currentConversation) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {otherParticipant?.userName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {otherParticipant?.userName || "Unknown User"}
            </h3>
            {/* <p className="text-sm text-gray-600 dark:text-gray-400">
              {otherParticipant?.accountId}
            </p> */}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardBody className="flex-1 overflow-y-auto">
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
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId.accountId === user?.accountId}
              />
            ))}
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
            onChange={(e) => setMessageText(e.target.value)}
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
      </div>
    </Card>
  );
}

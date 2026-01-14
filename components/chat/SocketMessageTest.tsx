"use client";

import React from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { useChatStore } from "@/lib/store/useChatStore";

/**
 * Simple test component to verify socket messages are being received and added
 * Add this to your ChatInterface to see real-time socket events
 */
export const SocketMessageTest: React.FC = () => {
  const socket = useSocket();
  const { messages, currentConversation } = useChatStore();

  return (
    <div className="fixed top-4 right-4 w-80 bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-500 rounded-lg shadow-xl p-3 text-xs font-mono z-50">
      <h4 className="font-bold mb-2 text-gray-900 dark:text-white">
        🧪 Socket Message Test
      </h4>

      <div className="space-y-2 text-gray-800 dark:text-gray-200">
        <div>
          <span className="font-semibold">Socket Connected:</span>{" "}
          {socket.isConnected ? "✅ Yes" : "❌ No"}
        </div>

        <div>
          <span className="font-semibold">Current Conversation:</span>{" "}
          {currentConversation?._id || "None"}
        </div>

        <div>
          <span className="font-semibold">Messages Count:</span> {messages.length}
        </div>

        <div className="border-t border-yellow-400 pt-2 mt-2">
          <span className="font-semibold block mb-1">Last 3 Messages:</span>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {messages.slice(-3).map((msg, idx) => (
              <div
                key={msg._id}
                className="bg-white dark:bg-gray-800 p-1 rounded text-xs"
              >
                <div className="font-bold">
                  {idx + 1}. {msg.senderId.userName}
                </div>
                <div className="truncate">{msg.content}</div>
                <div className="text-[10px] text-gray-500">
                  ID: {msg._id.substring(0, 8)}...
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-gray-500 italic">No messages yet</div>
            )}
          </div>
        </div>

        <div className="border-t border-yellow-400 pt-2 mt-2 text-[10px] text-gray-600 dark:text-gray-400">
          <div className="font-semibold mb-1">Check console for:</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>📨 NEW MESSAGE RECEIVED</li>
            <li>📝 Adding message to store</li>
            <li>📤 Sending message via socket</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

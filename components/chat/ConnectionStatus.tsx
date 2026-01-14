"use client";

import React from "react";
import { useSocket } from "@/lib/hooks/useSocket";

export const ConnectionStatus: React.FC = () => {
  const { connectionStatus, isConnected, connect, disconnect } = useSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {getStatusText()}
      </span>
      {!isConnected && (
        <button
          onClick={connect}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

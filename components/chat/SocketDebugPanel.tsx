"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getAccessToken } from "@/lib/action/auth.action";

export const SocketDebugPanel: React.FC = () => {
  const socket = useSocket();
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState<string | null>(null);
  const [envUrl, setEnvUrl] = useState<string>("");

  useEffect(() => {
    // Get token from HTTP-only cookie via server action
    getAccessToken().then(setToken);
    setEnvUrl(process.env.NEXT_PUBLIC_SOCKET_URL || "NOT SET");
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-xl p-4 text-xs font-mono z-50">
      <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-white">
        🔌 Socket Debug Panel
      </h3>

      {/* Connection Status */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              socket.connectionStatus === "connected"
                ? "bg-green-500"
                : socket.connectionStatus === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <span className="font-semibold text-gray-900 dark:text-white">
            Status: {socket.connectionStatus.toUpperCase()}
          </span>
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          Is Connected: {socket.isConnected ? "✅ YES" : "❌ NO"}
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          Socket ID: {socket.socketId || "None"}
        </div>
      </div>

      {/* Environment & Auth */}
      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mb-3">
        <div className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-semibold">Server URL:</span>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs break-all text-gray-800 dark:text-gray-200">
          {envUrl}
        </div>
      </div>

      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mb-3">
        <div className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-semibold">User Authenticated:</span>{" "}
          {user ? "✅ YES" : "❌ NO"}
        </div>
        {user && (
          <div className="text-gray-700 dark:text-gray-300">
            User ID: {user.accountId}
          </div>
        )}
      </div>

      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mb-3">
        <div className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-semibold">Token:</span>{" "}
          {token ? "✅ EXISTS" : "❌ MISSING"}
        </div>
        {token && (
          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs break-all text-gray-800 dark:text-gray-200">
            {token.substring(0, 30)}...
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 space-y-2">
        <button
          onClick={socket.connect}
          disabled={socket.isConnected}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {socket.isConnected ? "Connected" : "Reconnect"}
        </button>
        <button
          onClick={socket.disconnect}
          disabled={!socket.isConnected}
          className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Disconnect
        </button>
      </div>

      {/* Instructions */}
      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3 text-gray-600 dark:text-gray-400">
        <div className="font-semibold mb-1">Check browser console for:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>🔄 useSocket Hook logs</li>
          <li>🔌 Connection attempts</li>
          <li>✅ Success messages</li>
          <li>❌ Error messages</li>
        </ul>
      </div>
    </div>
  );
};

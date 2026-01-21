import { useEffect, useState, useCallback } from "react";
import { socketService, ConnectionStatus } from "../socket/socket.service";
import { useAuthStore } from "../store/useAuthStore";

export const useSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    socketService.getConnectionStatus()
  );
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // Listen for connection status changes
    const handleStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    };

    socketService.on("statusChange", handleStatusChange);

    // Auto-connect if user is authenticated and socket is not connected
    if (user && accessToken && !socketService.isConnected()) {
      const serverUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://3.106.245.235:3003";

      socketService.connect({ serverUrl, token: accessToken });
    } else if (!user || !accessToken) {
      console.log("⚠️ No user authenticated, skipping socket connection");
    } else {
      console.log("✅ Already connected, skipping auto-connect");
    }

    return () => {
      socketService.off("statusChange", handleStatusChange);
    };
  }, [user, accessToken]);

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      console.error("Cannot connect: No token found");
      return;
    }

    const serverUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://3.106.245.235:3003";
    socketService.connect({ serverUrl, token });
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    connectionStatus,
    isConnected: socketService.isConnected(),
    socketId: socketService.getSocketId(),
    connect,
    disconnect,
    sendMessage: socketService.sendMessage.bind(socketService),
    updateMessageStatus: socketService.updateMessageStatus.bind(socketService),
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
    updateStatus: socketService.updateStatus.bind(socketService),
    sendHeartbeat: socketService.sendHeartbeat.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };
};

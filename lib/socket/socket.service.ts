import { io, Socket } from "socket.io-client";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

export interface SocketConfig {
  serverUrl: string;
  token: string;
}

export interface MessageData {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "file" | "audio" | "video";
}

export interface MessageStatusUpdate {
  messageId: string;
  status: "delivered" | "read";
}

export interface TypingData {
  conversationId: string;
  accountId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceData {
  accountId: string;
  status: "online" | "away" | "busy";
}

export class SocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners() {
    // Initialize listener sets for different event types
    const eventTypes = [
      "connection:success",
      "message:new",
      "message:received",
      "message:status",
      "message:deleted",
      "presence:update",
      "typing:update",
      "heartbeat:ack",
      "connect",
      "connect_error",
      "disconnect",
    ];

    eventTypes.forEach((event) => {
      this.listeners.set(event, new Set());
    });
  }

  connect(config: SocketConfig): void {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    this.connectionStatus = "connecting";
    this.notifyStatusChange();

    this.socket = io(config.serverUrl, {
      auth: { token: config.token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.connectionStatus = "connected";
      this.notifyStatusChange();
      this.emit("connect");
    });

    this.socket.on("connection:success", (data) => {
      this.emit("connection:success", data);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ CONNECTION ERROR");
      console.error("  Error:", error.message);
      console.error("  Full error:", error);
      this.connectionStatus = "disconnected";
      this.notifyStatusChange();
      this.emit("connect_error", error);
    });

    this.socket.on("disconnect", (reason) => {
      this.connectionStatus = "disconnected";
      this.notifyStatusChange();
      this.emit("disconnect", reason);
    });

    // Message events
    this.socket.on("message:new", (data) => {
      this.emit("message:new", data);
    });

    this.socket.on("message:received", (data) => {
      this.emit("message:received", data);
    });

    this.socket.on("message:status", (data) => {
      this.emit("message:status", data);
    });

    this.socket.on("message:deleted", (data) => {
      this.emit("message:deleted", data);
    });

    // Presence events
    this.socket.on("presence:update", (data) => {
      this.emit("presence:update", data);
    });

    // Typing events
    this.socket.on("typing:update", (data) => {
      this.emit("typing:update", data);
    });

    // Heartbeat
    this.socket.on("heartbeat:ack", () => {
      this.emit("heartbeat:ack");
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = "disconnected";
      this.notifyStatusChange();
    }
  }

  // Message operations
  sendMessage(data: MessageData, callback?: (response: any) => void): void {
    if (!this.socket?.connected) {
      console.error("Cannot send message: Not connected");
      return;
    }

    this.socket.emit("message:send", data, callback);
  }

  updateMessageStatus(
    data: MessageStatusUpdate,
    callback?: (response: any) => void
  ): void {
    if (!this.socket?.connected) {
      console.error("Cannot update message status: Not connected");
      return;
    }

    this.socket.emit("message:status", data, callback);
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    if (!this.socket?.connected) {
      // Silently return if not connected - typing indicators are not critical
      return;
    }

    this.socket.emit("typing:start", conversationId);
  }

  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) {
      // Silently return if not connected - typing indicators are not critical
      return;
    }

    this.socket.emit("typing:stop", conversationId);
  }

  // Presence
  updateStatus(status: "online" | "away" | "busy"): void {
    if (!this.socket?.connected) {
      console.error("Cannot update status: Not connected");
      return;
    }

    this.socket.emit("status:update", status);
  }

  sendHeartbeat(): void {
    if (!this.socket?.connected) {
      console.error("Cannot send heartbeat: Not connected");
      return;
    }

    this.socket.emit("heartbeat");
  }

  // Event listener management
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  private notifyStatusChange(): void {
    this.emit("statusChange", this.connectionStatus);
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();

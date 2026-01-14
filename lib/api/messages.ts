const API_BASE_URL = "${process.env.NEXT_PUBLIC_API_URL}";

// Helper function to get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper function to create headers
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    accountId: string;
    userName: string;
  };
  receiverId: {
    _id: string;
    accountId: string;
    userName: string;
  };
  content: string;
  encryptedContent?: string;
  messageType: "text" | "image" | "file" | "audio" | "video";
  status: "sent" | "delivered" | "read";
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "file" | "audio" | "video";
}

export const messagesApi = {
  sendMessage: async (
    data: SendMessageData
  ): Promise<{
    success: boolean;
    data: Message;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  },

  getConversationMessages: async (
    conversationId: string
  ): Promise<{
    success: boolean;
    data: Message[];
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/messages/conversation/${conversationId}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`);
    }

    return response.json();
  },

  getUnreadCount: async (): Promise<{
    success: boolean;
    data: { count: number };
  }> => {
    const response = await fetch(`${API_BASE_URL}/messages/unread`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.statusText}`);
    }

    return response.json();
  },

  updateMessageStatus: async (
    messageId: string,
    status: "delivered" | "read"
  ): Promise<{
    success: boolean;
    data: Message;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/messages/${messageId}/status`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update message status: ${response.statusText}`
      );
    }

    return response.json();
  },

  deleteMessage: async (
    messageId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }

    return response.json();
  },
};

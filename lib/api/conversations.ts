"use server";
import { cookies } from "next/headers";

const API_BASE_URL = "http://localhost:3003/api/v1";

// Helper function to get token from localStorage
const getToken = async () => {
  const cookieeees = await cookies();
  const token = cookieeees.get("accessToken") ?? null;
  return token;
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

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    accountId: string;
    userName: string;
    profilePic?: string;
  }[];
  initiatorAccountId: string;
  targetAccountId: string;
  lastMessage?: {
    _id: string;
    content: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const conversationsApi = {
  startConversation: async (
    targetAccountId: string
  ): Promise<{
    success: boolean;
    data: Conversation;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/conversations/start`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ targetAccountId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start conversation: ${response.statusText}`);
    }

    return response.json();
  },

  getConversations: async (): Promise<{
    success: boolean;
    data: Conversation[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.statusText}`);
    }

    return response.json();
  },

  getConversation: async (
    conversationId: string
  ): Promise<{
    success: boolean;
    data: Conversation;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return response.json();
  },

  deleteConversation: async (
    conversationId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }

    return response.json();
  },
};

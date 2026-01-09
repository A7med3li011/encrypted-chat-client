import apiClient from './axios';

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
  startConversation: async (targetAccountId: string): Promise<{
    success: boolean;
    data: Conversation;
    message: string;
  }> => {
    const response = await apiClient.post('/conversations/start', {
      targetAccountId,
    });
    return response.data;
  },

  getConversations: async (): Promise<{
    success: boolean;
    data: Conversation[];
  }> => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<{
    success: boolean;
    data: Conversation;
  }> => {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/conversations/${conversationId}`);
    return response.data;
  },
};

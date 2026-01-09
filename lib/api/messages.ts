import apiClient from './axios';

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
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
}

export const messagesApi = {
  sendMessage: async (data: SendMessageData): Promise<{
    success: boolean;
    data: Message;
    message: string;
  }> => {
    const response = await apiClient.post('/messages', data);
    return response.data;
  },

  getConversationMessages: async (conversationId: string): Promise<{
    success: boolean;
    data: Message[];
  }> => {
    const response = await apiClient.get(`/messages/conversation/${conversationId}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{
    success: boolean;
    data: { count: number };
  }> => {
    const response = await apiClient.get('/messages/unread');
    return response.data;
  },

  updateMessageStatus: async (
    messageId: string,
    status: 'delivered' | 'read'
  ): Promise<{
    success: boolean;
    data: Message;
  }> => {
    const response = await apiClient.patch(`/messages/${messageId}/status`, {
      status,
    });
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};

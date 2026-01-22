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
  isEdited?: boolean;
  editedAt?: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "file" | "audio" | "video";
}

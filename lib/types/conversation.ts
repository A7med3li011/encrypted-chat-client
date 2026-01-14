export interface Conversation {
  _id: string;
  initiatorAccountId: string;
  targetAccountId: string;
  participants: Array<{
    _id: string;
    userName: string;
    accountId: string;
    isActive: boolean;
  }>;
  isActive: boolean;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

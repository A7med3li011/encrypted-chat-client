import { create } from "zustand";
import { Conversation } from "../types/conversation";
import { Message } from "../api/messages";

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setUnreadCount: (count: number) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // Check if message already exists (prevent duplicates)
      const exists = state.messages.some((msg) => msg._id === message._id);

      if (exists) {
        return state;
      }

      return { messages: [...state.messages, message] };
    }),
  prependMessages: (newMessages) =>
    set((state) => {
      // Filter out duplicates
      const existingIds = new Set(state.messages.map((msg) => msg._id));
      const uniqueNewMessages = newMessages.filter(
        (msg) => !existingIds.has(msg._id)
      );

      return { messages: [...uniqueNewMessages, ...state.messages] };
    }),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  clearChat: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      unreadCount: 0,
    }),
}));

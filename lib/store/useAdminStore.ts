import { create } from "zustand";

// Types
export interface User {
  _id: string;
  accountId: string;
  userName: string;
  role: "user" | "admin" | "subadmin";
  permissions?: string[];
  managedUsers?: User[];
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  profilePic?: string;
  bio?: string;
  location?: string;
  deviceType?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: User;
}

export interface Conversation {
  _id: string;
  participants: User[];
  initiatorAccountId: string;
  targetAccountId: string;
  lastMessage?: {
    messageType: string;
    status: string;
    createdAt: string;
  };
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  receiverId: User;
  messageType: string;
  status: string;
  flagged?: boolean;
  flagReason?: string;
  createdAt: string;
  encryptedContent?: string;
  iv?: string;
  authTag?: string;
}

export interface AuditLog {
  _id: string;
  userId?: User;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
  createdAt: string;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    admins: number;
    subadmins: number;
    regularUsers: number;
  };
  growth: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  conversations: {
    total: number;
  };
  messages: {
    total: number;
    thisWeek: number;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Permissions {
  permissions: Record<string, string>;
  groups: Record<string, string[]>;
}

interface AdminState {
  // Users
  users: User[];
  usersPagination: Pagination | null;
  selectedUser: User | null;
  usersLoading: boolean;

  // Deleted Users
  deletedUsers: User[];
  deletedUsersPagination: Pagination | null;
  deletedUsersLoading: boolean;

  // Subadmins
  subadmins: User[];
  subadminsPagination: Pagination | null;
  subadminsLoading: boolean;

  // Conversations
  conversations: Conversation[];
  conversationsPagination: Pagination | null;
  selectedConversation: Conversation | null;
  conversationsLoading: boolean;

  // Messages
  messages: Message[];
  messagesPagination: Pagination | null;
  flaggedMessages: Message[];
  messagesLoading: boolean;

  // Audit Logs
  auditLogs: AuditLog[];
  auditLogsPagination: Pagination | null;
  auditLogsLoading: boolean;

  // Analytics
  systemStats: SystemStats | null;
  userGrowthStats: { date: string; count: number }[];
  messageStats: { date: string; count: number }[];
  topActiveUsers: { _id: string; messageCount: number; userName: string; accountId: string }[];
  analyticsLoading: boolean;

  // Available permissions
  availablePermissions: Permissions | null;

  // Actions
  setUsers: (users: User[], pagination: Pagination) => void;
  setSelectedUser: (user: User | null) => void;
  setUsersLoading: (loading: boolean) => void;
  updateUserInList: (user: User) => void;
  removeUserFromList: (userId: string) => void;

  setDeletedUsers: (users: User[], pagination: Pagination) => void;
  setDeletedUsersLoading: (loading: boolean) => void;
  removeDeletedUserFromList: (userId: string) => void;

  setSubadmins: (subadmins: User[], pagination: Pagination) => void;
  setSubadminsLoading: (loading: boolean) => void;
  updateSubadminInList: (subadmin: User) => void;
  removeSubadminFromList: (subadminId: string) => void;

  setConversations: (conversations: Conversation[], pagination: Pagination) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setConversationsLoading: (loading: boolean) => void;
  removeConversationFromList: (conversationId: string) => void;

  setMessages: (messages: Message[], pagination: Pagination) => void;
  setFlaggedMessages: (messages: Message[], pagination: Pagination) => void;
  setMessagesLoading: (loading: boolean) => void;
  updateMessageInList: (message: Message) => void;
  removeMessageFromList: (messageId: string) => void;

  setAuditLogs: (logs: AuditLog[], pagination: Pagination) => void;
  setAuditLogsLoading: (loading: boolean) => void;

  setSystemStats: (stats: SystemStats) => void;
  setUserGrowthStats: (stats: { date: string; count: number }[]) => void;
  setMessageStats: (stats: { date: string; count: number }[]) => void;
  setTopActiveUsers: (users: { _id: string; messageCount: number; userName: string; accountId: string }[]) => void;
  setAnalyticsLoading: (loading: boolean) => void;

  setAvailablePermissions: (permissions: Permissions) => void;

  // Reset
  resetAdminState: () => void;
}

const initialState = {
  users: [],
  usersPagination: null,
  selectedUser: null,
  usersLoading: false,

  deletedUsers: [],
  deletedUsersPagination: null,
  deletedUsersLoading: false,

  subadmins: [],
  subadminsPagination: null,
  subadminsLoading: false,

  conversations: [],
  conversationsPagination: null,
  selectedConversation: null,
  conversationsLoading: false,

  messages: [],
  messagesPagination: null,
  flaggedMessages: [],
  messagesLoading: false,

  auditLogs: [],
  auditLogsPagination: null,
  auditLogsLoading: false,

  systemStats: null,
  userGrowthStats: [],
  messageStats: [],
  topActiveUsers: [],
  analyticsLoading: false,

  availablePermissions: null,
};

export const useAdminStore = create<AdminState>((set) => ({
  ...initialState,

  // Users
  setUsers: (users, pagination) => set({ users, usersPagination: pagination }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setUsersLoading: (loading) => set({ usersLoading: loading }),
  updateUserInList: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u._id === user._id ? user : u)),
      selectedUser: state.selectedUser?._id === user._id ? user : state.selectedUser,
    })),
  removeUserFromList: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u._id !== userId),
      selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
    })),

  // Deleted Users
  setDeletedUsers: (users, pagination) => set({ deletedUsers: users, deletedUsersPagination: pagination }),
  setDeletedUsersLoading: (loading) => set({ deletedUsersLoading: loading }),
  removeDeletedUserFromList: (userId) =>
    set((state) => ({
      deletedUsers: state.deletedUsers.filter((u) => u._id !== userId),
    })),

  // Subadmins
  setSubadmins: (subadmins, pagination) => set({ subadmins, subadminsPagination: pagination }),
  setSubadminsLoading: (loading) => set({ subadminsLoading: loading }),
  updateSubadminInList: (subadmin) =>
    set((state) => ({
      subadmins: state.subadmins.map((s) => (s._id === subadmin._id ? subadmin : s)),
    })),
  removeSubadminFromList: (subadminId) =>
    set((state) => ({
      subadmins: state.subadmins.filter((s) => s._id !== subadminId),
    })),

  // Conversations
  setConversations: (conversations, pagination) =>
    set({ conversations, conversationsPagination: pagination }),
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  setConversationsLoading: (loading) => set({ conversationsLoading: loading }),
  removeConversationFromList: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c._id !== conversationId),
      selectedConversation:
        state.selectedConversation?._id === conversationId ? null : state.selectedConversation,
    })),

  // Messages
  setMessages: (messages, pagination) => set({ messages, messagesPagination: pagination }),
  setFlaggedMessages: (messages, pagination) =>
    set({ flaggedMessages: messages, messagesPagination: pagination }),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
  updateMessageInList: (message) =>
    set((state) => ({
      messages: state.messages.map((m) => (m._id === message._id ? message : m)),
      flaggedMessages: state.flaggedMessages.map((m) => (m._id === message._id ? message : m)),
    })),
  removeMessageFromList: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
      flaggedMessages: state.flaggedMessages.filter((m) => m._id !== messageId),
    })),

  // Audit Logs
  setAuditLogs: (logs, pagination) => set({ auditLogs: logs, auditLogsPagination: pagination }),
  setAuditLogsLoading: (loading) => set({ auditLogsLoading: loading }),

  // Analytics
  setSystemStats: (stats) => set({ systemStats: stats }),
  setUserGrowthStats: (stats) => set({ userGrowthStats: stats }),
  setMessageStats: (stats) => set({ messageStats: stats }),
  setTopActiveUsers: (users) => set({ topActiveUsers: users }),
  setAnalyticsLoading: (loading) => set({ analyticsLoading: loading }),

  setAvailablePermissions: (permissions) => set({ availablePermissions: permissions }),

  // Reset
  resetAdminState: () => set(initialState),
}));

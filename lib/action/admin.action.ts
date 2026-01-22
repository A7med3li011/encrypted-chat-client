"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ActionResponse<T = unknown> {
  data: T | null;
  message?: string;
  success: boolean;
  error: {
    message: string;
    status: number;
  } | null;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ActionResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: result.message || `Request failed: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    return {
      data: result.data,
      message: result.message,
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      success: false,
      error: {
        message: err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}

// ============ ANALYTICS ============

export async function getSystemStats(token: string) {
  return apiCall("/admin/stats", token);
}

export async function getUserGrowthStats(token: string, days: number = 30) {
  return apiCall(`/admin/stats/user-growth?days=${days}`, token);
}

export async function getMessageStats(token: string, days: number = 30) {
  return apiCall(`/admin/stats/messages?days=${days}`, token);
}

export async function getTopActiveUsers(token: string, limit: number = 10) {
  return apiCall(`/admin/stats/top-users?limit=${limit}`, token);
}

// ============ USER MANAGEMENT ============

interface GetUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  role?: string;
  isActive?: boolean;
}

export async function getUsers(token: string, params: GetUsersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive.toString());

  const query = searchParams.toString();
  return apiCall(`/admin/users${query ? `?${query}` : ""}`, token);
}

export async function getUserById(token: string, userId: string) {
  return apiCall(`/admin/users/${userId}`, token);
}

export async function updateUser(
  token: string,
  userId: string,
  data: { userName?: string; bio?: string; location?: string; deviceType?: string }
) {
  return apiCall(`/admin/users/${userId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(token: string, userId: string, permanent: boolean = false) {
  const query = permanent ? "?permanent=true" : "";
  return apiCall(`/admin/users/${userId}${query}`, token, {
    method: "DELETE",
  });
}

export async function restoreUser(token: string, userId: string) {
  return apiCall(`/admin/users/${userId}/restore`, token, {
    method: "PATCH",
  });
}

export async function getDeletedUsers(token: string, params: GetUsersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiCall(`/admin/users-deleted${query ? `?${query}` : ""}`, token);
}

export async function activateUser(token: string, userId: string) {
  return apiCall(`/admin/users/${userId}/activate`, token, {
    method: "PATCH",
  });
}

export async function deactivateUser(token: string, userId: string) {
  return apiCall(`/admin/users/${userId}/deactivate`, token, {
    method: "PATCH",
  });
}

export async function changeUserRole(
  token: string,
  userId: string,
  role: string,
  permissions?: string[]
) {
  return apiCall(`/admin/users/${userId}/role`, token, {
    method: "PATCH",
    body: JSON.stringify({ role, permissions }),
  });
}

// ============ SUBADMIN MANAGEMENT ============

export async function getSubadmins(token: string, page: number = 1, limit: number = 20) {
  return apiCall(`/admin/subadmins?page=${page}&limit=${limit}`, token);
}

export async function createSubadmin(
  token: string,
  data: { userName: string; permissions?: string[]; managedUsers?: string[] }
) {
  return apiCall("/admin/subadmins", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSubadminPermissions(
  token: string,
  subadminId: string,
  permissions: string[]
) {
  return apiCall(`/admin/subadmins/${subadminId}/permissions`, token, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
  });
}

export async function assignUsersToSubadmin(
  token: string,
  subadminId: string,
  userIds: string[]
) {
  return apiCall(`/admin/subadmins/${subadminId}/assign-users`, token, {
    method: "PATCH",
    body: JSON.stringify({ userIds }),
  });
}

export async function deleteSubadmin(token: string, subadminId: string) {
  return apiCall(`/admin/subadmins/${subadminId}`, token, {
    method: "DELETE",
  });
}

export async function getAvailablePermissions(token: string) {
  return apiCall("/admin/permissions", token);
}

// ============ CONVERSATION MANAGEMENT ============

interface GetConversationsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export async function getConversations(token: string, params: GetConversationsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiCall(`/admin/conversations${query ? `?${query}` : ""}`, token);
}

export async function getConversationById(token: string, conversationId: string) {
  return apiCall(`/admin/conversations/${conversationId}`, token);
}

export async function deleteConversation(token: string, conversationId: string) {
  return apiCall(`/admin/conversations/${conversationId}`, token, {
    method: "DELETE",
  });
}

export async function clearConversationMessages(token: string, conversationId: string) {
  return apiCall(`/admin/conversations/${conversationId}/messages`, token, {
    method: "DELETE",
  });
}

// ============ MESSAGE MANAGEMENT ============

export async function getConversationMessages(
  token: string,
  conversationId: string,
  page: number = 1,
  limit: number = 50
) {
  return apiCall(
    `/admin/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    token
  );
}

export async function getFlaggedMessages(token: string, page: number = 1, limit: number = 20) {
  return apiCall(`/admin/messages/flagged?page=${page}&limit=${limit}`, token);
}

export async function flagMessage(
  token: string,
  messageId: string,
  flagged: boolean,
  flagReason?: string
) {
  return apiCall(`/admin/messages/${messageId}/flag`, token, {
    method: "PATCH",
    body: JSON.stringify({ flagged, flagReason }),
  });
}

export async function deleteMessage(token: string, messageId: string) {
  return apiCall(`/admin/messages/${messageId}`, token, {
    method: "DELETE",
  });
}

export async function setMessageVisibility(token: string, messageId: string, isHidden: boolean) {
  return apiCall(`/admin/messages/${messageId}/visibility`, token, {
    method: "PATCH",
    body: JSON.stringify({ isHidden }),
  });
}

export async function unhideAllMessages(token: string, conversationId: string) {
  return apiCall(`/admin/conversations/${conversationId}/unhide-all`, token, {
    method: "PATCH",
  });
}

export async function getMessageEditHistory(token: string, messageId: string) {
  return apiCall(`/admin/messages/${messageId}/edit-history`, token);
}

export async function decryptMessage(token: string, messageId: string) {
  return apiCall(`/admin/messages/${messageId}/decrypt`, token);
}

// ============ AUDIT LOGS ============

interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(token: string, params: GetAuditLogsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.action) searchParams.set("action", params.action);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiCall(`/audit-logs${query ? `?${query}` : ""}`, token);
}

export async function getAuditLogById(token: string, logId: string) {
  return apiCall(`/audit-logs/${logId}`, token);
}

export async function getUserAuditLogs(token: string, userId: string, page: number = 1) {
  return apiCall(`/audit-logs/user/${userId}?page=${page}`, token);
}

export async function getAuditLogStats(token: string) {
  return apiCall("/audit-logs/stats", token);
}

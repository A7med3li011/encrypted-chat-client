const API_BASE_URL = "http://localhost:3003/api/v1";

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

export interface User {
  _id: string;
  accountId: string;
  userName: string;
  location?: string;
  deviceType?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  profilePic?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  userName?: string;
  location?: string;
  deviceType?: string;
}

export const usersApi = {
  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.statusText}`);
    }

    return response.json();
  },

  updateProfile: async (
    data: UpdateProfileData
  ): Promise<{ success: boolean; data: User }> => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }

    return response.json();
  },

  getUserByAccountId: async (
    accountId: string
  ): Promise<{ success: boolean; data: User }> => {
    const response = await fetch(`${API_BASE_URL}/users/account/${accountId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  },

  deactivateAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/deactivate`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to deactivate account: ${response.statusText}`);
    }

    return response.json();
  },
};

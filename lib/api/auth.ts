"use server";
const API_BASE_URL = "http://localhost:3003/api/v1";

// Helper function to get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper function to create headers
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

export interface RegisterData {
  userName: string;
  location: string;
  deviceType: string;
}

export interface LoginData {
  recoveryPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accountId: string;
    userName: string;
    accountIdQR: string;
    recoveryPassword: string;
    recoveryPasswordQR: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RecoveryResponse {
  success: boolean;
  data: {
    accountId: string;
    accountIdQR: string;
    recoveryPassword: string;
    recoveryPasswordQR: string;
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    console.log(response.json());
    return response.json();
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return response.json();
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }

    return response.json();
  },

  getRecoveryCredentials: async (): Promise<RecoveryResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/recovery`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get recovery credentials: ${response.statusText}`
      );
    }

    return response.json();
  },
};

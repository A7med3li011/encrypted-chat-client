import apiClient from "./axios";

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
  };
  token: string;
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
    console.log(data);
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  getRecoveryCredentials: async (): Promise<RecoveryResponse> => {
    const response = await apiClient.get("/auth/recovery");
    return response.data;
  },
};

import apiClient from './axios';

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
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (
    data: UpdateProfileData
  ): Promise<{ success: boolean; data: User }> => {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  },

  getUserByAccountId: async (
    accountId: string
  ): Promise<{ success: boolean; data: User }> => {
    const response = await apiClient.get(`/users/account/${accountId}`);
    return response.data;
  },

  deactivateAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete('/users/deactivate');
    return response.data;
  },
};

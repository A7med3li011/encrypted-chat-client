import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id?: string;
  userName?: string;
  accountId?: string;
  profilePic?: string | null;
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken?: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          isAuthenticated: true,
          ...(accessToken && { accessToken }),
          ...(refreshToken && { refreshToken }),
        });
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      updateUser: (user) => set({ user }),
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

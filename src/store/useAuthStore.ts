import { create } from "zustand";

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  initials?: string;
  tenant_id?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  fetchUser: async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const userData = await res.json();
        set({ user: userData, isAuthenticated: true, isCheckingAuth: false });
      } else {
        if (typeof window !== "undefined") localStorage.removeItem("token");
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      }
    } catch (error) {
      console.error("Auth check failed", error);
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    if (typeof window !== "undefined") window.location.href = "/login";
  },
}));

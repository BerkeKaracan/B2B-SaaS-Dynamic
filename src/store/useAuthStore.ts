import { create } from "zustand";

interface User {
  id?: string;
  user_id?: string;
  email: string;
  role: string;
  full_name?: string;
  initials?: string;
  tenant_id?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { full_name: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
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
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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

  updateProfile: async (data) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No token found");

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update profile");

    set((state) => ({
      user: state.user ? { ...state.user, full_name: data.full_name } : null,
    }));
  },

  uploadAvatar: async (file) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No token found");

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload avatar");

    const data = await res.json();

    set((state) => ({
      user: state.user ? { ...state.user, avatar_url: data.avatar_url } : null,
    }));

    return data.avatar_url;
  },
}));

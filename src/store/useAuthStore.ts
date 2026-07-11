import { create } from 'zustand';
import Cookies from 'js-cookie';
import { fetchAPI } from '@/services/api';

export interface User {
  id?: string;
  user_id?: string;
  email: string;
  role: string;
  full_name?: string;
  initials?: string;
  tenant_id?: string;
  avatar_url?: string;
  custom_role_name?: string | null;
  department_name?: string | null;
  job_title?: string | null;
  timezone?: string | null;
}

export interface UpdateProfilePayload {
  full_name?: string;
  job_title?: string;
  timezone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  fetchUser: (tenantId?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  updatePassword: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  fetchUser: async (tenantId?: string) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        return;
      }

      const options: RequestInit = {};

      const activeTenantId =
        tenantId ||
        Cookies.get('tenant_id') ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('tenant_id')
          : null);

      if (activeTenantId) {
        options.headers = { 'x-tenant-id': activeTenantId };
      }

      const res = await fetchAPI('/api/auth/me', options);

      if (res.ok) {
        const userData: User = await res.json();
        set({ user: userData, isAuthenticated: true, isCheckingAuth: false });
      } else {
        Cookies.remove('token');
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      }
    } catch (error) {
      console.error('Auth check failed', error);
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('tenant_id');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant_id');
    }

    set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    if (typeof window !== 'undefined') window.location.href = '/';
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    const activeTenantId =
      Cookies.get('tenant_id') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('tenant_id')
        : null);

    const headers: Record<string, string> = {};
    if (activeTenantId) {
      headers['x-tenant-id'] = activeTenantId;
    }

    const res = await fetchAPI('/api/auth/me', {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update profile');

    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  uploadAvatar: async (file) => {
    const token = Cookies.get('token');
    if (!token) throw new Error('No token found');

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to upload avatar');

    const data = await res.json();

    set((state) => ({
      user: state.user ? { ...state.user, avatar_url: data.avatar_url } : null,
    }));

    return data.avatar_url;
  },

  updatePassword: async (password) => {
    const res = await fetchAPI('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update password');
    }
  },
}));

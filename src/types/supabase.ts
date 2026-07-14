export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          target_email: string;
          title: string;
          type: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          target_email: string;
          title: string;
          type?: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          target_email?: string;
          title?: string;
          type?: string;
        };
      };
      records: {
        Row: {
          created_at: string | null;
          id: string;
          is_global_public: boolean | null;
          module_name: string;
          record_data: Json;
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_global_public?: boolean | null;
          module_name: string;
          record_data?: Json;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_global_public?: boolean | null;
          module_name?: string;
          record_data?: Json;
          tenant_id?: string | null;
          updated_at?: string | null;
        };
      };
      tenants: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          timezone: string | null;
          logo_url: string | null;
          currency: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          timezone?: string | null;
          logo_url?: string | null;
          currency?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          timezone?: string | null;
          logo_url?: string | null;
          currency?: string | null;
        };
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: string;
          job_title: string | null;
          timezone: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: string;
          job_title?: string | null;
          timezone?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: string;
          job_title?: string | null;
          timezone?: string | null;
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

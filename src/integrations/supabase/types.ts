export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          logo_url: string | null
          manager_id: string | null
          name: string
          region: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          logo_url?: string | null
          manager_id?: string | null
          name: string
          region?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          logo_url?: string | null
          manager_id?: string | null
          name?: string
          region?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          metadata: Json
          prev_hash: string
          row_hash: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: number
          metadata?: Json
          prev_hash?: string
          row_hash: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: number
          metadata?: Json
          prev_hash?: string
          row_hash?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email_hash: string
          id: number
          ip_hash: string | null
          reason: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email_hash: string
          id?: number
          ip_hash?: string | null
          reason?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string
          id?: number
          ip_hash?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      player_progress_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          note: string
          player_id: string
          rating: number | null
          scout_id: string
          tracking_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          note: string
          player_id: string
          rating?: number | null
          scout_id: string
          tracking_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          note?: string
          player_id?: string
          rating?: number | null
          scout_id?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_progress_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_progress_entries_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "scout_tracked_players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          academy_id: string | null
          achievements: string[]
          age: number
          bio: string | null
          created_at: string
          created_by: string | null
          foot: string | null
          height_cm: number | null
          id: string
          name: string
          photo_url: string | null
          position: string
          potential: number
          rating: number
          region: string | null
          sex: string
          stats: Json
          user_id: string | null
          verified: boolean
          weight_kg: number | null
        }
        Insert: {
          academy_id?: string | null
          achievements?: string[]
          age?: number
          bio?: string | null
          created_at?: string
          created_by?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: string
          name: string
          photo_url?: string | null
          position?: string
          potential?: number
          rating?: number
          region?: string | null
          sex?: string
          stats?: Json
          user_id?: string | null
          verified?: boolean
          weight_kg?: number | null
        }
        Update: {
          academy_id?: string | null
          achievements?: string[]
          age?: number
          bio?: string | null
          created_at?: string
          created_by?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: string
          potential?: number
          rating?: number
          region?: string | null
          sex?: string
          stats?: Json
          user_id?: string | null
          verified?: boolean
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          inactivity_alerted_at: string | null
          last_active_at: string
          phone: string | null
          region: string | null
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          inactivity_alerted_at?: string | null
          last_active_at?: string
          phone?: string | null
          region?: string | null
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          inactivity_alerted_at?: string | null
          last_active_at?: string
          phone?: string | null
          region?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      scout_tracked_players: {
        Row: {
          ends_at: string
          id: string
          note: string | null
          player_id: string
          scout_id: string
          started_at: string
        }
        Insert: {
          ends_at?: string
          id?: string
          note?: string | null
          player_id: string
          scout_id: string
          started_at?: string
        }
        Update: {
          ends_at?: string
          id?: string
          note?: string | null
          player_id?: string
          scout_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_tracked_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_invitations: {
        Row: {
          academy_id: string | null
          created_at: string
          id: string
          invited_by: string
          location: string | null
          message: string | null
          player_id: string
          status: string
          trial_date: string | null
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          id?: string
          invited_by: string
          location?: string | null
          message?: string | null
          player_id: string
          status?: string
          trial_date?: string | null
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          location?: string | null
          message?: string | null
          player_id?: string
          status?: string
          trial_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_invitations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_invitations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          kind: string
          player_id: string | null
          title: string
          uploaded_by: string | null
          url: string
          views: number
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          kind?: string
          player_id?: string | null
          title: string
          uploaded_by?: string | null
          url: string
          views?: number
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          kind?: string
          player_id?: string | null
          title?: string
          uploaded_by?: string | null
          url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_audit_log: {
        Args: {
          _action: string
          _metadata?: Json
          _target_id?: string
          _target_type?: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recent_failed_logins: {
        Args: { _email_hash: string; _window_minutes?: number }
        Returns: number
      }
      touch_activity: { Args: never; Returns: undefined }
      verify_audit_chain: {
        Args: never
        Returns: {
          actual_hash: string
          broken_at: number
          expected_hash: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "player" | "scout" | "club" | "agent"
      report_status: "open" | "reviewing" | "resolved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coach", "player", "scout", "club", "agent"],
      report_status: ["open", "reviewing", "resolved", "rejected"],
    },
  },
} as const

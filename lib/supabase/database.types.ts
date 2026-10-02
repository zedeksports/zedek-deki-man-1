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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      competitions: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          format: Database["public"]["Enums"]["competition_format"]
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["competition_format"]
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["competition_format"]
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          group_order: number
          id: string
          name: string
          stage_id: string
        }
        Insert: {
          created_at?: string
          group_order?: number
          id?: string
          name: string
          stage_id: string
        }
        Update: {
          created_at?: string
          group_order?: number
          id?: string
          name?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number
          away_team_id: string
          created_at: string
          group_id: string | null
          home_score: number
          home_team_id: string
          id: string
          leg: number | null
          notes: string | null
          round_name: string | null
          scheduled_at: string | null
          season_id: string
          stage_id: string
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_score?: number
          away_team_id: string
          created_at?: string
          group_id?: string | null
          home_score?: number
          home_team_id: string
          id?: string
          leg?: number | null
          notes?: string | null
          round_name?: string | null
          scheduled_at?: string | null
          season_id: string
          stage_id: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string
          created_at?: string
          group_id?: string | null
          home_score?: number
          home_team_id?: string
          id?: string
          leg?: number | null
          notes?: string | null
          round_name?: string | null
          scheduled_at?: string | null
          season_id?: string
          stage_id?: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          is_active: boolean
          is_captain: boolean
          position: string | null
          shirt_number: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_captain?: boolean
          position?: string | null
          shirt_number?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_captain?: boolean
          position?: string | null
          shirt_number?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      season_teams: {
        Row: {
          joined_at: string
          season_id: string
          team_id: string
        }
        Insert: {
          joined_at?: string
          season_id: string
          team_id: string
        }
        Update: {
          joined_at?: string
          season_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          competition_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_teams: {
        Row: {
          created_at: string
          group_id: string | null
          seed: number | null
          stage_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          seed?: number | null
          stage_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          seed?: number | null
          stage_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_teams_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          season_id: string
          stage_order: number
          stage_type: Database["public"]["Enums"]["stage_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          season_id: string
          stage_order?: number
          stage_type: Database["public"]["Enums"]["stage_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          season_id?: string
          stage_order?: number
          stage_type?: Database["public"]["Enums"]["stage_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stages_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          area: string | null
          created_at: string
          founded_year: number | null
          home_venue: string | null
          id: string
          is_active: boolean
          name: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          founded_year?: number | null
          home_venue?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          founded_year?: number | null
          home_venue?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "super_admin"
        | "zedek_admin"
        | "reporter"
        | "team_official"
        | "public_user"
      competition_format: "league" | "group" | "h2h" | "knockout" | "two_leg"
      match_status:
        | "scheduled"
        | "live"
        | "halftime"
        | "finished"
        | "postponed"
        | "cancelled"
        | "suspended"
        | "verified"
      stage_type:
        | "league"
        | "group"
        | "knockout"
        | "quarter_final"
        | "semi_final"
        | "final"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "zedek_admin",
        "reporter",
        "team_official",
        "public_user",
      ],
      competition_format: ["league", "group", "h2h", "knockout", "two_leg"],
      match_status: [
        "scheduled",
        "live",
        "halftime",
        "finished",
        "postponed",
        "cancelled",
        "suspended",
        "verified",
      ],
      stage_type: [
        "league",
        "group",
        "knockout",
        "quarter_final",
        "semi_final",
        "final",
      ],
    },
  },
} as const

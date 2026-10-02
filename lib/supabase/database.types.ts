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
      coaches: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          is_active: boolean
          nationality: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          nationality?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          nationality?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      knockout_tie_legs: {
        Row: {
          away_score: number
          away_team_id: string | null
          created_at: string
          extra_time_played: boolean
          home_score: number
          home_team_id: string | null
          id: string
          leg_number: number
          match_id: string | null
          penalty_winner_team_id: string | null
          resolved_by: string | null
          tie_id: string
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number
          away_team_id?: string | null
          created_at?: string
          extra_time_played?: boolean
          home_score?: number
          home_team_id?: string | null
          id?: string
          leg_number: number
          match_id?: string | null
          penalty_winner_team_id?: string | null
          resolved_by?: string | null
          tie_id: string
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string | null
          created_at?: string
          extra_time_played?: boolean
          home_score?: number
          home_team_id?: string | null
          id?: string
          leg_number?: number
          match_id?: string | null
          penalty_winner_team_id?: string | null
          resolved_by?: string | null
          tie_id?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knockout_tie_legs_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_tie_legs_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_tie_legs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_tie_legs_penalty_winner_team_id_fkey"
            columns: ["penalty_winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_tie_legs_tie_id_fkey"
            columns: ["tie_id"]
            isOneToOne: false
            referencedRelation: "knockout_ties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_tie_legs_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      knockout_ties: {
        Row: {
          away_team_id: string | null
          created_at: string
          home_team_id: string | null
          id: string
          leg_count: number
          next_slot: number | null
          next_tie_id: string | null
          season_id: string
          stage_id: string
          status: string
          tie_number: number
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          leg_count?: number
          next_slot?: number | null
          next_tie_id?: string | null
          season_id: string
          stage_id: string
          status?: string
          tie_number: number
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          away_team_id?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          leg_count?: number
          next_slot?: number | null
          next_tie_id?: string | null
          season_id?: string
          stage_id?: string
          status?: string
          tie_number?: number
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knockout_ties_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_ties_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_ties_next_tie_id_fkey"
            columns: ["next_tie_id"]
            isOneToOne: false
            referencedRelation: "knockout_ties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_ties_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_ties_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knockout_ties_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string
          details: string | null
          event_type: string
          extra_minute: number | null
          id: string
          match_id: string
          minute: number | null
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          event_type: string
          extra_minute?: number | null
          id?: string
          match_id: string
          minute?: number | null
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          event_type?: string
          extra_minute?: number | null
          id?: string
          match_id?: string
          minute?: number | null
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineup_players: {
        Row: {
          created_at: string
          id: string
          lineup_id: string
          player_id: string
          position: string | null
          role: string
          shirt_number: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lineup_id: string
          player_id: string
          position?: string | null
          role?: string
          shirt_number?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lineup_id?: string
          player_id?: string
          position?: string | null
          role?: string
          shirt_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_players_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "match_lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          captain_player_id: string | null
          coach_id: string | null
          created_at: string
          formation: string | null
          id: string
          match_id: string
          submitted_at: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          captain_player_id?: string | null
          coach_id?: string | null
          created_at?: string
          formation?: string | null
          id?: string
          match_id: string
          submitted_at?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          captain_player_id?: string | null
          coach_id?: string | null
          created_at?: string
          formation?: string | null
          id?: string
          match_id?: string
          submitted_at?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_captain_player_id_fkey"
            columns: ["captain_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reports: {
        Row: {
          created_at: string
          id: string
          incidents: string | null
          match_id: string
          reporter_id: string | null
          status: string
          submitted_at: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          incidents?: string | null
          match_id: string
          reporter_id?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          incidents?: string | null
          match_id?: string
          reporter_id?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_statistics: {
        Row: {
          away_corners: number | null
          away_crosses: number | null
          away_fouls: number | null
          away_free_kicks: number | null
          away_goal_kicks: number | null
          away_offsides: number | null
          away_pass_accuracy: number | null
          away_passes: number | null
          away_possession: number | null
          away_saves: number | null
          away_shots: number | null
          away_shots_on_target: number | null
          away_throw_ins: number | null
          away_xg: number | null
          home_corners: number | null
          home_crosses: number | null
          home_fouls: number | null
          home_free_kicks: number | null
          home_goal_kicks: number | null
          home_offsides: number | null
          home_pass_accuracy: number | null
          home_passes: number | null
          home_possession: number | null
          home_saves: number | null
          home_shots: number | null
          home_shots_on_target: number | null
          home_throw_ins: number | null
          home_xg: number | null
          match_id: string
          updated_at: string
        }
        Insert: {
          away_corners?: number | null
          away_crosses?: number | null
          away_fouls?: number | null
          away_free_kicks?: number | null
          away_goal_kicks?: number | null
          away_offsides?: number | null
          away_pass_accuracy?: number | null
          away_passes?: number | null
          away_possession?: number | null
          away_saves?: number | null
          away_shots?: number | null
          away_shots_on_target?: number | null
          away_throw_ins?: number | null
          away_xg?: number | null
          home_corners?: number | null
          home_crosses?: number | null
          home_fouls?: number | null
          home_free_kicks?: number | null
          home_goal_kicks?: number | null
          home_offsides?: number | null
          home_pass_accuracy?: number | null
          home_passes?: number | null
          home_possession?: number | null
          home_saves?: number | null
          home_shots?: number | null
          home_shots_on_target?: number | null
          home_throw_ins?: number | null
          home_xg?: number | null
          match_id: string
          updated_at?: string
        }
        Update: {
          away_corners?: number | null
          away_crosses?: number | null
          away_fouls?: number | null
          away_free_kicks?: number | null
          away_goal_kicks?: number | null
          away_offsides?: number | null
          away_pass_accuracy?: number | null
          away_passes?: number | null
          away_possession?: number | null
          away_saves?: number | null
          away_shots?: number | null
          away_shots_on_target?: number | null
          away_throw_ins?: number | null
          away_xg?: number | null
          home_corners?: number | null
          home_crosses?: number | null
          home_fouls?: number | null
          home_free_kicks?: number | null
          home_goal_kicks?: number | null
          home_offsides?: number | null
          home_pass_accuracy?: number | null
          home_passes?: number | null
          home_possession?: number | null
          home_saves?: number | null
          home_shots?: number | null
          home_shots_on_target?: number | null
          home_throw_ins?: number | null
          home_xg?: number | null
          match_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_statistics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_verifications: {
        Row: {
          corrections: string | null
          created_at: string
          id: string
          locked_at: string | null
          match_id: string
          notes: string | null
          official_result: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          corrections?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          match_id: string
          notes?: string | null
          official_result?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          corrections?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          match_id?: string
          notes?: string | null
          official_result?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_verifications_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      stage_qualification_rules: {
        Row: {
          created_at: string
          from_group_id: string | null
          from_stage_id: string
          id: string
          source_position: number
          target_slot: number | null
          to_stage_id: string
        }
        Insert: {
          created_at?: string
          from_group_id?: string | null
          from_stage_id: string
          id?: string
          source_position: number
          target_slot?: number | null
          to_stage_id: string
        }
        Update: {
          created_at?: string
          from_group_id?: string | null
          from_stage_id?: string
          id?: string
          source_position?: number
          target_slot?: number | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_qualification_rules_from_group_id_fkey"
            columns: ["from_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualification_rules_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualification_rules_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_qualifications: {
        Row: {
          created_at: string
          id: string
          rule_id: string
          season_id: string
          source_group_id: string | null
          source_position: number
          status: string
          target_slot: number | null
          team_id: string
          to_stage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rule_id: string
          season_id: string
          source_group_id?: string | null
          source_position: number
          status?: string
          target_slot?: number | null
          team_id: string
          to_stage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rule_id?: string
          season_id?: string
          source_group_id?: string | null
          source_position?: number
          status?: string
          target_slot?: number | null
          team_id?: string
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_qualifications_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "stage_qualification_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualifications_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualifications_source_group_id_fkey"
            columns: ["source_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_qualifications_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
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
      team_coaches: {
        Row: {
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          start_date: string | null
          team_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          team_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_coaches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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

// Manual type scaffold — replace with `supabase gen types typescript --local` after migration runs.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promises: {
        Row: {
          id: string;
          user_id: string;
          type: 'habit' | 'pledge';
          text: string;
          emoji: string | null;
          status: 'active' | 'archived';
          deadline: string | null;
          reminder_time: string | null;
          created_at: string;
          updated_at: string;
          mode: 'positive' | 'negative' | null;
          time_slot: 'allday' | 'morning' | 'afternoon' | 'evening' | null;
          slot_order: number | null;
          schedule_mode: 'daily' | 'specific_days' | 'weekly_count' | null;
          schedule_days: number[] | null;
          weekly_target: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'habit' | 'pledge';
          text: string;
          emoji?: string | null;
          status?: 'active' | 'archived';
          deadline?: string | null;
          reminder_time?: string | null;
          created_at?: string;
          updated_at?: string;
          mode?: 'positive' | 'negative' | null;
          time_slot?: 'allday' | 'morning' | 'afternoon' | 'evening' | null;
          slot_order?: number | null;
          schedule_mode?: 'daily' | 'specific_days' | 'weekly_count' | null;
          schedule_days?: number[] | null;
          weekly_target?: number | null;
        };
        Update: {
          type?: 'habit' | 'pledge';
          text?: string;
          emoji?: string | null;
          status?: 'active' | 'archived';
          deadline?: string | null;
          reminder_time?: string | null;
          updated_at?: string;
          mode?: 'positive' | 'negative' | null;
          time_slot?: 'allday' | 'morning' | 'afternoon' | 'evening' | null;
          slot_order?: number | null;
          schedule_mode?: 'daily' | 'specific_days' | 'weekly_count' | null;
          schedule_days?: number[] | null;
          weekly_target?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promises_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      habit_entries: {
        Row: {
          id: string;
          promise_id: string;
          user_id: string;
          date: string;
          kept: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          promise_id: string;
          user_id: string;
          date: string;
          kept?: boolean;
          created_at?: string;
        };
        Update: {
          kept?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'habit_entries_promise_id_fkey';
            columns: ['promise_id'];
            isOneToOne: false;
            referencedRelation: 'promises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'habit_entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      streaks: {
        Row: {
          id: string;
          promise_id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_kept_date: string | null;
          grace_days_used: number;
          grace_window_start: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          promise_id: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_kept_date?: string | null;
          grace_days_used?: number;
          grace_window_start?: string | null;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_kept_date?: string | null;
          grace_days_used?: number;
          grace_window_start?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'streaks_promise_id_fkey';
            columns: ['promise_id'];
            isOneToOne: true;
            referencedRelation: 'promises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streaks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          condition_type: string;
          condition_value: number | null;
        };
        Insert: {
          id?: string;
          name?: string;
          description?: string;
          condition_type?: string;
          condition_value?: number | null;
        };
        Update: {
          name?: string;
          description?: string;
          condition_type?: string;
          condition_value?: number | null;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          promise_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          promise_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          event_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

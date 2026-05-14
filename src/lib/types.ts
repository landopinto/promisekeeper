// ── Domain enums ──────────────────────────────────────────────────────────────

export type PromiseType = 'habit' | 'pledge';
export type PromiseStatus = 'active' | 'archived';
export type BadgeConditionType =
  | 'first_keep'
  | 'habit_streak'
  | 'pledge_count'
  | 'monthly_consistency'
  | 'comeback';

export type EventType =
  | 'promise_created'
  | 'promise_kept'
  | 'promise_deferred'
  | 'promise_broken'
  | 'promise_archived'
  | 'streak_extended'
  | 'streak_broken'
  | 'streak_resumed'
  | 'grace_day_used'
  | 'badge_earned';

// ── Database row types (match Supabase schema exactly) ────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPromise {
  id: string;
  user_id: string;
  type: PromiseType;
  text: string;
  emoji: string | null;
  status: PromiseStatus;
  deadline: string | null;       // date string YYYY-MM-DD, pledges only
  reminder_time: string | null;  // HH:MM, habits only (v2)
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  promise_id: string;
  user_id: string;
  date: string;   // YYYY-MM-DD
  kept: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  promise_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_kept_date: string | null;  // YYYY-MM-DD
  grace_days_used: number;
  grace_window_start: string | null;  // YYYY-MM-DD
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  condition_type: BadgeConditionType;
  condition_value: number | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface DbEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  promise_id: string | null;
  payload: import('./database.types').Json | null;
  created_at: string;
}

// ── Insert types (omit server-generated fields) ───────────────────────────────

export type NewPromise = Omit<DbPromise, 'id' | 'created_at' | 'updated_at'>;
export type NewHabitEntry = Omit<HabitEntry, 'id' | 'created_at'>;
export type NewStreak = Omit<Streak, 'id' | 'updated_at'>;
export type NewEvent = Omit<DbEvent, 'id' | 'created_at'>;
export type NewUserBadge = Omit<UserBadge, 'id' | 'earned_at'>;

// ── Rich client-side types (joined data used in UI) ───────────────────────────

export interface PromiseWithStreak extends DbPromise {
  streak?: Streak;
}

export interface BadgeWithStatus extends Badge {
  earned_at: string | undefined;  // undefined = locked
}

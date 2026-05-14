import type { Streak } from './types';

const DAY_MS = 86_400_000;
const GRACE_WINDOW_DAYS = 7;
const GRACE_DAYS_PER_WINDOW = 1;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

export type StreakUpdateResult = {
  next: Omit<Streak, 'id' | 'promise_id' | 'user_id' | 'updated_at'>;
  graceUsed: boolean;
  broken: boolean;
  resumed: boolean;
};

/**
 * Computes the next streak state after a user keeps a promise today.
 * Call this on every successful check-in, then upsert the result to DB.
 */
export function computeKeepStreak(current: Streak): StreakUpdateResult {
  const date = today();
  const last = current.last_kept_date;
  const gap = last ? daysBetween(last, date) : null;

  // Already checked in today — no-op
  if (gap === 0) {
    return {
      next: {
        current_streak: current.current_streak,
        longest_streak: current.longest_streak,
        last_kept_date: current.last_kept_date,
        grace_days_used: current.grace_days_used,
        grace_window_start: current.grace_window_start,
      },
      graceUsed: false,
      broken: false,
      resumed: false,
    };
  }

  const newStreak = (gap === 1 || gap === null) ? current.current_streak + 1 : 1;
  const resumed = current.current_streak === 0 && last !== null;

  return {
    next: {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, current.longest_streak),
      last_kept_date: date,
      grace_days_used: current.grace_days_used,
      grace_window_start: current.grace_window_start,
    },
    graceUsed: false,
    broken: false,
    resumed,
  };
}

/**
 * Computes the next streak state when a day is missed (called at end-of-day
 * or when the user explicitly marks a day missed).
 *
 * Applies a grace day if available in the current 7-day window.
 */
export function computeMissedDay(current: Streak): StreakUpdateResult {
  const date = today();

  // Determine if we're still in the same grace window
  const windowStart = current.grace_window_start;
  const windowAge = windowStart ? daysBetween(windowStart, date) : GRACE_WINDOW_DAYS;
  const inWindow = windowAge < GRACE_WINDOW_DAYS;
  const hasGrace = inWindow
    ? current.grace_days_used < GRACE_DAYS_PER_WINDOW
    : true; // new window resets quota

  if (hasGrace) {
    const newGraceDaysUsed = inWindow ? current.grace_days_used + 1 : 1;
    const newWindowStart = inWindow ? current.grace_window_start! : date;

    return {
      next: {
        current_streak: current.current_streak,
        longest_streak: current.longest_streak,
        last_kept_date: current.last_kept_date,
        grace_days_used: newGraceDaysUsed,
        grace_window_start: newWindowStart,
      },
      graceUsed: true,
      broken: false,
      resumed: false,
    };
  }

  // No grace available — streak breaks
  return {
    next: {
      current_streak: 0,
      longest_streak: current.longest_streak,
      last_kept_date: current.last_kept_date,
      grace_days_used: current.grace_days_used,
      grace_window_start: current.grace_window_start,
    },
    graceUsed: false,
    broken: true,
    resumed: false,
  };
}

export function freshStreak(
  promiseId: string,
  userId: string
): Omit<Streak, 'id' | 'updated_at'> {
  return {
    promise_id: promiseId,
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_kept_date: null,
    grace_days_used: 0,
    grace_window_start: null,
  };
}

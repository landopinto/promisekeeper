import { getSupabaseClient } from './supabase';
import type { Database } from './database.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PromiseType = "habit" | "pledge";
export type HabitMode = "positive" | "negative";
export type TimeSlot = "allday" | "morning" | "afternoon" | "evening";
export type ScheduleMode = "daily" | "specific_days" | "weekly_count";

export type UserPromise = {
  id: string;
  type: PromiseType;
  text: string;
  emoji?: string;
  createdAt: string;
  deadline?: string;
  status: "active" | "archived";
  mode?: HabitMode;
  timeSlot?: TimeSlot;
  slotOrder?: number;
  scheduleMode?: ScheduleMode;
  scheduleDays?: number[];
  weeklyTarget?: number;
};

export type LocalEntry = {
  promiseId: string;
  date: string;
  kept: boolean;
};

export type HabitStats = {
  totalCount: number;
  longestStreak: number;
  topDayOfWeek: string | null;
  topMonth: string | null;
};

export type AppBadge = {
  id: string;
  name: string;
  description: string;
  earnedAt?: string;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

type PromiseRow = Database['public']['Tables']['promises']['Row'];
type EntryRow = Database['public']['Tables']['habit_entries']['Row'];
type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];

function rowToPromise(row: PromiseRow): UserPromise {
  return {
    id: row.id,
    type: row.type,
    text: row.text,
    emoji: row.emoji ?? undefined,
    createdAt: row.created_at,
    deadline: row.deadline ?? undefined,
    status: row.status,
    mode: (row.mode as HabitMode) ?? undefined,
    timeSlot: (row.time_slot as TimeSlot) ?? undefined,
    slotOrder: row.slot_order ?? undefined,
    scheduleMode: (row.schedule_mode as ScheduleMode) ?? undefined,
    scheduleDays: row.schedule_days ?? undefined,
    weeklyTarget: row.weekly_target ?? undefined,
  };
}

function rowToEntry(row: EntryRow): LocalEntry {
  return {
    promiseId: row.promise_id,
    date: row.date,
    kept: row.kept,
  };
}

async function getUserId(): Promise<string> {
  const sb = getSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function prevDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getWeekStart(date: string): string {
  const d = new Date(date + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Async I/O — Promises ──────────────────────────────────────────────────────

export async function fetchPromises(): Promise<UserPromise[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('promises')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPromise);
}

export async function savePromise(p: UserPromise): Promise<void> {
  const sb = getSupabaseClient();
  const userId = await getUserId();
  const { error } = await sb.from('promises').upsert({
    id: p.id,
    user_id: userId,
    type: p.type,
    text: p.text,
    emoji: p.emoji ?? null,
    status: p.status,
    deadline: p.deadline ?? null,
    updated_at: new Date().toISOString(),
    mode: p.mode ?? null,
    time_slot: p.timeSlot ?? null,
    slot_order: p.slotOrder ?? null,
    schedule_mode: p.scheduleMode ?? null,
    schedule_days: p.scheduleDays ?? null,
    weekly_target: p.weeklyTarget ?? null,
  }, { onConflict: 'id' });
  if (error) throw error;
}

// ── Async I/O — Entries ───────────────────────────────────────────────────────

export async function fetchEntries(): Promise<LocalEntry[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('habit_entries')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToEntry);
}

export async function upsertEntry(entry: LocalEntry): Promise<void> {
  const sb = getSupabaseClient();
  const userId = await getUserId();
  const { error } = await sb.from('habit_entries').upsert({
    promise_id: entry.promiseId,
    user_id: userId,
    date: entry.date,
    kept: entry.kept,
  }, { onConflict: 'promise_id,date' });
  if (error) throw error;
}

export async function removeEntry(promiseId: string, date: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('habit_entries')
    .delete()
    .eq('promise_id', promiseId)
    .eq('date', date);
  if (error) throw error;
}

export async function bulkUpsertEntries(entries: LocalEntry[]): Promise<void> {
  if (!entries.length) return;
  const sb = getSupabaseClient();
  const userId = await getUserId();
  const rows = entries.map((e) => ({
    promise_id: e.promiseId,
    user_id: userId,
    date: e.date,
    kept: e.kept,
  }));
  const { error } = await sb.from('habit_entries').upsert(rows, { onConflict: 'promise_id,date' });
  if (error) throw error;
}

// ── Async I/O — Badges ────────────────────────────────────────────────────────

export async function fetchUserBadges(): Promise<AppBadge[]> {
  // Returns the full badge list (from BADGE_DEFS) merged with earned timestamps from user_badges.
  // Import BADGE_DEFS lazily to avoid circular deps — caller merges if needed.
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('user_badges')
    .select('badge_id, earned_at');
  if (error) throw error;
  return (data ?? []).map((row: Pick<UserBadgeRow, 'badge_id' | 'earned_at'>) => ({
    id: row.badge_id,
    name: '',       // filled by caller merging with BADGE_DEFS
    description: '', // filled by caller
    earnedAt: row.earned_at,
  }));
}

export async function awardBadge(badgeId: string): Promise<void> {
  const sb = getSupabaseClient();
  const userId = await getUserId();
  const { error } = await sb.from('user_badges').insert({
    user_id: userId,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  });
  // Ignore unique-constraint violations (badge already awarded)
  if (error && !error.message.includes('duplicate')) throw error;
}

// ── Async I/O — Slot ordering ─────────────────────────────────────────────────

export async function saveSlotOrder(slot: TimeSlot, orderedIds: string[]): Promise<void> {
  const sb = getSupabaseClient();
  const updates = orderedIds.map((id, index) =>
    sb.from('promises').update({ time_slot: slot, slot_order: index, updated_at: new Date().toISOString() }).eq('id', id)
  );
  await Promise.all(updates);
}

export async function moveHabitToSlot(habitId: string, slot: TimeSlot): Promise<void> {
  const sb = getSupabaseClient();
  // Get current max slot_order in the target slot to append at the end
  const { data } = await sb
    .from('promises')
    .select('slot_order')
    .eq('time_slot', slot)
    .order('slot_order', { ascending: false })
    .limit(1);
  const maxOrder = data?.[0]?.slot_order ?? -1;
  const { error } = await sb.from('promises').update({
    time_slot: slot,
    slot_order: maxOrder + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', habitId);
  if (error) throw error;
}

// ── Pure computed functions (sync, take data as params) ───────────────────────

export function isScheduledDay(promise: UserPromise, date: string): boolean {
  if (promise.scheduleMode !== "specific_days") return true;
  if (!promise.scheduleDays?.length) return true;
  const dow = new Date(date + "T00:00:00").getDay();
  return promise.scheduleDays.includes(dow);
}

export function getWeeklyProgress(
  entries: LocalEntry[],
  promiseId: string,
  weeklyTarget: number
): { kept: number; target: number } {
  const today = todayStr();
  const weekStart = getWeekStart(today);
  const kept = entries.filter(
    (e) => e.promiseId === promiseId && e.kept && e.date >= weekStart && e.date <= today
  ).length;
  return { kept, target: weeklyTarget };
}

export function getWeeklyStreak(
  entries: LocalEntry[],
  promiseId: string,
  weeklyTarget: number,
  createdAt: string
): number {
  const kept = entries.filter((e) => e.promiseId === promiseId && e.kept);
  const floor = createdAt.slice(0, 10);
  let streak = 0;
  let weekStart = getWeekStart(todayStr());
  const today = todayStr();

  while (weekStart >= getWeekStart(floor)) {
    const weekEnd = new Date(weekStart + "T00:00:00");
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const isCurrentWeek = weekStart === getWeekStart(today);

    const keptThisWeek = kept.filter((e) => e.date >= weekStart && e.date <= weekEndStr).length;

    if (keptThisWeek >= weeklyTarget) {
      streak++;
    } else if (!isCurrentWeek) {
      break;
    }

    const prev = new Date(weekStart + "T00:00:00");
    prev.setDate(prev.getDate() - 7);
    const newWeekStart = prev.toISOString().slice(0, 10);
    if (newWeekStart === weekStart) break;
    weekStart = newWeekStart;
  }

  return streak;
}

export function getMissedDays(
  entries: LocalEntry[],
  promiseId: string,
  createdAt: string,
  promise?: UserPromise
): LocalEntry[] {
  if (promise?.scheduleMode === "weekly_count") return [];
  const logged = new Set(entries.filter((e) => e.promiseId === promiseId).map((e) => e.date));
  const floor = createdAt.slice(0, 10);
  const toAdd: LocalEntry[] = [];
  let date = prevDay(todayStr());
  while (date >= floor) {
    if (!logged.has(date) && (!promise || isScheduledDay(promise, date))) {
      toAdd.push({ promiseId, date, kept: false });
    }
    date = prevDay(date);
  }
  return toAdd;
}

export function isKeptToday(
  entries: LocalEntry[],
  promiseId: string,
  mode: HabitMode = "positive",
  promise?: UserPromise
): boolean {
  if (promise?.scheduleMode === "weekly_count" && promise.weeklyTarget) {
    const { kept, target } = getWeeklyProgress(entries, promiseId, promise.weeklyTarget);
    return kept >= target;
  }
  const today = todayStr();
  if (mode === "positive") {
    return entries.some((e) => e.promiseId === promiseId && e.date === today && e.kept);
  }
  return !entries.some((e) => e.promiseId === promiseId && e.date === today && !e.kept);
}

export function isPledgeKept(entries: LocalEntry[], promiseId: string): boolean {
  return entries.some((e) => e.promiseId === promiseId && e.kept);
}

export function getStreak(
  entries: LocalEntry[],
  promiseId: string,
  mode: HabitMode = "positive",
  createdAt?: string,
  promise?: UserPromise
): number {
  if (promise?.scheduleMode === "weekly_count" && promise.weeklyTarget) {
    return getWeeklyStreak(entries, promiseId, promise.weeklyTarget, createdAt ?? promise.createdAt);
  }

  const today = todayStr();

  if (mode === "positive") {
    const kept = entries
      .filter((e) => e.promiseId === promiseId && e.kept)
      .map((e) => e.date)
      .sort()
      .reverse();

    if (!kept.length) return 0;

    if (promise?.scheduleMode === "specific_days") {
      let streak = 0;
      let cursor = today;
      for (const date of kept) {
        while (cursor > date) {
          if (isScheduledDay(promise, cursor) && cursor !== today) return streak;
          cursor = prevDay(cursor);
        }
        if (cursor === date) {
          streak++;
          cursor = prevDay(cursor);
        } else {
          break;
        }
      }
      return streak;
    }

    let streak = 0;
    let expected = today;
    for (const date of kept) {
      if (date === expected) {
        streak++;
        expected = prevDay(expected);
      } else if (date < expected) {
        break;
      }
    }
    return streak;
  }

  const slippedDates = new Set(
    entries.filter((e) => e.promiseId === promiseId && !e.kept).map((e) => e.date)
  );
  const floor = createdAt ? createdAt.slice(0, 10) : "1970-01-01";

  let streak = 0;
  let date = today;
  while (date >= floor) {
    if (promise?.scheduleMode === "specific_days" && !isScheduledDay(promise, date)) {
      date = prevDay(date);
      continue;
    }
    if (slippedDates.has(date)) break;
    streak++;
    date = prevDay(date);
  }
  return streak;
}

export function getTotalKept(entries: LocalEntry[]): number {
  return entries.filter((e) => e.kept).length;
}

export function getHabitsInSlot(promises: UserPromise[], slot: TimeSlot): UserPromise[] {
  return promises
    .filter((p) => p.type === "habit" && p.status === "active" && (p.timeSlot ?? "allday") === slot)
    .sort((a, b) => {
      const aOrder = a.slotOrder ?? Infinity;
      const bOrder = b.slotOrder ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

// ── Habit Stats ───────────────────────────────────────────────────────────────

function daysBetweenDates(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86_400_000
  );
}

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] as const;
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"] as const;

function topBucket(dates: string[], getKey: (d: Date) => number, names: readonly string[]): string | null {
  if (!dates.length) return null;
  const counts = new Map<number, number>();
  for (const dateStr of dates) {
    const key = getKey(new Date(dateStr + "T00:00:00"));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = -1, bestCount = 0;
  counts.forEach((v, k) => { if (v > bestCount) { bestCount = v; best = k; } });
  return best === -1 ? null : names[best];
}

export function getHabitStats(
  entries: LocalEntry[],
  promiseId: string,
  mode: HabitMode,
  createdAt: string
): HabitStats {
  const habitEntries = entries.filter((e) => e.promiseId === promiseId);
  const today = todayStr();
  const floor = createdAt.slice(0, 10);

  if (mode === "positive") {
    const keptDates = habitEntries.filter((e) => e.kept).map((e) => e.date);
    const sorted = [...keptDates].sort();
    let longest = 0, run = 0, prev: string | null = null;
    for (const d of sorted) {
      run = prev !== null && daysBetweenDates(prev, d) === 1 ? run + 1 : 1;
      if (run > longest) longest = run;
      prev = d;
    }
    return {
      totalCount: keptDates.length,
      longestStreak: longest,
      topDayOfWeek: topBucket(keptDates, (d) => d.getDay(), DAY_NAMES),
      topMonth: topBucket(keptDates, (d) => d.getMonth(), MONTH_NAMES),
    };
  }

  const slipDates = Array.from(new Set(habitEntries.filter((e) => !e.kept).map((e) => e.date))).sort();
  const segStarts = [floor, ...slipDates.map(nextDay)];
  const segEnds = [...slipDates.map(prevDay), today];
  let longest = 0;
  for (let i = 0; i < segStarts.length; i++) {
    if (segStarts[i] > segEnds[i]) continue;
    const len = daysBetweenDates(segStarts[i], segEnds[i]) + 1;
    if (len > longest) longest = len;
  }
  return {
    totalCount: slipDates.length,
    longestStreak: longest,
    topDayOfWeek: topBucket(slipDates, (d) => d.getDay(), DAY_NAMES),
    topMonth: topBucket(slipDates, (d) => d.getMonth(), MONTH_NAMES),
  };
}

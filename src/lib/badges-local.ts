import type { AppBadge, UserPromise, LocalEntry } from "./storage";
import { getStreak, awardBadge } from "./storage";

export const BADGE_DEFS: Omit<AppBadge, "earnedAt">[] = [
  { id: "first-step",      name: "First Step",        description: "Keep your first promise" },
  { id: "on-a-roll",       name: "On a Roll",          description: "7-day habit streak" },
  { id: "word-is-bond",    name: "Word is Bond",       description: "Keep 10 one-time pledges" },
  { id: "comeback-kid",    name: "Comeback Kid",       description: "Resume a habit after breaking a streak" },
  { id: "first-break",     name: "First Break",        description: "1 day free from a negative habit" },
  { id: "pattern-breaker", name: "Pattern Breaker",    description: "7 days avoiding a negative habit" },
  { id: "new-default",     name: "New Default",        description: "30 days avoiding a negative habit" },
  { id: "unshackled",      name: "Unshackled",         description: "90 days avoiding a negative habit" },
  { id: "back-in-ring",    name: "Back in the Ring",   description: "Keeping clean again after a slip" },
];

/**
 * Merges BADGE_DEFS with earned timestamps from user_badges rows.
 * `earnedRows` is the raw output of fetchUserBadges() (id + earnedAt only).
 */
export function mergeBadges(earnedRows: Pick<AppBadge, "id" | "earnedAt">[]): AppBadge[] {
  const earnedMap = new Map(earnedRows.map((r) => [r.id, r.earnedAt]));
  return BADGE_DEFS.map((def) => ({
    ...def,
    earnedAt: earnedMap.get(def.id),
  }));
}

/**
 * Checks badge conditions and awards any newly earned badges to the user.
 * Returns the AppBadge objects for badges just awarded (for celebration UI).
 */
export async function checkAndAwardBadges(
  promises: UserPromise[],
  entries: LocalEntry[],
  existingBadges: AppBadge[]
): Promise<AppBadge[]> {
  const earnedIds = new Set(existingBadges.filter((b) => b.earnedAt).map((b) => b.id));
  if (earnedIds.size === BADGE_DEFS.length) return [];

  const habits = promises.filter((p) => p.type === "habit" && p.status === "active");
  const positiveHabits = habits.filter((p) => (p.mode ?? "positive") === "positive");
  const negativeHabits = habits.filter((p) => p.mode === "negative");

  const maxStreak = positiveHabits.length
    ? Math.max(...positiveHabits.map((p) => getStreak(entries, p.id, "positive", p.createdAt, p)))
    : 0;

  const maxNegativeStreak = negativeHabits.length
    ? Math.max(...negativeHabits.map((p) => getStreak(entries, p.id, "negative", p.createdAt, p)))
    : 0;

  const totalKept = entries.filter((e) => e.kept).length;

  const keptPledgeIds = new Set(entries.filter((e) => e.kept).map((e) => e.promiseId));
  const keptPledgeCount = promises.filter((p) => p.type === "pledge" && keptPledgeIds.has(p.id)).length;

  const today = new Date().toISOString().slice(0, 10);

  const comebackKid = positiveHabits.some((p) => {
    if (getStreak(entries, p.id, "positive", p.createdAt, p) !== 1) return false;
    return entries.some((e) => e.promiseId === p.id && e.kept && e.date < today);
  });

  const backInRing = negativeHabits.some((p) => {
    const hasSlip = entries.some((e) => e.promiseId === p.id && !e.kept);
    return hasSlip && getStreak(entries, p.id, "negative", p.createdAt, p) >= 1;
  });

  const conditions: Record<string, boolean> = {
    "first-step":      totalKept >= 1,
    "on-a-roll":       maxStreak >= 7,
    "word-is-bond":    keptPledgeCount >= 10,
    "comeback-kid":    comebackKid,
    "first-break":     maxNegativeStreak >= 1,
    "pattern-breaker": maxNegativeStreak >= 7,
    "new-default":     maxNegativeStreak >= 30,
    "unshackled":      maxNegativeStreak >= 90,
    "back-in-ring":    backInRing,
  };

  const newlyEarned: AppBadge[] = [];
  const now = new Date().toISOString();

  for (const def of BADGE_DEFS) {
    if (!earnedIds.has(def.id) && conditions[def.id]) {
      newlyEarned.push({ ...def, earnedAt: now });
    }
  }

  if (newlyEarned.length > 0) {
    await Promise.all(newlyEarned.map((b) => awardBadge(b.id)));
  }

  return newlyEarned;
}

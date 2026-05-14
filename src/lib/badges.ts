import type { Badge, UserBadge, BadgeWithStatus } from './types';
import type { Json } from './database.types';
import { getSupabaseClient } from './supabase';

// ── Badge evaluation ──────────────────────────────────────────────────────────

export interface BadgeCheckContext {
  userId: string;
  /** IDs of badges the user already has */
  earnedBadgeIds: Set<string>;
}

/**
 * Evaluates all badge conditions for a user and returns any newly earned badges.
 * Call this after every promise_kept or streak_extended action.
 */
export async function evaluateNewBadges(
  ctx: BadgeCheckContext,
  allBadges: Badge[]
): Promise<Badge[]> {
  const unearnedBadges = allBadges.filter(b => !ctx.earnedBadgeIds.has(b.id));
  if (unearnedBadges.length === 0) return [];

  const earned: Badge[] = [];
  for (const badge of unearnedBadges) {
    if (await checkCondition(badge, ctx.userId)) earned.push(badge);
  }
  return earned;
}

async function checkCondition(badge: Badge, userId: string): Promise<boolean> {
  const db = getSupabaseClient();

  switch (badge.condition_type) {
    case 'first_keep': {
      const { count } = await db
        .from('habit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('kept', true);
      return (count ?? 0) >= 1;
    }

    case 'habit_streak': {
      const { data } = await db
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .order('longest_streak', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.longest_streak ?? 0) >= (badge.condition_value ?? 0);
    }

    case 'pledge_count': {
      const { count } = await db
        .from('promises')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'pledge')
        .eq('status', 'archived');
      return (count ?? 0) >= (badge.condition_value ?? 0);
    }

    case 'monthly_consistency': {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStart = startOfMonth.toISOString().slice(0, 10);

      const { data } = await db
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('kept', true)
        .gte('date', monthStart);

      const uniqueDays = new Set((data ?? []).map(e => e.date)).size;
      return uniqueDays >= (badge.condition_value ?? 30);
    }

    case 'comeback': {
      const { count } = await db
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'streak_resumed');
      return (count ?? 0) >= 1;
    }

    default:
      return false;
  }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

/**
 * Merges the static badge catalog with a user's earned badges.
 * Returns all badges — earned ones include `earned_at`, locked ones have it undefined.
 */
export function mergeBadgeStatus(
  allBadges: Badge[],
  userBadges: UserBadge[]
): BadgeWithStatus[] {
  const earnedMap = new Map(userBadges.map(ub => [ub.badge_id, ub.earned_at]));
  return allBadges.map(badge => ({
    ...badge,
    earned_at: earnedMap.get(badge.id),
  }));
}

/**
 * Awards a set of newly earned badges: inserts into user_badges and logs events.
 */
export async function awardBadges(userId: string, badges: Badge[]): Promise<void> {
  if (badges.length === 0) return;
  const db = getSupabaseClient();

  await db
    .from('user_badges')
    .insert(badges.map(b => ({ user_id: userId, badge_id: b.id })));

  await db
    .from('events')
    .insert(
      badges.map(b => ({
        user_id: userId,
        event_type: 'badge_earned',
        payload: { badge_id: b.id, badge_name: b.name } as Json,
      }))
    );
}

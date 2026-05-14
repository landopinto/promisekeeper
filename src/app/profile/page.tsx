"use client";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import type { UserPromise, AppBadge, LocalEntry } from "@/lib/storage";
import { fetchPromises, fetchEntries, fetchUserBadges, getStreak, getTotalKept } from "@/lib/storage";
import { mergeBadges, BADGE_DEFS } from "@/lib/badges-local";
import { getSupabaseClient } from "@/lib/supabase";
import { Nav } from "@/components/Nav";

export default function Profile() {
  const [promises, setPromises] = useState<UserPromise[]>([]);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [badges, setBadges] = useState<AppBadge[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null);
    });

    Promise.all([fetchPromises(), fetchEntries(), fetchUserBadges()]).then(
      ([ps, es, rawBadges]) => {
        setPromises(ps);
        setEntries(es);
        setBadges(mergeBadges(rawBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt }))));
      }
    );
  }, []);

  async function handleSignOut() {
    const sb = getSupabaseClient();
    await sb.auth.signOut();
    window.location.href = "/login";
  }

  const habits = promises.filter((p) => p.type === "habit" && p.status === "active");

  const longestEver = habits.length
    ? Math.max(...habits.map((p) => getStreak(entries, p.id, p.mode ?? "positive", p.createdAt, p)))
    : 0;

  const earnedIds = new Set(badges.filter((b) => b.earnedAt).map((b) => b.id));
  const totalKept = getTotalKept(entries);

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      <header className="px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
        {email && (
          <p className="max-w-lg mx-auto mt-1 text-xs text-gray-400 truncate">{email}</p>
        )}
      </header>

      <main className="px-4 max-w-lg mx-auto space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-4xl font-bold text-teal-brand">{totalKept}</p>
            <p className="text-sm text-gray-500 mt-1">Promises kept</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-4xl font-bold text-amber-500">
              {longestEver > 0 ? `🔥 ${longestEver}` : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Longest streak</p>
          </div>
        </section>

        {/* Active Streaks */}
        {habits.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Active Streaks
            </h2>
            <div className="space-y-3">
              {habits.map((p) => {
                const streak = getStreak(entries, p.id, p.mode ?? "positive", p.createdAt, p);
                const isNegative = p.mode === "negative";
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                  >
                    <span className="text-2xl">{p.emoji ?? (isNegative ? "🚫" : "📌")}</span>
                    <div className="flex-1 min-w-0">
                      {isNegative && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mb-1 inline-block">
                          Avoiding
                        </span>
                      )}
                      <p className="font-medium text-gray-900 truncate">{p.text}</p>
                    </div>
                    {streak > 0 ? (
                      <span className="font-bold text-amber-600 flex-shrink-0">🔥 {streak}</span>
                    ) : (
                      <span className="text-gray-300 text-sm flex-shrink-0">No streak</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Badge Gallery */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Badges
          </h2>
          {BADGE_DEFS.length === 0 ? (
            <p className="text-gray-400 text-sm">No badges yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {BADGE_DEFS.map((def) => {
                const earned = earnedIds.has(def.id);
                return (
                  <div
                    key={def.id}
                    className={`rounded-2xl p-4 border transition-colors ${
                      earned ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <p className="text-3xl mb-2">{earned ? "🏅" : "🔒"}</p>
                    <p className={`font-semibold text-sm ${earned ? "text-amber-800" : "text-gray-400"}`}>
                      {def.name}
                    </p>
                    <p className={`text-xs mt-1 leading-snug ${earned ? "text-amber-600" : "text-gray-300"}`}>
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Nav />
    </div>
  );
}

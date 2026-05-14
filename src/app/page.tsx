"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import type { UserPromise, AppBadge, LocalEntry } from "@/lib/storage";
import {
  fetchPromises,
  fetchEntries,
  fetchUserBadges,
  savePromise,
  upsertEntry,
  removeEntry,
  bulkUpsertEntries,
  isPledgeKept,
  getStreak,
  getMissedDays,
  isScheduledDay,
} from "@/lib/storage";
import type { PastDayAction } from "@/components/HistoryStrip";
import { mergeBadges, checkAndAwardBadges, BADGE_DEFS } from "@/lib/badges-local";
import { PledgeCard } from "@/components/PledgeCard";
import { CreateSheet } from "@/components/CreateSheet";
import { EditSheet } from "@/components/EditSheet";
import type { EditData } from "@/components/EditSheet";
import { TimeSlotView } from "@/components/TimeSlotView";
import { Celebration } from "@/components/Celebration";
import { BadgeChip } from "@/components/BadgeChip";
import { Nav } from "@/components/Nav";

function genId(): string {
  return crypto.randomUUID();
}

export default function Home() {
  const [promises, setPromises] = useState<UserPromise[]>([]);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [badges, setBadges] = useState<AppBadge[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [newBadge, setNewBadge] = useState<AppBadge | null>(null);
  const [slipped, setSlipped] = useState(false);
  const [priorStreak, setPriorStreak] = useState(0);
  const [tick, setTick] = useState(0);
  const [editingPromise, setEditingPromise] = useState<UserPromise | null>(null);
  const [pendingUndo, setPendingUndo] = useState<{ promiseId: string; date: string } | null>(null);

  const reload = useCallback(() => {
    Promise.all([fetchPromises(), fetchEntries(), fetchUserBadges()]).then(
      ([ps, es, rawBadges]) => {
        setPromises(ps);
        setEntries(es);
        setBadges(mergeBadges(rawBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt }))));
      }
    );
  }, []);

  useEffect(() => {
    Promise.all([fetchPromises(), fetchEntries(), fetchUserBadges()]).then(
      async ([ps, es, rawBadges]) => {
        const mergedBadges = mergeBadges(rawBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt })));

        // Backfill missed days for positive daily/specific-days habits
        const toAdd: LocalEntry[] = [];
        for (const p of ps) {
          if (p.type === "habit" && p.status === "active" && (p.mode ?? "positive") === "positive") {
            toAdd.push(...getMissedDays(es, p.id, p.createdAt, p));
          }
        }
        if (toAdd.length > 0) {
          await bulkUpsertEntries(toAdd);
          es = [...es, ...toAdd];
        }

        setPromises(ps);
        setEntries(es);
        setBadges(mergedBadges);

        // Check passive badges (e.g. avoidance streaks that grew overnight)
        const awarded = await checkAndAwardBadges(ps, es, mergedBadges);
        if (awarded.length > 0) {
          setBadges(mergeBadges([
            ...rawBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
            ...awarded.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
          ]));
          setNewBadge(awarded[0]);
          setSlipped(false);
          setCelebrating(true);
        }
      }
    );
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const todayDow = new Date().getDay();
  const activeHabits = promises.filter((p) => {
    if (p.type !== "habit" || p.status !== "active") return false;
    if (p.scheduleMode === "specific_days") {
      return (p.scheduleDays ?? []).includes(todayDow);
    }
    return true;
  });
  const activePledges = promises.filter((p) => p.type === "pledge" && p.status === "active");
  const earnedBadges = badges
    .filter((b) => b.earnedAt)
    .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
    .slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);

  async function handleAction(promiseId: string) {
    const promise = promises.find((p) => p.id === promiseId);
    const isNegative = promise?.mode === "negative";

    if (isNegative) {
      const prior = getStreak(entries, promiseId, "negative", promise?.createdAt, promise);
      await upsertEntry({ promiseId, date: today, kept: false });
      const newEntries = entries.filter((e) => !(e.promiseId === promiseId && e.date === today));
      newEntries.push({ promiseId, date: today, kept: false });
      const awarded = await checkAndAwardBadges(promises, newEntries, badges);
      setEntries(newEntries);
      setTick((t) => t + 1);
      setPriorStreak(prior);
      setSlipped(true);
      setPendingUndo({ promiseId, date: today });
      if (awarded.length > 0) {
        setBadges((prev) => mergeBadges([
          ...prev.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
          ...awarded.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
        ]));
        setNewBadge(awarded[0]);
      }
      setCelebrating(true);
    } else {
      await upsertEntry({ promiseId, date: today, kept: true });
      const newEntries = entries.filter((e) => !(e.promiseId === promiseId && e.date === today));
      newEntries.push({ promiseId, date: today, kept: true });
      const awarded = await checkAndAwardBadges(promises, newEntries, badges);
      setEntries(newEntries);
      setTick((t) => t + 1);
      setPendingUndo({ promiseId, date: today });
      if (awarded.length > 0) {
        setBadges((prev) => mergeBadges([
          ...prev.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
          ...awarded.map((b) => ({ id: b.id, earnedAt: b.earnedAt })),
        ]));
        setNewBadge(awarded[0]);
      }
      setSlipped(false);
      setCelebrating(true);
    }
  }

  async function handleCreate(data: Omit<UserPromise, "id" | "createdAt" | "status">) {
    const p: UserPromise = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: "active",
    };
    try {
      await savePromise(p);
      reload();
    } catch (err) {
      console.error("Failed to save promise:", err);
      alert("Couldn't save — " + (err instanceof Error ? err.message : "unknown error"));
    }
  }

  async function handleSaveEdit(id: string, updates: EditData) {
    const p = promises.find((x) => x.id === id);
    if (!p) return;
    await savePromise({ ...p, ...updates });
    reload();
  }

  function handleCelebrationDone() {
    setCelebrating(false);
    setNewBadge(null);
    setSlipped(false);
    setPriorStreak(0);
    setPendingUndo(null);
  }

  async function handleUndo() {
    if (!pendingUndo) return;
    await removeEntry(pendingUndo.promiseId, pendingUndo.date);
    setEntries((prev) =>
      prev.filter((e) => !(e.promiseId === pendingUndo.promiseId && e.date === pendingUndo.date))
    );
    setTick((t) => t + 1);
    handleCelebrationDone();
  }

  async function handleUndoEntry(promiseId: string) {
    await removeEntry(promiseId, today);
    setEntries((prev) => prev.filter((e) => !(e.promiseId === promiseId && e.date === today)));
    setTick((t) => t + 1);
  }

  async function handlePastDayAction(promiseId: string, date: string, nextState: PastDayAction) {
    if (nextState === "kept") {
      await upsertEntry({ promiseId, date, kept: true });
      setEntries((prev) => {
        const filtered = prev.filter((e) => !(e.promiseId === promiseId && e.date === date));
        return [...filtered, { promiseId, date, kept: true }];
      });
    } else if (nextState === "slipped") {
      await upsertEntry({ promiseId, date, kept: false });
      setEntries((prev) => {
        const filtered = prev.filter((e) => !(e.promiseId === promiseId && e.date === date));
        return [...filtered, { promiseId, date, kept: false }];
      });
    } else {
      await removeEntry(promiseId, date);
      setEntries((prev) => prev.filter((e) => !(e.promiseId === promiseId && e.date === date)));
    }
    setTick((t) => t + 1);
  }

  const isEmpty = promises.length === 0;

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-cream-50/80 backdrop-blur-sm z-30 px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kept</h1>
          <button
            onClick={() => setCreateOpen(true)}
            aria-label="Add a new promise"
            className="w-10 h-10 rounded-full bg-teal-brand text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <Plus size={22} />
          </button>
        </div>
      </header>

      <main className="px-4 max-w-lg mx-auto space-y-8">
        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🤝</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Make your first promise</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Every kept promise is a small win worth celebrating.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-teal-brand text-white px-7 py-3.5 rounded-2xl font-bold shadow-sm active:scale-95 transition-transform"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Today's Habits */}
        {!isEmpty && (
          <TimeSlotView
            habits={activeHabits}
            entries={entries}
            tick={tick}
            reload={reload}
            onAction={handleAction}
            onUndo={handleUndoEntry}
            onEdit={setEditingPromise}
            onPastDayAction={handlePastDayAction}
            onAddHabit={() => setCreateOpen(true)}
          />
        )}

        {/* Pledges */}
        {activePledges.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Pledges
            </h2>
            <div className="space-y-3">
              {activePledges
                .slice()
                .sort((a, b) => {
                  if (!a.deadline) return 1;
                  if (!b.deadline) return -1;
                  return a.deadline.localeCompare(b.deadline);
                })
                .map((p) => (
                  <PledgeCard
                    key={p.id + tick}
                    promise={p}
                    kept={isPledgeKept(entries, p.id)}
                    onKeep={() => handleAction(p.id)}
                    onEdit={() => setEditingPromise(p)}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Recent Badges */}
        {earnedBadges.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Recent Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((b) => (
                <BadgeChip key={b.id} badge={b} />
              ))}
            </div>
          </section>
        )}
      </main>

      <CreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      <EditSheet
        open={editingPromise !== null}
        onClose={() => setEditingPromise(null)}
        promise={editingPromise}
        onSave={handleSaveEdit}
      />

      <Celebration
        show={celebrating}
        onDone={handleCelebrationDone}
        newBadge={newBadge}
        slipped={slipped}
        priorStreak={priorStreak}
        onUndo={pendingUndo ? handleUndo : undefined}
      />

      <Nav />
    </div>
  );
}

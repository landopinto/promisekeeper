"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { UserPromise, LocalEntry } from "@/lib/storage";
import type { PastDayAction } from "@/components/HistoryStrip";
import { DraggableHabitCard } from "@/components/DraggableHabitCard";
import { getStreak, isKeptToday } from "@/lib/storage";

interface SlotConfig {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
}

interface Props {
  slot: SlotConfig;
  habits: UserPromise[];
  entries: LocalEntry[];
  tick: number;
  isActiveDrag: boolean;
  onAction: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (p: UserPromise) => void;
  onPastDayAction: (id: string, date: string, action: PastDayAction) => void;
}

function buildPastEntries(entries: LocalEntry[], promiseId: string): Record<string, boolean | undefined> {
  const map: Record<string, boolean | undefined> = {};
  for (const e of entries.filter((e) => e.promiseId === promiseId)) {
    map[e.date] = e.kept;
  }
  return map;
}

export function SlotSection({
  slot,
  habits,
  entries,
  tick,
  isActiveDrag,
  onAction,
  onUndo,
  onEdit,
  onPastDayAction,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  const ids = habits.map((h) => h.id);

  return (
    <div className="space-y-1">
      {/* Slot header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 py-1 group"
        aria-expanded={!collapsed}
      >
        <span className="text-base">{slot.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-widest ${slot.colorClass}`}>
          {slot.label}
        </span>
        {habits.length > 0 && (
          <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-medium">
            {habits.length}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`ml-auto text-gray-300 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {/* Habit list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <SortableContext id={slot.id} items={ids} strategy={verticalListSortingStrategy}>
              <div
                ref={setNodeRef}
                className={`space-y-2 min-h-[2rem] rounded-xl transition-colors ${
                  isActiveDrag && habits.length === 0
                    ? isOver
                      ? "bg-teal-50 border-2 border-dashed border-teal-300"
                      : "bg-gray-50 border-2 border-dashed border-gray-200"
                    : ""
                }`}
              >
                {habits.map((p) => (
                  <DraggableHabitCard
                    key={p.id + tick}
                    promise={p}
                    entries={entries}
                    streak={getStreak(entries, p.id, p.mode ?? "positive", p.createdAt, p)}
                    keptToday={isKeptToday(entries, p.id, p.mode ?? "positive", p)}
                    onAction={() => onAction(p.id)}
                    onUndo={() => onUndo(p.id)}
                    onEdit={() => onEdit(p)}
                    pastEntries={buildPastEntries(entries, p.id)}
                    onPastDayAction={(date, action) => onPastDayAction(p.id, date, action)}
                    containerId={slot.id}
                  />
                ))}

                {isActiveDrag && habits.length === 0 && (
                  <div className="py-4 text-center text-xs text-gray-400">
                    Drop here
                  </div>
                )}
              </div>
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

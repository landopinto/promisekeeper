"use client";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { UserPromise, LocalEntry } from "@/lib/storage";
import { saveSlotOrder, moveHabitToSlot, type TimeSlot } from "@/lib/storage";
import { SLOT_CONFIG } from "@/lib/slots";
import { SlotSection } from "@/components/SlotSection";
import type { PastDayAction } from "@/components/HistoryStrip";

interface Props {
  habits: UserPromise[];
  entries: LocalEntry[];
  tick: number;
  reload: () => void;
  onAction: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (p: UserPromise) => void;
  onPastDayAction: (id: string, date: string, action: PastDayAction) => void;
  onAddHabit: () => void;
}

function sortHabits(habits: UserPromise[]): UserPromise[] {
  return [...habits].sort((a, b) => {
    const aOrder = a.slotOrder ?? Infinity;
    const bOrder = b.slotOrder ?? Infinity;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function habitsForSlot(habits: UserPromise[], slot: TimeSlot): UserPromise[] {
  return sortHabits(habits.filter((h) => (h.timeSlot ?? "allday") === slot));
}

export function TimeSlotView({
  habits,
  entries,
  tick,
  reload,
  onAction,
  onUndo,
  onEdit,
  onPastDayAction,
  onAddHabit,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isActiveDrag = activeId !== null;
  const activeHabit = habits.find((h) => h.id === activeId) ?? null;

  function getContainerId(habitId: string): TimeSlot {
    const h = habits.find((x) => x.id === habitId);
    return (h?.timeSlot ?? "allday") as TimeSlot;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceSlot = getContainerId(activeId);

    const isSlotId = SLOT_CONFIG.some((s) => s.id === overId);
    const targetSlot: TimeSlot = isSlotId
      ? (overId as TimeSlot)
      : getContainerId(overId);

    if (sourceSlot === targetSlot) {
      if (activeId === overId) return;
      const slotHabits = habitsForSlot(habits, sourceSlot);
      const oldIndex = slotHabits.findIndex((h) => h.id === activeId);
      const newIndex = slotHabits.findIndex((h) => h.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(slotHabits, oldIndex, newIndex);
      await saveSlotOrder(sourceSlot, reordered.map((h) => h.id));
    } else {
      const targetHabits = habitsForSlot(habits, targetSlot);
      let insertIndex = isSlotId
        ? targetHabits.length
        : targetHabits.findIndex((h) => h.id === overId);
      if (insertIndex === -1) insertIndex = targetHabits.length;

      const newTargetIds = [
        ...targetHabits.slice(0, insertIndex).map((h) => h.id),
        activeId,
        ...targetHabits.slice(insertIndex).map((h) => h.id),
      ];

      const newSourceIds = habitsForSlot(habits, sourceSlot)
        .filter((h) => h.id !== activeId)
        .map((h) => h.id);

      await moveHabitToSlot(activeId, targetSlot);
      await saveSlotOrder(targetSlot, newTargetIds);
      await saveSlotOrder(sourceSlot, newSourceIds);
    }

    reload();
  }

  if (habits.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Today&apos;s Habits
        </h2>
        <div className="text-center py-6 text-gray-400">
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-sm">No habits yet.</p>
          <button
            onClick={onAddHabit}
            className="mt-2 text-teal-brand font-medium text-sm"
          >
            Add a habit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Today&apos;s Habits
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-5">
          {SLOT_CONFIG.map((slot) => (
            <SlotSection
              key={slot.id}
              slot={slot}
              habits={habitsForSlot(habits, slot.id as TimeSlot)}
              entries={entries}
              tick={tick}
              isActiveDrag={isActiveDrag}
              onAction={onAction}
              onUndo={onUndo}
              onEdit={onEdit}
              onPastDayAction={onPastDayAction}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeHabit && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 opacity-95">
              <span className="text-xl">{activeHabit.emoji ?? "🤝"}</span>
              <span className="text-sm font-medium text-gray-800 truncate flex-1">
                {activeHabit.text}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

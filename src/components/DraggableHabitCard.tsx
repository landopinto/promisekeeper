"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PromiseCard } from "@/components/PromiseCard";
import type { UserPromise, LocalEntry } from "@/lib/storage";
import type { PastDayAction } from "@/components/HistoryStrip";

interface Props {
  promise: UserPromise;
  entries: LocalEntry[];
  streak: number;
  keptToday: boolean;
  onAction: () => void;
  onUndo: () => void;
  onEdit: () => void;
  pastEntries: Record<string, boolean | undefined>;
  onPastDayAction: (date: string, nextState: PastDayAction) => void;
  containerId: string;
}

export function DraggableHabitCard({
  promise,
  entries,
  streak,
  keptToday,
  onAction,
  onUndo,
  onEdit,
  pastEntries,
  onPastDayAction,
  containerId,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: promise.id, data: { containerId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
        tabIndex={0}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <PromiseCard
          promise={promise}
          entries={entries}
          streak={streak}
          keptToday={keptToday}
          onAction={onAction}
          onUndo={onUndo}
          onEdit={onEdit}
          pastEntries={pastEntries}
          onPastDayAction={onPastDayAction}
        />
      </div>
    </div>
  );
}

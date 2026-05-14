"use client";
import { motion } from "framer-motion";
import { Check, Calendar, Pencil } from "lucide-react";
import type { UserPromise } from "@/lib/storage";

interface Props {
  promise: UserPromise;
  kept: boolean;
  onKeep: () => void;
  onEdit?: () => void;
}

export function PledgeCard({ promise, kept, onKeep, onEdit }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = promise.deadline
    ? new Date(promise.deadline + "T00:00:00")
    : null;
  const isOverdue = deadline && deadline < today && !kept;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000)
    : null;

  function deadlineLabel(): string {
    if (!deadline) return "";
    if (isOverdue) return "Overdue";
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return "Due tomorrow";
    return `${daysLeft} days left`;
  }

  return (
    <motion.div
      className={`flex items-center gap-4 p-4 rounded-2xl shadow-sm border transition-colors ${
        kept
          ? "bg-green-50 border-green-200"
          : isOverdue
          ? "bg-red-50 border-red-200"
          : "bg-white border-gray-100"
      }`}
      whileTap={{ scale: kept ? 1 : 0.97 }}
    >
      <span className="text-3xl select-none">{promise.emoji ?? "🤝"}</span>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium leading-snug ${
            kept
              ? "text-green-800"
              : isOverdue
              ? "text-red-700"
              : "text-gray-900"
          }`}
        >
          {promise.text}
        </p>

        {kept && (
          <p className="text-sm text-green-600 mt-0.5">Kept!</p>
        )}

        {!kept && deadline && (
          <p
            className={`text-sm mt-0.5 flex items-center gap-1 ${
              isOverdue
                ? "text-red-500"
                : daysLeft !== null && daysLeft <= 3
                ? "text-amber-600"
                : "text-gray-400"
            }`}
          >
            <Calendar size={12} />
            {deadlineLabel()}
          </p>
        )}
      </div>

      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          aria-label="Edit pledge"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Pencil size={15} />
        </button>
      )}

      {kept ? (
        <div className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
          <Check size={18} />
        </div>
      ) : (
        <button
          onClick={onKeep}
          aria-label="Mark pledge as kept"
          className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-300 hover:border-coral-brand hover:text-coral-brand active:scale-90 flex items-center justify-center flex-shrink-0 transition-all"
        />
      )}
    </motion.div>
  );
}

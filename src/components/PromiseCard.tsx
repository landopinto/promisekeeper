"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Pencil, History } from "lucide-react";
import type { UserPromise, HabitMode, LocalEntry } from "@/lib/storage";
import { getWeeklyProgress } from "@/lib/storage";
import { HistoryStrip, type PastDayAction } from "@/components/HistoryStrip";

interface Props {
  promise: UserPromise;
  entries: LocalEntry[];
  streak: number;
  /** For positive: true = already checked off. For negative: true = still intact. */
  keptToday: boolean;
  onAction: () => void;
  onUndo?: () => void;
  onEdit?: () => void;
  pastEntries?: Record<string, boolean | undefined>;
  onPastDayAction?: (date: string, nextState: PastDayAction) => void;
}

export function PromiseCard({ promise, entries, streak, keptToday, onAction, onUndo, onEdit, pastEntries, onPastDayAction }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const mode: HabitMode = promise.mode ?? "positive";
  const isWeekly = promise.scheduleMode === "weekly_count" && !!promise.weeklyTarget;
  const weeklyProgress = isWeekly ? getWeeklyProgress(entries, promise.id, promise.weeklyTarget!) : null;
  const isNegative = mode === "negative";

  const isSlippedToday = isNegative && !keptToday;
  const isDonePositive = !isNegative && keptToday;

  const cardBg = isSlippedToday
    ? "bg-red-50 border-red-200"
    : keptToday && isNegative
    ? "bg-green-50 border-green-100"
    : isDonePositive
    ? "bg-green-50 border-green-200"
    : "bg-white border-gray-100";

  const textColor = isSlippedToday
    ? "text-red-700"
    : isDonePositive || (keptToday && isNegative)
    ? "text-green-800"
    : "text-gray-900";

  return (
    <motion.div
      className={`py-2.5 px-3 rounded-2xl shadow-sm border transition-colors ${cardBg}`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5">
        <span className="text-lg select-none w-7 text-center flex-shrink-0">
          {promise.emoji ?? (isNegative ? "🚫" : "📌")}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {isNegative && (
              <span className="text-xs font-semibold text-amber-600 flex-shrink-0">Avoiding</span>
            )}
            <p className={`text-sm font-medium truncate ${textColor}`}>
              {promise.text}
            </p>
          </div>
          {promise.scheduleMode === "specific_days" && promise.scheduleDays && (
            <div className="flex gap-0.5 mt-0.5">
              {["S","M","T","W","T","F","S"].map((l, i) => (
                <span
                  key={i}
                  className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                    promise.scheduleDays!.includes(i)
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-300"
                  }`}
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>

        {isWeekly && weeklyProgress && (
          <span className={`text-xs font-semibold flex-shrink-0 whitespace-nowrap ${
            weeklyProgress.kept >= weeklyProgress.target ? "text-green-600" : "text-teal-600"
          }`}>
            {weeklyProgress.kept}/{weeklyProgress.target}
          </span>
        )}
        {!isWeekly && streak > 0 && !isSlippedToday && (
          <span className="text-xs text-amber-600 flex-shrink-0 whitespace-nowrap">🔥 {streak}d</span>
        )}
        {isSlippedToday && (
          <span className="text-xs text-red-400 flex-shrink-0">slipped</span>
        )}

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit habit"
            className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <Pencil size={13} />
          </button>
        )}

        {/* Action button */}
        {isNegative ? (
          isSlippedToday ? (
            <button
              onClick={onUndo}
              aria-label="Undo slip"
              className="w-8 h-8 rounded-full bg-red-400 text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              onClick={onAction}
              aria-label="I slipped"
              className="px-2 h-7 rounded-full border border-amber-300 text-amber-600 text-xs font-semibold hover:bg-amber-50 active:scale-90 flex-shrink-0 transition-all whitespace-nowrap"
            >
              Slipped
            </button>
          )
        ) : (
          <button
            onClick={keptToday ? onUndo : onAction}
            aria-label={keptToday ? "Undo" : "Mark as kept"}
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              keptToday
                ? "bg-green-500 text-white active:scale-90"
                : "border-2 border-gray-200 text-gray-300 hover:border-teal-brand hover:text-teal-brand active:scale-90"
            }`}
          >
            {keptToday && <Check size={15} />}
          </button>
        )}
      </div>

      {/* History toggle */}
      {onPastDayAction && (
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          aria-label={historyOpen ? "Hide history" : "Show past days"}
          className="ml-9 mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          <History size={11} />
          <span>{historyOpen ? "Hide" : "Log past"}</span>
        </button>
      )}

      {/* History strip */}
      <AnimatePresence initial={false}>
        {historyOpen && onPastDayAction && pastEntries && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="ml-9"
          >
            <HistoryStrip
              promise={promise}
              pastEntries={pastEntries}
              onToggle={onPastDayAction}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

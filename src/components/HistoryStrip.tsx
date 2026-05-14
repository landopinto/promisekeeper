"use client";
import { useRef, useEffect, useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, CalendarDays, AlignJustify } from "lucide-react";
import type { UserPromise } from "@/lib/storage";

export type PastDayAction = "kept" | "slipped" | "clear";

interface Props {
  promise: UserPromise;
  pastEntries: Record<string, boolean | undefined>;
  onToggle: (date: string, nextState: PastDayAction) => void;
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;
const DAY_LETTERS = ["S","M","T","W","T","F","S"] as const;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function offsetDate(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function getNextState(current: boolean | undefined): PastDayAction {
  if (current === undefined) return "kept";
  if (current === true) return "slipped";
  return "clear";
}

function isOffDay(promise: UserPromise, date: string): boolean {
  if (promise.scheduleMode !== "specific_days") return false;
  if (!promise.scheduleDays?.length) return false;
  return !promise.scheduleDays.includes(new Date(date + "T00:00:00").getDay());
}

// ── Strip view ────────────────────────────────────────────────────────────────

function StripView({
  promise,
  pastEntries,
  onToggle,
  onSwitchToMonth,
}: {
  promise: UserPromise;
  pastEntries: Record<string, boolean | undefined>;
  onToggle: (date: string, next: PastDayAction) => void;
  onSwitchToMonth: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build last 30 days oldest → newest (left → right), excluding today
  const today = new Date();
  const dates: string[] = [];
  for (let i = 30; i >= 1; i--) {
    dates.push(dateStr(offsetDate(today, -i)));
  }

  useEffect(() => {
    // Auto-scroll to the rightmost end so yesterday is visible
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="pt-3 mt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Past 30 days</span>
        <button
          onClick={onSwitchToMonth}
          aria-label="Switch to month view"
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-teal-600 transition-colors"
        >
          <CalendarDays size={12} />
          <span>Month</span>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {dates.map((date) => {
          const val = pastEntries[date];
          const dayObj = new Date(date + "T00:00:00");
          const dayName = SHORT_DAY[dayObj.getDay()];
          const dayNum = dayObj.getDate();
          const isKept = val === true;
          const isSlipped = val === false;
          const off = isOffDay(promise, date);

          return (
            <button
              key={date}
              onClick={() => onToggle(date, getNextState(val))}
              aria-label={`${date}: ${isKept ? "kept" : isSlipped ? "slipped" : "not logged"}`}
              className={`flex flex-col items-center gap-0.5 flex-shrink-0 active:scale-90 transition-transform ${
                off && !isKept && !isSlipped ? "opacity-30" : off ? "opacity-60" : ""
              }`}
            >
              <span className="text-[9px] text-gray-400 font-medium w-7 text-center">{dayName}</span>
              <span className="text-[9px] text-gray-400 w-7 text-center">{dayNum}</span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isKept
                    ? "bg-green-500 border-green-500 text-white"
                    : isSlipped
                    ? "bg-red-400 border-red-400 text-white"
                    : "border-gray-200 text-gray-200"
                }`}
              >
                {isKept && <Check size={13} />}
                {isSlipped && <X size={13} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  promise,
  pastEntries,
  onToggle,
  onSwitchToStrip,
}: {
  promise: UserPromise;
  pastEntries: Record<string, boolean | undefined>;
  onToggle: (date: string, next: PastDayAction) => void;
  onSwitchToStrip: () => void;
}) {
  const today = todayStr();

  // Start at current month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const currentYM = `${year}-${String(month + 1).padStart(2, "0")}`;
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  // Allow navigating back up to 24 months
  const minDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  const minYM = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  const canGoBack = currentYM > minYM;
  const canGoForward = currentYM < nowYM;

  function prevMonth() {
    if (!canGoBack) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (!canGoForward) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid: pad start with empty cells so day 1 aligns to correct column
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="pt-3 mt-3 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onSwitchToStrip}
          aria-label="Switch to strip view"
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-teal-600 transition-colors"
        >
          <AlignJustify size={12} />
          <span>Strip</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            disabled={!canGoBack}
            aria-label="Previous month"
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-gray-600 min-w-[80px] text-center">
            {MONTH_NAMES[month].slice(0, 3)} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={!canGoForward}
            aria-label="Next month"
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LETTERS.map((l, i) => (
          <span key={i} className="text-[9px] font-semibold text-gray-400 text-center">{l}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateKey === today;
          const isFuture = dateKey > today;
          const isDisabled = isFuture;

          const val = pastEntries[dateKey];
          const isKept = val === true;
          const isSlipped = val === false;
          const off = !isFuture && isOffDay(promise, dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => !isDisabled && onToggle(dateKey, getNextState(val))}
              disabled={isDisabled}
              aria-label={`${dateKey}: ${isKept ? "kept" : isSlipped ? "slipped" : "not logged"}`}
              className={`flex flex-col items-center gap-0.5 py-0.5 transition-transform ${
                isDisabled ? "opacity-25 cursor-default" : "active:scale-90"
              } ${off && !isKept && !isSlipped ? "opacity-30" : off ? "opacity-60" : ""}`}
            >
              <span className={`text-[9px] font-medium ${isToday ? "text-teal-600" : "text-gray-500"}`}>
                {day}
              </span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                  isKept
                    ? "bg-green-500 border-green-500 text-white"
                    : isSlipped
                    ? "bg-red-400 border-red-400 text-white"
                    : isToday
                    ? "border-teal-300 text-teal-300"
                    : "border-gray-200 text-gray-200"
                }`}
              >
                {isKept && <Check size={11} />}
                {isSlipped && <X size={11} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HistoryStrip({ promise, pastEntries, onToggle }: Props) {
  const [view, setView] = useState<"strip" | "month">("strip");

  if (view === "month") {
    return (
      <MonthView
        promise={promise}
        pastEntries={pastEntries}
        onToggle={onToggle}
        onSwitchToStrip={() => setView("strip")}
      />
    );
  }

  return (
    <StripView
      promise={promise}
      pastEntries={pastEntries}
      onToggle={onToggle}
      onSwitchToMonth={() => setView("month")}
    />
  );
}

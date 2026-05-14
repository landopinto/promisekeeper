"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { UserPromise, PromiseType, HabitMode, TimeSlot, ScheduleMode } from "@/lib/storage";
import { SLOT_CONFIG } from "@/lib/slots";

const POSITIVE_EMOJIS = [
  "💪", "🏃", "📚", "💧", "🥗", "🧘", "✍️", "🎯",
  "🌱", "❤️", "🎵", "🧹", "☀️", "😴", "🐾", "🚴",
];
const NEGATIVE_EMOJIS = [
  "🚫", "🚬", "🍔", "🍺", "📱", "🎮", "😤", "💸",
  "🍭", "☕", "😴", "🛋️", "📺", "🤬", "🍕", "🧁",
];

type CreateData = Omit<UserPromise, "id" | "createdAt" | "status">;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateData) => void;
}

export function CreateSheet({ open, onClose, onSave }: Props) {
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<PromiseType>("habit");
  const [mode, setMode] = useState<HabitMode>("positive");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("");
  const [deadline, setDeadline] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("allday");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("daily");
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState(3);

  function reset() {
    setStep("type");
    setType("habit");
    setMode("positive");
    setText("");
    setEmoji("");
    setDeadline("");
    setTimeSlot("allday");
    setScheduleMode("daily");
    setScheduleDays([]);
    setWeeklyTarget(3);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleTypeSelect(t: PromiseType) {
    setType(t);
    setStep("form");
  }

  function handleSave() {
    if (!text.trim()) return;
    if (type === "habit" && scheduleMode === "specific_days" && scheduleDays.length === 0) return;
    onSave({
      type,
      text: text.trim(),
      emoji: emoji || undefined,
      deadline: type === "pledge" && deadline ? deadline : undefined,
      mode: type === "habit" ? mode : undefined,
      timeSlot: type === "habit" ? timeSlot : undefined,
      scheduleMode: type === "habit" ? scheduleMode : undefined,
      scheduleDays: type === "habit" && scheduleMode === "specific_days" ? scheduleDays : undefined,
      weeklyTarget: type === "habit" && scheduleMode === "weekly_count" ? weeklyTarget : undefined,
    });
    reset();
    onClose();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {step === "type"
                  ? "What are you promising?"
                  : type === "habit" && mode === "negative"
                  ? "Avoid This Habit"
                  : type === "habit"
                  ? "New Daily Habit"
                  : "New One-Time Pledge"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {step === "type" ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTypeSelect("habit")}
                  className="p-5 rounded-2xl border-2 border-gray-100 hover:border-teal-brand text-left transition-colors active:scale-95"
                >
                  <div className="text-3xl mb-3">🔁</div>
                  <p className="font-bold text-gray-900">Daily Habit</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Something you do every day
                  </p>
                </button>
                <button
                  onClick={() => handleTypeSelect("pledge")}
                  className="p-5 rounded-2xl border-2 border-gray-100 hover:border-coral-brand text-left transition-colors active:scale-95"
                >
                  <div className="text-3xl mb-3">🤝</div>
                  <p className="font-bold text-gray-900">One-Time Pledge</p>
                  <p className="text-sm text-gray-500 mt-1">
                    A single commitment to yourself
                  </p>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Do / Avoid toggle — habits only */}
                {type === "habit" && (
                  <div className="flex rounded-2xl border-2 border-gray-100 overflow-hidden">
                    <button
                      onClick={() => { setMode("positive"); setEmoji(""); }}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                        mode === "positive"
                          ? "bg-teal-brand text-white"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      ✓ Do This
                    </button>
                    <button
                      onClick={() => { setMode("negative"); setEmoji(""); }}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                        mode === "negative"
                          ? "bg-amber-500 text-white"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      🚫 Avoid This
                    </button>
                  </div>
                )}

                {/* Emoji picker */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {(mode === "negative" ? NEGATIVE_EMOJIS : POSITIVE_EMOJIS).map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(emoji === e ? "" : e)}
                      className={`text-2xl p-2 rounded-xl flex-shrink-0 transition-colors ${
                        emoji === e
                          ? "bg-teal-brand/10 ring-2 ring-teal-brand"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    type === "habit" && mode === "negative"
                      ? "e.g. Smoke a cigarette"
                      : type === "habit"
                      ? "e.g. Drink 8 glasses of water"
                      : "e.g. Finish my online course"
                  }
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-teal-brand outline-none resize-none text-gray-900 placeholder-gray-400 transition-colors"
                  rows={3}
                  autoFocus
                />

                {/* Time slot picker — habits only */}
                {type === "habit" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Time of Day
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {SLOT_CONFIG.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setTimeSlot(s.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                            timeSlot === s.id
                              ? "border-teal-brand bg-teal-brand/10 text-teal-brand"
                              : "border-gray-100 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule picker — habits only */}
                {type === "habit" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Schedule
                    </label>
                    <div className="flex rounded-2xl border-2 border-gray-100 overflow-hidden mb-3">
                      {([
                        { id: "daily" as ScheduleMode, label: "Every day" },
                        { id: "specific_days" as ScheduleMode, label: "Specific days" },
                        { id: "weekly_count" as ScheduleMode, label: "X / week" },
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setScheduleMode(opt.id)}
                          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                            scheduleMode === opt.id
                              ? "bg-teal-brand text-white"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {scheduleMode === "specific_days" && (
                      <div className="flex justify-between">
                        {["S","M","T","W","T","F","S"].map((letter, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setScheduleDays((prev) =>
                                prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                              )
                            }
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                              scheduleDays.includes(idx)
                                ? "bg-teal-brand text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    )}

                    {scheduleMode === "weekly_count" && (
                      <div className="flex items-center justify-center gap-5">
                        <button
                          type="button"
                          onClick={() => setWeeklyTarget((t) => Math.max(1, t - 1))}
                          className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-xl font-bold active:scale-90 transition-transform"
                        >−</button>
                        <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                          {weeklyTarget}×
                        </span>
                        <button
                          type="button"
                          onClick={() => setWeeklyTarget((t) => Math.min(6, t + 1))}
                          className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-xl font-bold active:scale-90 transition-transform"
                        >+</button>
                      </div>
                    )}
                  </div>
                )}

                {type === "pledge" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Deadline <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      min={today}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-teal-brand outline-none text-gray-900 transition-colors"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("type")}
                    className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-medium text-gray-600 active:scale-95 transition-transform"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!text.trim() || (type === "habit" && scheduleMode === "specific_days" && scheduleDays.length === 0)}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-teal-brand disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  >
                    Make the Promise
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

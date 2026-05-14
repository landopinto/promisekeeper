"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppBadge } from "@/lib/storage";

const PARTICLES = ["🎉", "✨", "⭐", "🌟", "💛", "🧡", "🎊", "💪"];
const ANGLES = Array.from(
  { length: 8 },
  (_, i) => (i / 8) * 2 * Math.PI
);

interface Props {
  show: boolean;
  onDone: () => void;
  newBadge?: AppBadge | null;
  slipped?: boolean;
  priorStreak?: number;
  onUndo?: () => void;
}

export function Celebration({ show, onDone, newBadge, slipped, priorStreak, onUndo }: Props) {
  useEffect(() => {
    if (!show) return;
    const delay = onUndo ? 3000 : slipped ? 2200 : 1800;
    const t = setTimeout(onDone, delay);
    return () => clearTimeout(t);
  }, [show, onDone, slipped, onUndo]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: slipped ? 1.8 : 1.4 }}
        >
          {/* Particles — only for celebrations, not slips */}
          {!slipped && (
            <div className="absolute inset-0 flex items-center justify-center">
              {ANGLES.map((angle, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl select-none"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * 110,
                    y: Math.sin(angle) * 110,
                    opacity: [1, 1, 0],
                    scale: [0, 1.3, 0.9],
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {PARTICLES[i % PARTICLES.length]}
                </motion.span>
              ))}
            </div>
          )}

          <motion.div
            className={`rounded-3xl px-8 py-6 shadow-xl text-center mx-6 pointer-events-auto ${
              slipped ? "bg-amber-50 border border-amber-100" : "bg-white"
            }`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.05, 1], opacity: 1 }}
            transition={{ duration: 0.35, ease: "backOut" }}
          >
            {slipped ? (
              <>
                <p className="text-4xl mb-3">🫂</p>
                {priorStreak && priorStreak > 0 ? (
                  <>
                    <p className="text-lg font-bold text-amber-800 leading-snug">
                      You had a {priorStreak}-day streak.
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      That&apos;s real. Start again today.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-amber-800">
                      It&apos;s okay.
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Every day is a fresh start.
                    </p>
                  </>
                )}
              </>
            ) : newBadge ? (
              <>
                <p className="text-4xl mb-2">🏅</p>
                <p className="text-xl font-bold text-amber-700">
                  {newBadge.name}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  {newBadge.description}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-1">✓</p>
                <p className="text-2xl font-bold text-teal-brand">Kept!</p>
              </>
            )}

            {onUndo && (
              <button
                onClick={onUndo}
                className="mt-4 text-xs text-gray-400 underline underline-offset-2 active:text-gray-600"
              >
                Undo
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

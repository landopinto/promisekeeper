import type { TimeSlot } from "./storage";

export const SLOT_CONFIG: {
  id: TimeSlot;
  label: string;
  icon: string;
  colorClass: string;
}[] = [
  { id: "allday",    label: "All Day",   icon: "🌐", colorClass: "text-gray-500" },
  { id: "morning",   label: "Morning",   icon: "🌅", colorClass: "text-amber-500" },
  { id: "afternoon", label: "Afternoon", icon: "☀️",  colorClass: "text-orange-400" },
  { id: "evening",   label: "Evening",   icon: "🌙", colorClass: "text-indigo-400" },
];

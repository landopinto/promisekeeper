import type { AppBadge } from "@/lib/storage";

interface Props {
  badge: AppBadge;
  locked?: boolean;
}

export function BadgeChip({ badge, locked }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
        locked
          ? "bg-gray-100 text-gray-400"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      <span>{locked ? "🔒" : "🏅"}</span>
      <span>{badge.name}</span>
    </div>
  );
}

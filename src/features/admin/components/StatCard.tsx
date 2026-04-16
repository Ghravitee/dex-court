// src/features/admin/components/StatCard.tsx
import { Loader2 } from "lucide-react";

interface StatCardProps {
  singular: string;
  plural?: string;
  value: number;
  isLoading?: boolean;
  colorClass: string;
}

const COLOR_MAP: Record<string, string> = {
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300 [&_.label]:text-cyan-200",
  yellow:
    "border-yellow-400/30 bg-yellow-500/10 text-yellow-300 [&_.label]:text-yellow-200",
  blue: "border-blue-400/30 bg-blue-500/10 text-blue-300 [&_.label]:text-blue-200",
  emerald:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 [&_.label]:text-emerald-200",
  gray: "border-gray-400/30 bg-gray-500/10 text-gray-300 [&_.label]:text-gray-200",
  green:
    "border-green-400/30 bg-green-500/10 text-green-300 [&_.label]:text-green-200",
  purple:
    "border-purple-400/30 bg-purple-500/10 text-purple-300 [&_.label]:text-purple-200",
};

export function StatCard({
  singular,
  plural,
  value,
  isLoading,
  colorClass,
}: StatCardProps) {
  const classes = COLOR_MAP[colorClass] ?? COLOR_MAP.gray;

  const label = value === 1 ? singular : (plural ?? `${singular}s`);

  return (
    <div className={`rounded-xl border px-4 py-3 transition-all ${classes}`}>
      <div className="text-2xl font-bold tabular-nums">
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin opacity-60" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      <div className="label mt-0.5 text-xs font-medium">{label}</div>
    </div>
  );
}
